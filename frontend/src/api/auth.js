import axios from "axios";

const API_URL = "http://localhost:8000/api";

// Configure axios instance with authentication
const axiosWithAuth = axios.create({
  baseURL: API_URL,
});

// Add request interceptor to add token to all requests
axiosWithAuth.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Add response interceptor to handle token expiration
axiosWithAuth.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && (error.response.status === 401 || error.response.status === 403)) {
      // Clear local storage on authentication errors
      localStorage.removeItem("user");
      localStorage.removeItem("token");
      // Redirect to login page if not already there
      if (window.location.pathname !== "/signin") {
        window.location.href = "/signin";
      }
    }
    return Promise.reject(error);
  }
);

export const login = async (email, password) => {
  try {
    const response = await axios.post(`${API_URL}/auth/login`, {
      email,
      password,
    });
    
    if (response.data.success && response.data.token) {
      // Store token and user data in localStorage
      localStorage.setItem("token", response.data.token);
      localStorage.setItem("user", JSON.stringify(response.data.user));
      return response;
    }
    
    // Store user data even if success flag is not present
    if (response.data.user && response.data.token) {
      localStorage.setItem("token", response.data.token);
      localStorage.setItem("user", JSON.stringify(response.data.user));
    }
    
    return response;
  } catch (error) {
    console.error("Login error:", error);
    throw error;
  }
};

export const register = async (name, email, password) => {
  try {
    const response = await axios.post(`${API_URL}/users/signup`, {
      name,
      email,
      password,
    });
    return response;
  } catch (error) {
    console.error("Registration error:", error);
    throw error;
  }
};

export const logout = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
};

export const getUserProfile = async (userId) => {
  try {
    const response = await axiosWithAuth.get(`/auth/user/${userId}`);
    
    // If profile data is fetched successfully, also update localStorage
    if (response.data) {
      const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
      
      // Merge with existing data and update
      const updatedUser = {
        ...storedUser,
        name: response.data.name,
        email: response.data.email,
        role: response.data.role,
        profilePic: response.data.profilePic,
        createdAt: response.data.createdAt
      };
      
      localStorage.setItem("user", JSON.stringify(updatedUser));
    }
    
    return response;
  } catch (error) {
    console.error("Get user profile error:", error);
    throw error;
  }
};

export const updateUserProfile = async (userId, userData) => {
  try {
    const response = await axiosWithAuth.put(`/users/${userId}`, userData);
    return response;
  } catch (error) {
    console.error("Update user profile error:", error);
    throw error;
  }
};

export const updateUserProfilePicture = async (userId, formData) => {
  try {
    const response = await axiosWithAuth.post(
      `/users/${userId}/update-profile-picture`,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );
    return response;
  } catch (error) {
    console.error("Update profile picture error:", error);
    throw error;
  }
};

export const updateProfile = async (userId, userData) => {
  try {
    // Check if we have a profile picture file to upload
    if (userData.profilePic instanceof File) {
      // Create form data for file upload
      const formData = new FormData();
      formData.append('name', userData.name);
      formData.append('email', userData.email);
      formData.append('profilePic', userData.profilePic);
      
      // Use the update-profile endpoint with form data
      const response = await axiosWithAuth.put(
        `/auth/update-profile/${userId}`, 
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );
      return response;
    } else {
      // Regular update without file
      const response = await axiosWithAuth.put(`/auth/update-profile/${userId}`, {
        name: userData.name,
        email: userData.email
      });
      return response;
    }
  } catch (error) {
    console.error("Update profile error:", error);
    throw error;
  }
};

export const checkAuth = async () => {
  try {
    const token = localStorage.getItem("token");
    if (!token) {
      return { authenticated: false };
    }
    
    // Add user data from localStorage to the header
    const userData = localStorage.getItem("user");
    const config = {};
    if (userData) {
      config.headers = {
        'user-data': userData
      };
    }
    
    const response = await axiosWithAuth.get(`/auth/validate-token`, config);
    return { 
      authenticated: true,
      user: response.data.user
    };
  } catch (error) {
    console.error("Token validation error:", error);
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    return { authenticated: false };
  }
};

export default {
  login,
  register,
  logout,
  getUserProfile,
  updateUserProfile,
  updateUserProfilePicture,
  updateProfile,
  checkAuth,
}; 