import React, { useState } from "react";
import { Link } from "react-router-dom";
import { FaEnvelope, FaRedo } from "react-icons/fa";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "../styles/auth.css";
import { useTheme } from "../context/ThemeProvider";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setError("");
    setLoading(true);

    try {
      const res = await fetch("http://localhost:8000/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();
      if (res.ok) {
        setMessage(data.message);
        toast.success(data.message || "Reset instructions sent to your email.");
      } else {
        setError(data.error || "Failed to send reset email.");
        toast.error(data.error || "Failed to send reset email.");
      }
    } catch (err) {
      console.error("Fetch error:", err);
      setError("Something went wrong.");
      toast.error("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`auth-container ${isDark ? 'dark' : 'light'}`}>
      <div className="auth-card">
        <div className="text-center mb-4">
          <h2 className="auth-title">Forgot Password</h2>
          <p className="auth-subtitle">Enter your email to receive reset instructions</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <div className="input-group">
              <span className="input-group-icon">
                <FaEnvelope />
              </span>
              <input
                type="email"
                className="auth-input"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
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
                Sending...
              </>
            ) : (
              <>
                <FaRedo className="me-2" />
                Reset Password
              </>
            )}
          </button>

          <div className="text-center mt-3">
            <p className="alternate-action">
              Remember your password?{" "}
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

export default ForgotPassword;
