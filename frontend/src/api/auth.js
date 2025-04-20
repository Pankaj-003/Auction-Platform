import { authAPI } from '../utils/apiClient';

// Explicit login function that uses the authAPI
export const login = async (email, password) => {
  try {
    console.log(`Attempting login for email: ${email}`);
    const response = await authAPI.login(email, password);
    console.log('Login response received:', response.status);
    
    if (response.data && response.data.token) {
      console.log('Login successful, token received');
      return response;
    } else {
      console.warn('Login API returned success but no token in response');
      return response;
    }
  } catch (error) {
    console.error('Login error in auth.js:', error);
    if (error.response) {
      console.error('API responded with error:', error.response.status, error.response.data);
    } else if (error.request) {
      console.error('No response received from API');
    } else {
      console.error('Error setting up request:', error.message);
    }
    throw error;
  }
};

// Check if user is authenticated (token is valid)
export const checkAuth = async () => {
  try {
    console.log('Validating authentication token...');
    const response = await authAPI.validateToken();
    const data = response.data;
    console.log('Token validation response:', data.status);
    
    // If successful, return authentication status and user details
    if (data.status === 'success' && data.user) {
      // Update userId in localStorage if missing
      if (data.user.id && (!localStorage.getItem('userId') || localStorage.getItem('userId') === 'undefined')) {
        localStorage.setItem('userId', data.user.id);
        console.log('Updated userId in localStorage:', data.user.id);
      }
      
      return {
        authenticated: true,
        user: data.user
      };
    }
    
    return { authenticated: false };
  } catch (error) {
    console.error('Authentication check failed:', error);
    
    // Clear tokens on authentication error
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('userId');
      console.log('Cleared tokens due to auth failure');
    }
    
    return { authenticated: false };
  }
};

// Login user
export const loginUser = async (email, password) => {
  try {
    const response = await authAPI.login(email, password);
    const data = response.data;
    
    if (data.success && data.token && data.user) {
      // Save auth data
      localStorage.setItem('token', data.token);
      localStorage.setItem('userId', data.user._id);
      
      return {
        success: true,
        user: data.user
      };
    }
    
    return {
      success: false,
      error: data.error || 'Login failed'
    };
  } catch (error) {
    const message = error.response?.data?.error || 'Login failed';
    return { success: false, error: message };
  }
};

// Register user (includes file upload)
export const registerUser = async (formData) => {
  try {
    const response = await authAPI.register(formData);
    const data = response.data;
    
    if (data.success && data.token && data.user) {
      // Save auth data
      localStorage.setItem('token', data.token);
      localStorage.setItem('userId', data.user._id);
      
      return {
        success: true,
        user: data.user
      };
    }
    
    return {
      success: false,
      error: data.error || 'Registration failed'
    };
  } catch (error) {
    const message = error.response?.data?.error || 'Registration failed';
    return { success: false, error: message };
  }
};

// Request password reset
export const forgotPassword = async (email) => {
  try {
    const response = await authAPI.forgotPassword(email);
    return {
      success: true,
      message: response.data.message
    };
  } catch (error) {
    const message = error.response?.data?.error || 'Failed to send reset email';
    return { success: false, error: message };
  }
};

// Reset password
export const resetPassword = async (email, newPassword) => {
  try {
    const response = await authAPI.resetPassword(email, newPassword);
    return {
      success: true,
      message: response.data.message
    };
  } catch (error) {
    const message = error.response?.data?.error || 'Failed to reset password';
    return { success: false, error: message };
  }
};

// Update user profile
export const updateUserProfile = async (userId, formData) => {
  try {
    const response = await authAPI.updateProfile(userId, formData);
    return {
      success: true,
      user: response.data
    };
  } catch (error) {
    const message = error.response?.data?.error || 'Failed to update profile';
    return { success: false, error: message };
  }
};

export const logout = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
};

// Get user profile
export const getUserProfile = async (userId) => {
  try {
    console.log(`Fetching profile for user ID: ${userId}`);
    const response = await authAPI.getUserProfile(userId);
    
    if (response && response.data) {
      console.log('User profile fetched successfully');
      
      // If profile data is fetched successfully, also update localStorage
      const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
      
      // Merge with existing data and update
      const updatedUser = {
        ...storedUser,
        userId: userId,
        name: response.data.name,
        email: response.data.email,
        role: response.data.role,
        profilePic: response.data.profilePic,
        createdAt: response.data.createdAt
      };
      
      localStorage.setItem("user", JSON.stringify(updatedUser));
      console.log('Updated user data in localStorage');
    }
    
    return response;
  } catch (error) {
    console.error("Error fetching user profile:", error);
    if (error.response && error.response.status === 401) {
      // Clear tokens on authentication error
      localStorage.removeItem('token');
      localStorage.removeItem('userId');
      console.log('Cleared tokens due to auth failure in profile fetch');
    }
    throw error;
  }
};

export const updateUserProfilePicture = async (userId, formData) => {
  try {
    console.log(`Updating profile picture for user ID: ${userId}`);
    // Use the more general updateProfile function which can handle form data
    const response = await authAPI.updateProfile(userId, formData);
    
    if (response && response.data) {
      console.log('Profile picture updated successfully');
      
      // Update localStorage with new profile picture
      const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
      
      // Update only the profile picture
      const updatedUser = {
        ...storedUser,
        profilePic: response.data.profilePic
      };
      
      localStorage.setItem("user", JSON.stringify(updatedUser));
      console.log('Updated profile picture in localStorage');
    }
    
    return response;
  } catch (error) {
    console.error("Error updating profile picture:", error);
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
      // Do not include email in updates
      formData.append('profilePic', userData.profilePic);
      
      // Use the update-profile endpoint with form data
      const response = await authAPI.updateProfile(userId, formData);
      return response;
    } else {
      // Regular update without file - do not include email
      const response = await authAPI.updateProfile(userId, {
        name: userData.name
        // Email is intentionally omitted as it cannot be changed
      });
      return response;
    }
  } catch (error) {
    console.error("Update profile error:", error);
    throw error;
  }
};

export default {
  loginUser,
  registerUser,
  logout,
  getUserProfile,
  updateUserProfile,
  updateUserProfilePicture,
  updateProfile,
  checkAuth,
  forgotPassword,
  resetPassword,
}; 