import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import { FaCamera, FaEnvelope, FaLock, FaUser, FaUserTag, FaUserPlus } from "react-icons/fa";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "../signup.css";
import axios from "axios";

const Signup = () => {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "buyer",
    profilePic: null,
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
      // Try first API endpoint
      const response = await axios.post(
        "http://localhost:8000/api/users/check-email",
        { email },
        { headers: { "Content-Type": "application/json" }}
      );
      
      return response.data.exists;
    } catch (err) {
      // If first endpoint fails, try alternative endpoint
      try {
        const altResponse = await axios.post(
          "http://localhost:8000/api/auth/check-email",
          { email },
          { headers: { "Content-Type": "application/json" }}
        );
        
        return altResponse.data.exists;
      } catch (altErr) {
        // If both endpoints fail, assume we need to continue with signup
        console.error("Could not check email existence:", altErr);
        return false;
      }
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
      if (form.profilePic) {
        formData.append("profilePic", form.profilePic);
      }

      try {
        // Try the first endpoint
        const response = await axios.post(
          "http://localhost:8000/api/auth/signup",
          formData,
          { headers: { "Content-Type": "multipart/form-data" }}
        );
        
        if (response.data) {
          toast.success("Signup successful! Please log in.");
          setTimeout(() => navigate("/signin"), 2000);
        }
      } catch (mainError) {
        // If first endpoint fails, try alternative endpoint
        try {
          const altResponse = await axios.post(
            "http://localhost:8000/api/users/signup",
            formData,
            { headers: { "Content-Type": "multipart/form-data" }}
          );
          
          if (altResponse.data) {
            toast.success("Signup successful! Please log in.");
            setTimeout(() => navigate("/signin"), 2000);
          }
        } catch (altError) {
          // Handle specific MongoDB error cases
          if (altError.response && altError.response.data) {
            if (altError.response.data.error && altError.response.data.error.includes('duplicate key')) {
              setEmailError("This email is already registered. Please use a different email.");
              toast.error("Email already exists. Please use a different email.");
            } else {
              toast.error(altError.response.data.error || "Signup failed. Try again.");
            }
          } else {
            toast.error("Signup failed. Please try again.");
          }
        }
      }
    } catch (err) {
      console.error("Signup error:", err);
      
      // Check for MongoDB duplicate key error (E11000)
      if (err.response && err.response.data && 
          (err.response.data.error?.includes('duplicate key') || 
           err.response.data.error?.includes('E11000'))) {
        setEmailError("This email is already registered. Please use a different email.");
        toast.error("Email already exists. Please use a different email.");
      } else {
        toast.error("Server error. Please try again later.");
      }
    }

    setLoading(false);
  };

  return (
    <div 
      className="d-flex justify-content-center align-items-center vh-100" 
      style={{ background: "linear-gradient(135deg, #222831 0%, #393E46 100%)" }}
    >
      <div 
        className="card p-4 shadow-lg" 
        style={{ 
          width: "400px", 
          borderRadius: "15px", 
          border: "none", 
          background: "#EEEEEE" 
        }}
      >
        <div className="text-center mb-3">
          <h2 style={{ color: "#222831", fontWeight: "bold" }}>Create Account</h2>
          <p className="text-muted">Join the AuctionHub community</p>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Profile Picture Upload Section */}
          <div className="d-flex justify-content-center mb-4">
            <div
              className="position-relative"
              style={{
                width: "120px",
                height: "120px",
                borderRadius: "50%",
                backgroundColor: preview ? "#f0f0f0" : "#00ADB5",
                overflow: "hidden",
                border: "2px solid #00ADB5",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 4px 8px rgba(0,0,0,0.1)",
              }}
            >
              {preview ? (
                <img
                  src={preview}
                  alt="profile"
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                  }}
                />
              ) : (
                <FaUser color="white" size={40} />
              )}
              <label
                htmlFor="profileUpload"
                className="position-absolute"
                style={{
                  bottom: "5px",
                  right: "5px",
                  backgroundColor: "#222831",
                  borderRadius: "50%",
                  padding: "8px",
                  cursor: "pointer",
                  boxShadow: "0 2px 5px rgba(0,0,0,0.2)",
                  border: "2px solid #EEEEEE",
                }}
              >
                <FaCamera color="white" size={12} />
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

          <div className="mb-3 position-relative">
            <div className="input-group">
              <span className="input-group-text" style={{ background: "#00ADB5", border: "none", color: "white" }}>
                <FaUser />
              </span>
              <input
                type="text"
                name="name"
                className="form-control"
                placeholder="Full Name"
                value={form.name}
                onChange={handleChange}
                required
                style={{ 
                  borderLeft: "none", 
                  height: "45px", 
                  background: "#f8f8f8" 
                }}
              />
            </div>
          </div>

          <div className="mb-3 position-relative">
            <div className="input-group">
              <span className="input-group-text" style={{ background: "#00ADB5", border: "none", color: "white" }}>
                <FaEnvelope />
              </span>
              <input
                type="email"
                name="email"
                className={`form-control ${emailError ? 'is-invalid' : ''}`}
                placeholder="Email Address"
                value={form.email}
                onChange={handleChange}
                required
                style={{ 
                  borderLeft: "none", 
                  height: "45px", 
                  background: "#f8f8f8" 
                }}
              />
            </div>
            {emailError && (
              <div className="invalid-feedback d-block mt-1" style={{ color: "#dc3545" }}>
                {emailError}
              </div>
            )}
          </div>

          <div className="mb-3 position-relative">
            <div className="input-group">
              <span className="input-group-text" style={{ background: "#00ADB5", border: "none", color: "white" }}>
                <FaLock />
              </span>
              <input
                type="password"
                name="password"
                className="form-control"
                placeholder="Password"
                value={form.password}
                onChange={handleChange}
                required
                style={{ 
                  borderLeft: "none", 
                  height: "45px", 
                  background: "#f8f8f8" 
                }}
              />
            </div>
            <small className="form-text text-muted">
              Must be at least 8 characters with uppercase, lowercase, number, and special character
            </small>
          </div>

          <div className="mb-3 position-relative">
            <div className="input-group">
              <span className="input-group-text" style={{ background: "#00ADB5", border: "none", color: "white" }}>
                <FaLock />
              </span>
              <input
                type="password"
                name="confirmPassword"
                className="form-control"
                placeholder="Confirm Password"
                value={form.confirmPassword}
                onChange={handleChange}
                required
                style={{ 
                  borderLeft: "none", 
                  height: "45px", 
                  background: "#f8f8f8" 
                }}
              />
            </div>
          </div>

          <div className="mb-4 position-relative">
            <div className="input-group">
              <span className="input-group-text" style={{ background: "#00ADB5", border: "none", color: "white" }}>
                <FaUserTag />
              </span>
              <select
                name="role"
                className="form-select"
                value={form.role}
                onChange={handleChange}
                required
                style={{ 
                  borderLeft: "none", 
                  height: "45px", 
                  background: "#f8f8f8" 
                }}
              >
                <option value="buyer">Buyer</option>
                <option value="seller">Seller</option>
              </select>
            </div>
          </div>

          <div className="d-grid gap-2 mb-3">
            <button
              type="submit"
              className="btn"
              disabled={loading}
              style={{ 
                background: "#00ADB5", 
                color: "white", 
                height: "45px",
                fontWeight: "500",
                borderRadius: "6px",
                fontSize: "16px",
                transition: "all 0.3s ease"
              }}
            >
              {loading ? (
                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
              ) : (
                <FaUserPlus className="me-2" />
              )}
              {loading ? "Creating Account..." : "Sign Up"}
            </button>
          </div>

          <div className="text-center">
            <p className="mb-0">
              Already have an account?{" "}
              <Link to="/signin" style={{ color: "#00ADB5", fontWeight: "500", textDecoration: "none" }}>
                Sign In
              </Link>
            </p>
          </div>
        </form>
      </div>

      {/* Toast container */}
      <ToastContainer position="top-center" autoClose={3000} />
    </div>
  );
};

export default Signup;
