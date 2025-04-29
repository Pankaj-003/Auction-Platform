/**
 * Authentication utilities for client-side checks 
 * Implements functions directly to avoid circular dependencies with auth.js
 */

/**
 * Simple check if user is authenticated based on token presence
 * @returns {boolean} True if token exists
 */
export const isAuthenticated = () => {
  return localStorage.getItem('token') !== null;
};

/**
 * Get the current user from localStorage
 * @returns {Object|null} User object or null
 */
export const getUser = () => {
  try {
    const userData = localStorage.getItem('user');
    if (!userData) return null;
    
    return JSON.parse(userData);
  } catch (error) {
    console.error('Error parsing user data from localStorage:', error);
    return null;
  }
};

/**
 * Get user ID from localStorage
 * @returns {string|null} User ID or null
 */
export const getUserId = () => {
  return localStorage.getItem('userId');
};

/**
 * Clear all auth data from localStorage (logout helper)
 */
export const clearAuthData = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  localStorage.removeItem('userId');
};

/**
 * Simple implementation to check auth status
 * Note: This doesn't make API calls - use the one from api/auth.js for verified status
 */
export const checkAuth = () => {
  const token = localStorage.getItem('token');
  if (!token) {
    return { isAuthenticated: false, user: null };
  }
  
  try {
    const userData = localStorage.getItem('user');
    if (!userData) {
      return { isAuthenticated: true, user: null };
    }
    
    const user = JSON.parse(userData);
    return { isAuthenticated: true, user };
  } catch (error) {
    console.error('Error checking auth status:', error);
    return { isAuthenticated: true, user: null };
  }
}; 