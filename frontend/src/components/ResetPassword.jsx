import React, { useState } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { FaLock, FaCheckCircle } from "react-icons/fa";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "../styles/auth.css";
import { useTheme } from "../context/ThemeProvider";

const ResetPassword = () => {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const location = useLocation();
  const navigate = useNavigate();
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  // Extract email from query params
  const queryParams = new URLSearchParams(location.search);
  const email = queryParams.get("email");

  const validatePassword = (password) => {
    const strongPasswordRegex =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    return strongPasswordRegex.test(password);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      toast.error("Passwords do not match.");
      return;
    }

    if (!validatePassword(password)) {
      setError("Password must be at least 8 characters, include uppercase, lowercase, number, and special character.");
      toast.error("Password doesn't meet security requirements.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("http://localhost:8000/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (res.ok) {
        setMessage(data.message);
        toast.success(data.message || "Password updated successfully!");
        setTimeout(() => navigate("/signin"), 2000); // Redirect after success
      } else {
        setError(data.error || "Password reset failed.");
        toast.error(data.error || "Password reset failed.");
      }
    } catch (err) {
      console.error("Reset error:", err);
      setError("Something went wrong.");
      toast.error("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (!email) {
    return (
      <div className={`auth-container ${isDark ? 'dark' : 'light'}`}>
        <div className="auth-card">
          <div className="text-center mb-4">
            <h2 className="auth-title">Invalid Request</h2>
            <p className="auth-subtitle">Missing email parameter. Please use the reset link sent to your email.</p>
            <div className="mt-4">
              <Link to="/forgot-password" className="auth-button">
                Return to Forgot Password
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`auth-container ${isDark ? 'dark' : 'light'}`}>
      <div className="auth-card">
        <div className="text-center mb-4">
          <h2 className="auth-title">Reset Password</h2>
          <p className="auth-subtitle">Create a new password for your account</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <div className="input-group">
              <span className="input-group-icon">
                <FaLock />
              </span>
              <input
                type="password"
                className="auth-input"
                placeholder="New Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <small className="password-requirements">
              Must be at least 8 characters with uppercase, lowercase, number, and special character
            </small>
          </div>

          <div className="form-group">
            <div className="input-group">
              <span className="input-group-icon">
                <FaLock />
              </span>
              <input
                type="password"
                className="auth-input"
                placeholder="Confirm New Password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>
            
            {error && (
              <div className="error-message">
                {error}
              </div>
            )}
            {message && (
              <div className="success-message">
                {message}
              </div>
            )}
          </div>

          <button
            type="submit"
            className="auth-button"
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                Updating...
              </>
            ) : (
              <>
                <FaCheckCircle className="me-2" />
                Update Password
              </>
            )}
          </button>

          <div className="text-center mt-3">
            <p className="alternate-action">
              Return to{" "}
              <Link to="/signin" className="auth-link">
                Sign In
              </Link>
            </p>
          </div>
        </form>
      </div>

      {/* Toast container */}
      <ToastContainer position="top-center" autoClose={3000} theme={isDark ? "dark" : "light"} />
    </div>
  );
};

export default ResetPassword;
