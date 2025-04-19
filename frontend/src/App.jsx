import React, { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import Auction from "./components/Auction";
import Sell from "./components/Sell";
import Signin from "./components/Signin";
import Signup from "./components/Signup";
import Contact from "./components/Contact";
import MyBids from "./components/MyBids";
import Winners from "./components/winners";
import ResetPassword from "./components/ResetPassword";
import Profile from "./components/Profile";
import { checkAuth } from "./api/auth";

const App = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const validateToken = async () => {
      console.log("App: Validating authentication token");
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          console.warn("App: No token found in localStorage");
          setIsAuthenticated(false);
          setUser(null);
          setAuthLoading(false);
          return;
        }
        
        console.log("App: Token found, validating with server");
        const authStatus = await checkAuth();
        console.log("App: Auth validation result:", authStatus);
        
        setIsAuthenticated(authStatus.authenticated);
        if (authStatus.authenticated && authStatus.user) {
          console.log("App: Setting user data from validation");
          setUser(authStatus.user);
        } else {
          console.warn("App: Token invalid or user data missing");
          // Update localStorage to match the state
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          setUser(null);
        }
      } catch (error) {
        console.error("App: Token validation error:", error);
        setIsAuthenticated(false);
        setUser(null);
      } finally {
        setAuthLoading(false);
      }
    };

    validateToken();
  }, []);

  const handleLogin = (userData) => {
    setIsAuthenticated(true);
    setUser(userData);
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setIsAuthenticated(false);
    setUser(null);
  };

  // Protected route component
  const ProtectedRoute = ({ children }) => {
    console.log("ProtectedRoute - Authentication state:", { isAuthenticated, authLoading });
    
    if (authLoading) {
      // Show loading while checking authentication
      console.log("ProtectedRoute - Still loading auth state");
      return <div className="d-flex justify-content-center align-items-center vh-100">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>;
    }
    
    // Double-check token existence in case state is out of sync
    const token = localStorage.getItem("token");
    const isAuth = isAuthenticated || !!token;
    
    console.log("ProtectedRoute - Final auth check:", { stateAuth: isAuthenticated, tokenAuth: !!token });
    
    if (!isAuth) {
      // Not authenticated, redirect to signin
      console.warn("ProtectedRoute - Not authenticated, redirecting to signin");
      return <Navigate to="/signin" replace />;
    }
    
    // Authenticated, render the protected component
    console.log("ProtectedRoute - Authenticated, rendering child component");
    return children;
  };

  // Public route that redirects if already authenticated
  const AuthRoute = ({ element }) => {
    if (isAuthenticated) {
      // Already logged in, redirect to home
      return <Navigate to="/" replace />;
    }
    
    // Not authenticated, render the auth component
    return element;
  };

  if (authLoading) {
    return (
      <div className="d-flex justify-content-center align-items-center vh-100">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <div className="app-container">
        <Navbar 
          isAuthenticated={isAuthenticated} 
          user={user} 
          onLogout={handleLogout} 
        />
        <div className="content">
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<Auction />} />
            <Route path="/contact" element={<Contact />} />
            
            {/* Auth routes - redirect if already logged in */}
            <Route path="/signin" element={
              <AuthRoute element={<Signin setIsAuthenticated={setIsAuthenticated} onLogin={handleLogin} />} />
            } />
            <Route path="/signup" element={
              <AuthRoute element={<Signup />} />
            } />
            <Route path="/reset-password" element={
              <AuthRoute element={<ResetPassword />} />
            } />
            <Route path="/buyer-login" element={
              <AuthRoute element={<Signin setIsAuthenticated={setIsAuthenticated} onLogin={handleLogin} presetRole="buyer" />} />
            } />
            <Route path="/seller-login" element={
              <AuthRoute element={<Signin setIsAuthenticated={setIsAuthenticated} onLogin={handleLogin} presetRole="seller" />} />
            } />
            
            {/* Protected routes - only accessible when logged in */}
            <Route path="/profile" element={
              <ProtectedRoute>
                <Profile setIsAuthenticated={setIsAuthenticated} />
              </ProtectedRoute>
            } />
            <Route path="/sell" element={
              <ProtectedRoute>
                <Sell />
              </ProtectedRoute>
            } />
            <Route path="/mybids" element={
              <ProtectedRoute>
                <MyBids />
              </ProtectedRoute>
            } />
            <Route path="/winners" element={
              <ProtectedRoute>
                <Winners />
              </ProtectedRoute>
            } />
            
            {/* Catch all - redirect to home */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
        <Footer />
      </div>
    </BrowserRouter>
  );
};

export default App;
