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
import Dashboard from "./components/Dashboard";
import { checkAuth } from "./api/auth";
import { AlertProvider } from "./components/AlertProvider";
import { ThemeProvider } from "./context/ThemeProvider";
import "./styles/App.css";
import "./styles/theme.css";
import "./styles/futuristic.css";

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
      return <div className="loader-container">
        <div className="loader"></div>
      </div>;
    }
    
    // Double-check token existence in case state is out of sync
    const token = localStorage.getItem("token");
    const isAuth = isAuthenticated || !!token;
    
    console.log("ProtectedRoute - Final auth check:", { stateAuth: isAuthenticated, tokenAuth: !!token });
    
    if (!isAuth) {
      console.warn("ProtectedRoute - Not authenticated, redirecting to signin");
      return <Navigate to="/signin" replace />;
    }
    
    console.log("ProtectedRoute - Authenticated, rendering child component");
    return children;
  };

  // Public route that redirects if already authenticated
  const AuthRoute = ({ element }) => {
    if (isAuthenticated) {
      return <Navigate to="/" replace />;
    }
    
    return element;
  };

  if (authLoading) {
    return (
      <div className="loader-container">
        <div className="loader"></div>
      </div>
    );
  }

  return (
    <ThemeProvider>
      <AlertProvider>
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
                <Route path="/dashboard" element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                } />
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
      </AlertProvider>
    </ThemeProvider>
  );
};

export default App;
