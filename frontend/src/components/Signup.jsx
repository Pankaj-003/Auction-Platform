import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import { FaCamera, FaEnvelope, FaLock, FaUser, FaUserTag, FaUserPlus } from "react-icons/fa";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "../styles/signup.css";
import axios from "axios";
import { useTheme } from "../context/ThemeProvider";

const API_BASE_URL = "http://localhost:8000";

const Signup = () => {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    profilePic: null,
    role: "unset" // Adding default role
  });

  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState(null);
  const [emailError, setEmailError] = useState("");

  const validatePassword = (password) => {
    const strongPasswordRegex =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    return strongPasswordRegex.test(password);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    
    // Clear email error when user changes the email
    if (name === 'email') {
      setEmailError("");
    }
  };

  // Check if email already exists in MongoDB before submission
  const checkEmailExists = async (email) => {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/api/auth/check-email`,
        { email },
        { headers: { "Content-Type": "application/json" }}
      );
      
      return response.data.exists;
    } catch (err) {
      console.error("Error checking email:", err);
      // Continue with signup even if email check fails
      return false;
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const allowedTypes = ["image/jpeg", "image/jpg", "image/png"];
      if (!allowedTypes.includes(file.type)) {
        toast.error("Only JPEG, JPG, or PNG files are allowed.");
        return;
      }
      
      // Check file size (limit to 2MB)
      if (file.size > 2 * 1024 * 1024) {
        toast.error("Image file size must be less than 2MB.");
        return;
      }
      
      setForm((prev) => ({ ...prev, profilePic: file }));
      setPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.name || !form.email || !form.password || !form.confirmPassword) {
      toast.error("All fields are required.");
      return;
    }

    if (form.password !== form.confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }

    if (!validatePassword(form.password)) {
      toast.error(
        "Password must be at least 8 characters, include uppercase, lowercase, number, and special character."
      );
      return;
    }

    setLoading(true);
    
    try {
      // First check if email already exists
      const emailExists = await checkEmailExists(form.email);
      
      if (emailExists) {
        setEmailError("This email is already registered. Please use a different email or sign in.");
        toast.error("Email already exists. Please use a different email.");
        setLoading(false);
        return;
      }
      
      const formData = new FormData();
      formData.append("name", form.name);
      formData.append("email", form.email);
      formData.append("password", form.password);
      formData.append("role", form.role);
      
      // Only append profile picture if one was selected
      if (form.profilePic) {
        formData.append("profilePic", form.profilePic);
      }

      // Debugging
      console.log("Form data being sent:", {
        name: form.name,
        email: form.email,
        role: form.role,
        hasProfilePic: !!form.profilePic
      });

      // Use a single endpoint with better error handling
      try {
        const response = await axios.post(
          `${API_BASE_URL}/api/auth/signup`, 
          formData,
          { 
            headers: { "Content-Type": "multipart/form-data" },
            timeout: 10000 // 10 second timeout
          }
        );
        
        if (response.data) {
          toast.success("Signup successful! Redirecting to login page.");
          setTimeout(() => navigate("/signin"), 2000);
        }
      } catch (error) {
        console.error("Signup request failed:", error);
        
        // Detailed error handling
        if (error.code === 'ECONNABORTED') {
          toast.error("Request timed out. Please check your internet connection and try again.");
        } else if (!error.response) {
          toast.error("Cannot connect to server. Please check your internet connection.");
        } else if (error.response.status === 409) {
          setEmailError("This email is already registered. Please use a different email.");
          toast.error("Email already exists. Please use a different email.");
        } else if (error.response.status === 400) {
          toast.error(error.response.data.error || "Please check your information and try again.");
        } else if (error.response.status >= 500) {
          toast.error("Server error. Please try again later.");
        } else {
          // Try alternative endpoint as fallback
          try {
            const altResponse = await axios.post(
              `${API_BASE_URL}/api/users/signup`,
              formData,
              { 
                headers: { "Content-Type": "multipart/form-data" },
                timeout: 10000
              }
            );
            
            if (altResponse.data) {
              toast.success("Signup successful! Redirecting to login page.");
              setTimeout(() => navigate("/signin"), 2000);
              return;
            }
          } catch (altError) {
            console.error("Alternative signup attempt failed:", altError);
            
            if (altError.response && altError.response.data && altError.response.data.error) {
              if (altError.response.data.error.includes('duplicate key') || 
                  altError.response.data.error.includes('E11000')) {
                setEmailError("This email is already registered. Please use a different email.");
                toast.error("Email already exists. Please use a different email.");
              } else {
                toast.error(altError.response.data.error);
              }
            } else {
              toast.error("Signup failed. Please try again later.");
            }
          }
        }
      }
    } catch (err) {
      console.error("Signup process error:", err);
      toast.error("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`auth-container ${isDark ? 'dark' : 'light'}`}>
      <div className="auth-card">
        <div className="text-center mb-4">
          <h2 className="auth-title">Create Account</h2>
          <p className="auth-subtitle">Join the AuctionHub community</p>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Profile Picture Upload Section */}
          <div className="d-flex justify-content-center mb-4">
            <div className="profile-upload-container">
              {preview ? (
                <img
                  src={preview}
                  alt="profile"
                  className="profile-preview"
                />
              ) : (
                <div className="profile-placeholder">
                  <FaUser size={40} />
                </div>
              )}
              <label
                htmlFor="profileUpload"
                className="camera-icon"
              >
                <FaCamera size={12} />
              </label>
              <input
                type="file"
                id="profileUpload"
                accept=".png, .jpeg, .jpg"
                onChange={handleImageChange}
                style={{ display: "none" }}
              />
            </div>
          </div>

          <div className="form-group">
            <div className="input-group">
              <span className="input-group-icon">
                <FaUser />
              </span>
              <input
                type="text"
                name="name"
                className="auth-input"
                placeholder="Full Name"
                value={form.name}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <div className="input-group">
              <span className="input-group-icon">
                <FaEnvelope />
              </span>
              <input
                type="email"
                name="email"
                className={`auth-input ${emailError ? 'is-invalid' : ''}`}
                placeholder="Email Address"
                value={form.email}
                onChange={handleChange}
                required
              />
            </div>
            {emailError && (
              <div className="error-message">
                {emailError}
              </div>
            )}
          </div>

          <div className="form-group">
            <div className="input-group">
              <span className="input-group-icon">
                <FaLock />
              </span>
              <input
                type="password"
                name="password"
                className="auth-input"
                placeholder="Password"
                value={form.password}
                onChange={handleChange}
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
                name="confirmPassword"
                className="auth-input"
                placeholder="Confirm Password"
                value={form.confirmPassword}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <button
            type="submit"
            className="auth-button"
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                Creating Account...
              </>
            ) : (
              <>
                <FaUserPlus className="me-2" />
                Sign Up
              </>
            )}
          </button>

          <div className="text-center mt-3">
            <p className="alternate-action">
              Already have an account?{" "}
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

export default Signup;
