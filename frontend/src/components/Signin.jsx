import React, { useState, useEffect, useContext } from "react";
import { useNavigate, Link } from "react-router-dom";
import ForgotPassword from "./ForgotPassword";
import { FaEnvelope, FaLock, FaSignInAlt } from "react-icons/fa";
import { login } from "../api/auth";
import { AuthContext } from "../context/AuthContext";

const Signin = ({ presetRole = "" }) => {
  const navigate = useNavigate();
  const { login: authLogin, isAuthenticated } = useContext(AuthContext);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);

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
    return (
      <div className="d-flex justify-content-center align-items-center vh-100" style={{ background: "linear-gradient(135deg, #222831 0%, #393E46 100%)" }}>
        <div className="card p-4 shadow-lg" style={{ width: "400px", borderRadius: "15px", border: "none" }}>
          <button
            className="btn btn-link text-start p-0 mb-3 text-decoration-none"
            style={{ color: "#00ADB5" }}
            onClick={() => setShowForgotPassword(false)}
          >
            ← Back to Sign In
          </button>
          <ForgotPassword />
        </div>
      </div>
    );
  }

  return (
    <div className="d-flex justify-content-center align-items-center vh-100" style={{ background: "linear-gradient(135deg, #222831 0%, #393E46 100%)" }}>
      <div className="card p-4 shadow-lg" style={{ width: "400px", borderRadius: "15px", border: "none" }}>
        <h2 className="text-center mb-4" style={{ color: "#00ADB5" }}>
          <FaSignInAlt className="me-2" />
          {presetRole ? `${presetRole.charAt(0).toUpperCase() + presetRole.slice(1)} Login` : "Sign In"}
        </h2>

        {error && (
          <div className="alert alert-danger" role="alert">
            {error}
          </div>
        )}

        <form onSubmit={handleSignin}>
          <div className="mb-3">
            <label htmlFor="email" className="form-label d-flex align-items-center">
              <FaEnvelope className="me-2" />
              Email
            </label>
            <input
              type="email"
              className="form-control"
              id="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="mb-3">
            <label htmlFor="password" className="form-label d-flex align-items-center">
              <FaLock className="me-2" />
              Password
            </label>
            <input
              type="password"
              className="form-control"
              id="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button
            type="button"
            className="btn btn-link p-0 mb-3"
            onClick={() => setShowForgotPassword(true)}
            style={{ color: "#00ADB5" }}
          >
            Forgot password?
          </button>

          <button
            type="submit"
            className="btn btn-primary w-100 mb-3"
            style={{ backgroundColor: "#00ADB5", borderColor: "#00ADB5" }}
            disabled={loading}
          >
            {loading ? (
              <span>
                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                Signing in...
              </span>
            ) : (
              "Sign In"
            )}
          </button>

          <div className="text-center">
            <span>Don't have an account? </span>
            <Link to="/signup" style={{ color: "#00ADB5" }}>
              Sign up
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Signin;
