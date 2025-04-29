import axios from "axios";

const API_URL = "http://localhost:8000";

// Create axios instance with base configuration
const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor to add auth token to all requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers["Authorization"] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle 401 Unauthorized errors - clear auth and redirect to login
    if (error.response && error.response.status === 401) {
      localStorage.removeItem("user");
      localStorage.removeItem("token");
      window.location.href = "/signin";
    }
    return Promise.reject(error);
  }
);

// Authentication API calls
export const authAPI = {
  login: async (credentials) => {
    // Try multiple endpoints to find the working one
    const endpoints = [
      "/api/auth/login",
      "/api/users/signin",
      "/auth/login",
      "/users/signin",
      "/login"
    ];
    
    let lastError = null;
    
    // Try each endpoint
    for (const endpoint of endpoints) {
      try {
        const response = await api.post(endpoint, credentials);
        return response;
      } catch (error) {
        console.log(`Endpoint ${endpoint} failed:`, error.message);
        lastError = error;
        // Continue to next endpoint
      }
    }
    
    // If we get here, all endpoints failed
    throw lastError || new Error("All login endpoints failed");
  },
  signup: (userData) => {
    const formData = new FormData();
    for (const key in userData) {
      formData.append(key, userData[key]);
    }
    return axios.post(`${API_URL}/api/auth/signup`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
  },
  forgotPassword: (email) => api.post("/api/auth/forgot-password", { email }),
  resetPassword: (data) => api.post("/api/auth/reset-password", data),
  getUserProfile: (userId) => api.get(`/api/auth/user/${userId}`),
  updateProfile: (userId, userData) => {
    const formData = new FormData();
    for (const key in userData) {
      if (userData[key] !== null && userData[key] !== undefined) {
        formData.append(key, userData[key]);
      }
    }
    return api.put(`/api/auth/update-profile/${userId}`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
  },
};

// Auction API calls
export const auctionAPI = {
  getAllAuctions: () => api.get("/api/auctions"),
  getAuctionById: (id) => api.get(`/api/auctions/${id}`),
  createAuction: (auctionData) => {
    const formData = new FormData();
    for (const key in auctionData) {
      if (key === "images") {
        auctionData.images.forEach((image) => {
          formData.append("images", image);
        });
      } else {
        formData.append(key, auctionData[key]);
      }
    }
    return api.post("/api/auctions", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
  },
  updateAuction: (id, auctionData) => api.put(`/api/auctions/${id}`, auctionData),
  deleteAuction: (id) => api.delete(`/api/auctions/${id}`),
};

// Bid API calls
export const bidAPI = {
  placeBid: (auctionId, bidAmount) => api.post(`/api/bids/${auctionId}`, { bidAmount }),
  getUserBids: () => api.get("/api/bids/user"),
  getAuctionBids: (auctionId) => api.get(`/api/bids/auction/${auctionId}`),
};

// Watchlist API calls
export const watchlistAPI = {
  getWatchlist: (userId) => api.get(`/api/watchlist/${userId}`),
  addToWatchlist: (userId, auctionId) => api.post('/api/watchlist', { userId, auctionId }),
  removeFromWatchlist: (watchlistId, userId) => api.delete(`/api/watchlist/${watchlistId}`, { data: { userId } }),
  checkWatchlistStatus: (userId, auctionId) => api.get(`/api/watchlist/check/${userId}/${auctionId}`),
};

// Profile API calls
export const profileAPI = {
  getProfileSummary: (userId) => api.get(`/api/profile/summary/${userId}`),
  getActiveBids: (userId) => api.get(`/api/profile/active-bids/${userId}`),
  getWonAuctions: (userId) => api.get(`/api/profile/won-auctions/${userId}`),
  getUserListings: (userId) => api.get(`/api/profile/listings/${userId}`),
  getBidHistory: (userId, auctionId) => api.get(`/api/profile/bid-history/${userId}/${auctionId}`),
};

// Utility functions
export const getAuthHeader = () => {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export const handleLogout = () => {
  localStorage.removeItem("user");
  localStorage.removeItem("token");
  window.location.href = "/signin";
};

export default api;
