import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000/api';

/**
 * Creates and configures an axios instance for API requests
 * with automatic token inclusion and error handling
 */
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  // Add timeout to prevent hanging requests
  timeout: 15000,
  // Add retry logic for network errors
  retry: 3,
  retryDelay: 1000
});

// Add retry logic to handle network errors like ECONNRESET
apiClient.interceptors.response.use(null, async (error) => {
  const { config } = error;
  
  // Only retry on network errors or 5xx server errors
  if (
    !config || 
    !config.retry || 
    config.retry <= 0 ||
    (error.response && error.response.status < 500 && error.response.status !== 0)
  ) {
    return Promise.reject(error);
  }
  
  // If it's a network error (ECONNRESET, etc.) or server error (5xx), retry
  if (!error.response || error.code === 'ECONNRESET' || error.response.status >= 500) {
    console.log(`Retrying request (${config.url}) due to network error, attempt ${config.retry}`);
    
    // Delay before retry
    await new Promise(resolve => setTimeout(resolve, config.retryDelay));
    
    // Update retry count
    config.retry--;
    
    // Create new promise with retry
    return apiClient(config);
  }
  
  return Promise.reject(error);
});

// Request interceptor to add authorization token to all requests
apiClient.interceptors.request.use(
  (config) => {
    // Add retry configuration to each request
    config.retry = config.retry || 3;
    config.retryDelay = config.retryDelay || 1000;
    
    const token = localStorage.getItem('token');
    
    // Add token to Authorization header if available
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    } else {
      console.warn('API request made without authentication token');
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle common error cases
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    // If it's already being handled by the retry interceptor, let it continue
    if (error.config && error.config.retry && error.config.retry < 3) {
      return Promise.reject(error);
    }
    
    // Handle authentication errors
    if (error.response && error.response.status === 401) {
      // Handle token expiration
      if (error.response.data.error === 'expired_token') {
        console.log('Token expired, redirecting to login');
        localStorage.removeItem('token');
        localStorage.removeItem('userId');
        window.location.href = '/signin';
      }
      
      // Handle invalid token
      if (error.response.data.error === 'invalid_token' || 
          error.response.data.error === 'user_not_found') {
        console.log('Invalid token, redirecting to login');
        localStorage.removeItem('token');
        localStorage.removeItem('userId');
        window.location.href = '/signin';
      }
    }
    
    return Promise.reject(error);
  }
);

// Authentication APIs
export const authAPI = {
  login: (email, password) => 
    apiClient.post('/auth/login', { email, password }),
  
  register: (formData) => 
    apiClient.post('/auth/signup', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }),
  
  validateToken: () => 
    apiClient.get('/auth/validate-token'),
  
  updateProfile: (userId, formData) =>
    apiClient.put(`/auth/update-profile/${userId}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }),
  
  getUserProfile: (userId) =>
    apiClient.get(`/auth/user/${userId}`),
  
  forgotPassword: (email) => 
    apiClient.post('/auth/forgot-password', { email }),
  
  resetPassword: (email, newPassword) => 
    apiClient.post('/auth/reset-password', { email, newPassword })
};

// Auction APIs
export const auctionAPI = {
  getAll: () => 
    apiClient.get('/auctions'),
  
  getById: (auctionId) => 
    apiClient.get(`/auctions/${auctionId}`),
  
  create: (auctionData) => 
    apiClient.post('/auctions/add', auctionData),
    
  placeBid: (auctionId, amount) => 
    apiClient.post(`/bids/${auctionId}`, { amount })
};

// Watchlist APIs
export const watchlistAPI = {
  getByUser: (userId) => 
    apiClient.get(`/watchlist/${userId}`),
  
  addToWatchlist: (userId, auctionId) => 
    apiClient.post(`/watchlist/${userId}`, { auctionId }),
  
  removeFromWatchlist: (userId, auctionId) => 
    apiClient.delete(`/watchlist/${userId}/${auctionId}`)
};

export default apiClient; 