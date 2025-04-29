import React, { useState, useEffect, useContext } from "react";
import { useNavigate, Link } from "react-router-dom";
import ForgotPassword from "./ForgotPassword";
import { FaEnvelope, FaLock, FaSignInAlt } from "react-icons/fa";
import { login } from "../api/auth";
import { AuthContext } from "../context/AuthContext";
import "../styles/auth.css";
import { useTheme } from "../context/ThemeProvider";

const Signin = ({ presetRole = "" }) => {
  const navigate = useNavigate();
  const { login: authLogin, isAuthenticated } = useContext(AuthContext);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  // Check if already logged in
  useEffect(() => {
    const user = localStorage.getItem("user");
    const token = localStorage.getItem("token");
    
    if (user && token && isAuthenticated) {
      // Already logged in - redirect to home
      navigate("/");
    }
  }, [navigate, isAuthenticated]);

  const handleSignin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // Clean up any old data first
      localStorage.removeItem("user");
      localStorage.removeItem("token");
      localStorage.removeItem("userId");
      
      console.log("Starting login process for:", email);
      
      // Use the auth API for login
      const response = await login(email, password);
      
      console.log("Login response received");
      
      // Check for user data and token
      if (!response.data || !response.data.user) {
        console.error("Invalid response format from server:", response.data);
        throw new Error("Invalid response from server");
      }
      
      // Check preset role if provided
      if (presetRole && response.data.user.role !== presetRole) {
        setError(`This login is only for ${presetRole}s`);
        setLoading(false);
        return;
      }
      
      // Extract user data
      const userData = {
        userId: response.data.user._id || response.data.user.id,
        name: response.data.user.name || "",
        email: response.data.user.email || "",
        role: response.data.user.role || "user",
        profilePic: response.data.user.profilePic || ""
      };
      
      // Save user data in localStorage
      localStorage.setItem("user", JSON.stringify(userData));
      localStorage.setItem("token", response.data.token);
      localStorage.setItem("userId", userData.userId);
      
      console.log("Login successful, saved data:", {
        token: !!response.data.token,
        userId: userData.userId,
        user: userData.name
      });
      
      // Update authentication state using context
      authLogin(userData);
      
      // Navigate to home page
      navigate("/");
      
    } catch (err) {
      console.error("Login error in Signin.jsx:", err);
      
      // Handle specific error scenarios
      if (err.response) {
        // API error responses
        console.error("API error response:", err.response.status, err.response.data);
        if (err.response.status === 401) {
          setError("Invalid email or password. Please try again.");
        } else if (err.response.status === 404) {
          setError("User not found. Please check your email.");
        } else if (err.response.status === 400) {
          setError("Invalid login request. Please check your details.");
        } else if (err.response.status >= 500) {
          setError("Server error. Please try again later.");
        } else {
          setError(err.response.data?.error || "Login failed. Please check your credentials.");
        }
      } else if (err.request) {
        // No response received
        console.error("No response from server", err.request);
        setError("Server not responding. Please check your connection.");
      } else {
        // Other errors
        console.error("Other login error:", err.message);
        setError(err.message || "An error occurred during login. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  if (showForgotPassword) {
    return <ForgotPassword onBack={() => setShowForgotPassword(false)} />;
  }

  return (
    <div className={`auth-container ${isDark ? 'dark' : 'light'}`}>
      <div className="particle"></div>
      <div className="particle"></div>
      <div className="particle"></div>
      <div className="auth-card">
        <div className="text-center mb-4">
          <h2 className="auth-title">
            {presetRole ? `${presetRole.charAt(0).toUpperCase() + presetRole.slice(1)} Login` : "Sign In"}
          </h2>
          <p className="auth-subtitle">Welcome back to AuctionHub</p>
        </div>

        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        <form onSubmit={handleSignin}>
          <div className="form-group">
            <div className="input-group">
              <span className="input-group-icon">
                <FaEnvelope />
              </span>
              <input
                type="email"
                className="auth-input"
                placeholder="Email Address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <div className="input-group">
              <span className="input-group-icon">
                <FaLock />
              </span>
              <input
                type="password"
                className="auth-input"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="text-end mb-3">
            <button
              type="button"
              className="auth-link"
              onClick={() => setShowForgotPassword(true)}
            >
              Forgot password?
            </button>
          </div>

          <button
            type="submit"
            className="auth-button"
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                Signing in...
              </>
            ) : (
              <>
                <FaSignInAlt className="me-2" />
                Sign In
              </>
            )}
          </button>

          <div className="text-center mt-3">
            <p className="alternate-action">
              Don't have an account?{" "}
              <Link to="/signup" className="auth-link">
                Sign Up
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Signin;
