import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FaUser, FaEnvelope, FaUserTag, FaCamera, FaSave } from "react-icons/fa";
import { authAPI } from "../api";
import { checkAuth } from "../api/auth";
import "../Profile.css";

const Profile = ({ setIsAuthenticated }) => {
  const navigate = useNavigate();
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [fetchStatus, setFetchStatus] = useState({ tried: false, success: false });
  const [showRawData, setShowRawData] = useState(false);
  
  // Form state
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [profilePic, setProfilePic] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");

  useEffect(() => {
    const fetchUserData = async () => {
      setFetchStatus({ tried: true, success: false });
      try {
        // Get token from localStorage
        const token = localStorage.getItem("token");
        console.log("Token exists:", !!token);
        
        if (!token) {
          // No token means not authenticated
          console.warn("No authentication token found");
          setIsAuthenticated(false);
          navigate("/signin");
          return;
        }
        
        // Get user data from localStorage
        const storedUser = localStorage.getItem("user");
        console.log("Stored user exists:", !!storedUser);
        
        // Attempt to parse the user data
        let user = {};
        try {
          if (storedUser) {
            user = JSON.parse(storedUser);
            console.log("Parsed user data from localStorage", { userId: user.userId, name: user.name });
            
            // Set initial user data from localStorage
            setUserData(user);
            setName(user.name || "");
            setEmail(user.email || "");
            
            if (user.profilePic) {
              const localProfilePic = user.profilePic.startsWith("http")
                ? user.profilePic
                : `http://localhost:8000/${user.profilePic.replace(/^\/+/, "")}`;
              setPreviewUrl(localProfilePic);
              console.log("Set profile picture from localStorage");
            }
          }
        } catch (parseError) {
          console.error("Error parsing user data:", parseError);
        }
        
        // If we don't have a user ID, try to validate the token
        if (!user.userId) {
          console.log("No userId in localStorage, validating token...");
          try {
            // Use the directly imported checkAuth function instead of authAPI.checkAuth
            const authStatus = await checkAuth();
            console.log("Auth check result:", authStatus);
            
            if (!authStatus.authenticated) {
              throw new Error("Not authenticated");
            }
            
            // If we have user data from validation, use it
            if (authStatus.user) {
              console.log("Got user data from auth check:", authStatus.user);
              user = authStatus.user;
              user.userId = user._id;
              setUserData(user);
              
              if (user.name) setName(user.name);
              if (user.email) setEmail(user.email);
              
              // Update localStorage
              localStorage.setItem("user", JSON.stringify(user));
              console.log("Updated localStorage with user data from auth check");
            } else {
              throw new Error("No user data from auth check");
            }
          } catch (authError) {
            console.error("Auth validation error:", authError);
            
            // Fallback: Try to parse userId from token if possible
            const storedUser = localStorage.getItem("user");
            if (storedUser) {
              try {
                const parsedUser = JSON.parse(storedUser);
                if (parsedUser.userId || parsedUser._id) {
                  console.log("Using userId from localStorage as fallback");
                  user.userId = parsedUser.userId || parsedUser._id;
                } else {
                  console.error("No userId in stored user data");
                  setIsAuthenticated(false);
                  navigate("/signin");
                  return;
                }
              } catch (e) {
                console.error("Failed to parse user data:", e);
                setIsAuthenticated(false);
                navigate("/signin");
                return;
              }
            } else {
              console.error("No stored user data available");
              setIsAuthenticated(false);
              navigate("/signin");
              return;
            }
          }
        }
        
        // Fetch detailed user data if we have a userId
        if (user.userId) {
          console.log("Fetching detailed profile for userId:", user.userId);
          try {
            const response = await authAPI.getUserProfile(user.userId);
            
            if (response && response.data) {
              console.log("Got profile data from API:", response.data);
              
              // Update state with server data
              setUserData(response.data);
              setName(response.data.name || "");
              setEmail(response.data.email || "");
              
              // Update profile picture if available
              if (response.data.profilePic) {
                const profilePicUrl = response.data.profilePic.startsWith("http")
                  ? response.data.profilePic
                  : `http://localhost:8000/${response.data.profilePic.replace(/^\/+/, "")}`;
                setPreviewUrl(profilePicUrl);
                console.log("Updated profile picture from API");
              }
              
              setFetchStatus({ tried: true, success: true });
              console.log("Profile data fetch successful");
            } else {
              console.error("No data received from profile API");
              setError("Could not fetch profile data");
            }
          } catch (profileError) {
            // Use data we have from localStorage if profile fetch fails
            console.error("Error fetching profile data:", profileError);
            setError(`Could not fetch latest profile data: ${profileError.message}`);
          }
        } else {
          // No user ID, redirect to login
          console.warn("No userId available after all attempts");
          setIsAuthenticated(false);
          navigate("/signin");
          return;
        }
        
        setLoading(false);
      } catch (err) {
        console.error("Error in profile page:", err);
        // Handle severe errors by redirecting to login
        if (err.response && (err.response.status === 401 || err.response.status === 403)) {
          console.warn("Authentication error:", err.response.status);
          localStorage.removeItem("user");
          localStorage.removeItem("token");
          setIsAuthenticated(false);
          navigate("/signin");
        } else {
          // For other errors, show error but don't redirect
          setError(`Error loading profile: ${err.message}`);
          setLoading(false);
        }
      }
    };
    
    fetchUserData();
  }, [navigate, setIsAuthenticated]);

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setUpdating(true);
    setError("");
    setSuccess("");
    
    try {
      const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
      
      if (!storedUser || !storedUser.userId) {
        setError("Authentication issue. Please login again.");
        setUpdating(false);
        setTimeout(() => {
          localStorage.removeItem("user");
          localStorage.removeItem("token");
          setIsAuthenticated(false);
          navigate("/signin");
        }, 2000);
        return;
      }
      
      // Prepare update data
      const updateData = {
        name,
        email,
        // Only include profilePic if a new one was selected
        profilePic: profilePic || undefined
      };
      
      // Use API utility to update profile
      const response = await authAPI.updateProfile(storedUser.userId, updateData);
      
      if (response.data) {
        // Update localStorage with new user data
        localStorage.setItem(
          "user",
          JSON.stringify({
            ...storedUser,
            name: name,
            email: email,
            profilePic: response.data.profilePic,
          })
        );
        
        // Update userData state
        setUserData(prev => ({
          ...prev,
          name: name,
          email: email,
          profilePic: response.data.profilePic
        }));
        
        setSuccess("Profile updated successfully");
        
        // Update preview URL if a new profile picture was uploaded
        if (response.data.profilePic) {
          const profilePicUrl = response.data.profilePic.startsWith("http")
            ? response.data.profilePic
            : `http://localhost:8000/${response.data.profilePic.replace(/^\/+/, "")}`;
          setPreviewUrl(profilePicUrl);
        }
      } else {
        throw new Error("No response data received from server");
      }
    } catch (err) {
      console.error("Error updating profile:", err);
      if (err.response && err.response.status === 401) {
        setError("Session expired. Please login again.");
        setTimeout(() => {
          localStorage.removeItem("user");
          localStorage.removeItem("token");
          setIsAuthenticated(false);
          navigate("/signin");
        }, 2000);
      } else {
        setError(err.response?.data?.error || "Failed to update profile");
      }
    } finally {
      setUpdating(false);
      // Clear the file input after update
      setProfilePic(null);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setProfilePic(file);
      const fileReader = new FileReader();
      fileReader.onload = () => {
        setPreviewUrl(fileReader.result);
      };
      fileReader.readAsDataURL(file);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setIsAuthenticated(false);
    navigate("/signin");
  };

  if (loading) {
    return (
      <div 
        className="d-flex flex-column justify-content-center align-items-center vh-100" 
        style={{ background: "linear-gradient(135deg, #222831 0%, #393E46 100%)" }}
      >
        <div className="spinner-border text-light mb-3" style={{ width: "3rem", height: "3rem" }} role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <h5 className="text-light mt-3">Loading your profile...</h5>
        <p className="text-light-50 small">Please wait while we fetch your data</p>
      </div>
    );
  }

  return (
    <div 
      className="profile-container container py-5"
      style={{ 
        background: "linear-gradient(135deg, #222831 0%, #393E46 100%)",
        minHeight: "100vh"
      }}
    >
      <div className="row">
        <div className="col-lg-8 mx-auto">
          <div className="card shadow" style={{ borderRadius: "15px", border: "none" }}>
            <div className="card-header text-white" style={{ background: "#00ADB5", borderTopLeftRadius: "15px", borderTopRightRadius: "15px" }}>
              <h3 className="mb-0">My Profile</h3>
            </div>
            <div className="card-body" style={{ background: "#EEEEEE" }}>
              {error && <div className="alert alert-danger">{error}</div>}
              {success && <div className="alert alert-success">{success}</div>}
              
              {/* Fetch status indicator */}
              {fetchStatus.tried && !loading && (
                <div className={`alert ${fetchStatus.success ? 'alert-success' : 'alert-warning'} small py-2 mb-3`}>
                  <div className="d-flex align-items-center">
                    {fetchStatus.success ? (
                      <>
                        <span className="text-success me-2">✓</span>
                        <span>Profile data loaded successfully</span>
                      </>
                    ) : (
                      <>
                        <span className="text-warning me-2">⚠</span>
                        <span>Using cached profile data. Some information might be outdated.</span>
                      </>
                    )}
                  </div>
                </div>
              )}

              <div className="text-center mb-4">
                <div className="profile-pic-container">
                  <img
                    src={previewUrl || `https://ui-avatars.com/api/?name=${name || "User"}&background=random&size=200`}
                    alt="Profile"
                    className="profile-pic"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = `https://ui-avatars.com/api/?name=${name || "User"}&background=random&size=200`;
                    }}
                  />
                </div>
              </div>

              {/* User Information Display Section */}
              <div className="card mb-4 border-0 shadow-sm">
                <div className="card-header bg-light d-flex justify-content-between align-items-center">
                  <h5 className="mb-0"><FaUser className="me-2" />Account Information</h5>
                  <div className="form-check form-switch">
                    <input 
                      className="form-check-input" 
                      type="checkbox" 
                      id="showRawData" 
                      onChange={() => setShowRawData(!showRawData)} 
                    />
                    <label className="form-check-label small text-muted" htmlFor="showRawData">
                      Debug Mode
                    </label>
                  </div>
                </div>
                <div className="card-body">
                  <div className="row">
                    <div className="col-md-6">
                      <p><strong>Name:</strong> {name || "Not set"}</p>
                      <p><strong>Email:</strong> {email || "Not set"}</p>
                      {userData?.phone && <p><strong>Phone:</strong> {userData.phone}</p>}
                      <p><strong>Role:</strong> <span className="badge bg-info text-dark">{userData?.role || JSON.parse(localStorage.getItem("user") || '{}').role || "User"}</span></p>
                    </div>
                    <div className="col-md-6">
                      <p><strong>User ID:</strong> <small className="text-muted">{userData?._id || JSON.parse(localStorage.getItem("user") || '{}').userId}</small></p>
                      {userData?.createdAt && (
                        <p><strong>Member Since:</strong> {new Date(userData.createdAt).toLocaleDateString()}</p>
                      )}
                      {userData?.lastLogin && (
                        <p><strong>Last Login:</strong> {new Date(userData.lastLogin).toLocaleString()}</p>
                      )}
                      {userData?.address && (
                        <p><strong>Address:</strong> {userData.address}</p>
                      )}
                    </div>
                  </div>
                  
                  {showRawData && (
                    <div className="mt-3 p-2 bg-light rounded small">
                      <details>
                        <summary className="text-muted">Raw user data (debug)</summary>
                        <pre className="mt-2" style={{ fontSize: '0.75rem', overflowX: 'auto' }}>
                          {JSON.stringify(userData, null, 2)}
                        </pre>
                      </details>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="card mb-4 border-0 shadow-sm">
                <div className="card-header bg-light">
                  <h5 className="mb-0"><FaSave className="me-2" />Update Profile</h5>
                </div>
                <div className="card-body">
                  <form onSubmit={handleProfileUpdate}>
                    <div className="mb-3">
                      <label htmlFor="name" className="form-label d-flex align-items-center">
                        <FaUser className="me-2" />
                        Full Name
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        id="name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                      />
                    </div>

                    <div className="mb-3">
                      <label htmlFor="email" className="form-label d-flex align-items-center">
                        <FaEnvelope className="me-2" />
                        Email Address
                      </label>
                      <input
                        type="email"
                        className="form-control"
                        id="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                      />
                    </div>

                    <div className="mb-4">
                      <label htmlFor="profilePic" className="form-label d-flex align-items-center">
                        <FaCamera className="me-2" />
                        Profile Picture
                      </label>
                      <input
                        type="file"
                        className="form-control"
                        id="profilePic"
                        accept="image/*"
                        onChange={handleFileChange}
                      />
                      <small className="form-text text-muted">
                        Select a new image to update your profile picture. Maximum size: 2MB.
                      </small>
                    </div>

                    <div className="d-grid gap-2 d-md-flex">
                      <button
                        type="submit"
                        className="btn btn-primary flex-grow-1"
                        style={{ backgroundColor: "#00ADB5", borderColor: "#00ADB5" }}
                        disabled={updating}
                      >
                        {updating ? (
                          <>
                            <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                            Updating...
                          </>
                        ) : (
                          <>
                            <FaSave className="me-2" />
                            Save Changes
                          </>
                        )}
                      </button>
                      <button
                        type="button"
                        className="btn btn-outline-danger flex-grow-1"
                        onClick={handleLogout}
                      >
                        Logout
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;