import React, { createContext, useState, useEffect } from 'react';
import { checkAuth } from '../api/auth';

// Create the auth context with default values
const AuthContext = createContext({
  isAuthenticated: false,
  authLoading: true,
  user: null,
  setUser: () => {},
  login: () => {},
  logout: () => {}
});

// Create the provider as a named function (better for debugging)
function AuthProvider({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const validateToken = async () => {
      console.log("AuthContext: Validating authentication token");
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          console.warn("AuthContext: No token found in localStorage");
          setIsAuthenticated(false);
          setUser(null);
          setAuthLoading(false);
          return;
        }
        
        console.log("AuthContext: Token found, validating with server");
        const authStatus = await checkAuth();
        console.log("AuthContext: Auth validation result:", authStatus);
        
        setIsAuthenticated(authStatus.authenticated);
        if (authStatus.authenticated && authStatus.user) {
          console.log("AuthContext: Setting user data from validation");
          setUser(authStatus.user);
        } else {
          console.warn("AuthContext: Token invalid or user data missing");
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          setUser(null);
        }
      } catch (error) {
        console.error("AuthContext: Token validation error:", error);
        setIsAuthenticated(false);
        setUser(null);
      } finally {
        setAuthLoading(false);
      }
    };

    validateToken();
  }, []);

  const login = (userData) => {
    setIsAuthenticated(true);
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("userId");
    setIsAuthenticated(false);
    setUser(null);
  };

  const contextValue = {
    isAuthenticated,
    authLoading,
    user,
    setUser,
    login,
    logout
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

export { AuthContext, AuthProvider }; 