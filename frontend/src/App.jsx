import React, { useContext } from "react";
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
import { AuthProvider, AuthContext } from "./context/AuthContext";
import { AlertProvider } from "./components/AlertProvider";
import { ThemeProvider } from "./context/ThemeProvider";
import "./styles/App.css";
import "./styles/theme.css";
import "./styles/futuristic.css";

// Protected route component
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, authLoading } = useContext(AuthContext);
  
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
  const { isAuthenticated } = useContext(AuthContext);
  
  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }
  
  return element;
};

const AppContent = () => {
  const { authLoading, isAuthenticated, user, logout, login } = useContext(AuthContext);

  if (authLoading) {
    return (
      <div className="loader-container">
        <div className="loader"></div>
      </div>
    );
  }

  return (
    <div className="app-container">
      <Navbar 
        isAuthenticated={isAuthenticated} 
        user={user} 
        onLogout={logout} 
      />
      <div className="content">
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<Auction />} />
          <Route path="/contact" element={<Contact />} />
          
          {/* Auth routes - redirect if already logged in */}
          <Route path="/signin" element={
            <AuthRoute element={<Signin setIsAuthenticated={login} onLogin={login} />} />
          } />
          <Route path="/signup" element={
            <AuthRoute element={<Signup />} />
          } />
          <Route path="/reset-password" element={
            <AuthRoute element={<ResetPassword />} />
          } />
          <Route path="/buyer-login" element={
            <AuthRoute element={<Signin setIsAuthenticated={login} onLogin={login} presetRole="buyer" />} />
          } />
          <Route path="/seller-login" element={
            <AuthRoute element={<Signin setIsAuthenticated={login} onLogin={login} presetRole="seller" />} />
          } />
          
          {/* Protected routes - only accessible when logged in */}
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } />
          <Route path="/profile" element={
            <ProtectedRoute>
              <Profile />
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
  );
};

const App = () => {
  return (
    <AuthProvider>
      <ThemeProvider>
        <AlertProvider>
          <BrowserRouter>
            <AppContent />
          </BrowserRouter>
        </AlertProvider>
      </ThemeProvider>
    </AuthProvider>
  );
};

export default App;
