import React, { useState, useEffect, useContext } from "react";
import { useNavigate, Link } from "react-router-dom";
import { FaUser, FaEnvelope, FaCamera, FaSave, FaGavel, FaEye, FaHistory, FaTrophy, FaHeart, FaBell, FaUserTag, FaStore, FaExchangeAlt, FaStar, FaList, FaUpload } from "react-icons/fa";
import { getUserProfile, updateProfile } from "../api/auth";
import { AuthContext } from "../context/AuthContext";
import { useTheme } from "../context/ThemeProvider";
import RoleSelector from "./RoleSelector";
import { applyFallbackStyles } from "../utils/themeUtils";
import { fixProfileVisibility } from "../utils/profileUtils";
import ThemeToggle from "./ThemeToggle";
import { getAuctionItemPlaceholder } from "../utils/imageUtils";
import Sell from "./Sell";
import axios from "axios";

const Profile = () => {
  const navigate = useNavigate();
  const { isAuthenticated, user: contextUser, logout } = useContext(AuthContext);
  const { theme } = useTheme();
  const [userData, setUserData] = useState(null);
  const [profileStats, setProfileStats] = useState(null);
  const [activeBids, setActiveBids] = useState([]);
  const [wonAuctions, setWonAuctions] = useState([]);
  const [userListings, setUserListings] = useState([]);
  const [filteredListings, setFilteredListings] = useState(null);
  const [recentActivity, setRecentActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [activeTab, setActiveTab] = useState("profile");
  const [editMode, setEditMode] = useState(false);
  const [fileUpload, setFileUpload] = useState(null);
  const [formData, setFormData] = useState({});
  const [listingFilter, setListingFilter] = useState("all");
  
  // Form state
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [profilePic, setProfilePic] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");

  // Add a state for showing role selector
  const [showRoleSelector, setShowRoleSelector] = useState(false);

  const [profileListings, setProfileListings] = useState([]);
  const [profileBids, setProfileBids] = useState([]);
  const [activeListings, setActiveListings] = useState([]);

  useEffect(() => {
    // Ensure theme variables are available
    applyFallbackStyles();
    
    // Fix profile visibility
    fixProfileVisibility();
    
    fetchUserData();
    
    // If userId is available in localStorage, fetch recent activities directly
    const userId = localStorage.getItem("userId");
    if (userId) {
      fetchRecentActivity(userId);
    }
  }, []);
  
  const fetchUserData = async () => {
    try {
      // Get token from localStorage
      const token = localStorage.getItem("token");
      if (!token) {
        console.error("No authentication token found");
        setError("You need to log in to view your profile");
        logout();
        navigate("/signin");
        return;
      }
      
      // Get userId from localStorage
      const userId = localStorage.getItem("userId");
      if (!userId || userId === 'undefined') {
        console.error("No valid userId found");
        setError("User ID not found. Please log in again.");
        logout();
        navigate("/signin");
        return;
      }
      
      console.log("Fetching profile for user ID:", userId);
      
      // Get initial user data from localStorage
      const storedUser = localStorage.getItem("user");
      if (storedUser) {
        try {
          const parsedUser = JSON.parse(storedUser);
          setUserData(parsedUser);
          setName(parsedUser.name || "");
          setEmail(parsedUser.email || "");
          
          if (parsedUser.profilePic) {
            const localProfilePic = parsedUser.profilePic.startsWith("http")
              ? parsedUser.profilePic
              : `${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/${parsedUser.profilePic.replace(/^\/+/, "")}`;
            setPreviewUrl(localProfilePic);
          }
        } catch (e) {
          console.error("Error parsing user data from localStorage:", e);
        }
      }
      
      // Fetch user profile from API
      const response = await getUserProfile(userId);
      if (response && response.data) {
        console.log("Profile data received from API");
        setUserData(response.data);
        setName(response.data.name || "");
        setEmail(response.data.email || "");
        
        if (response.data.profilePic) {
          const profilePicUrl = response.data.profilePic.startsWith("http")
            ? response.data.profilePic
            : `${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/${response.data.profilePic.replace(/^\/+/, "")}`;
          setPreviewUrl(profilePicUrl);
        }
        
        // Fetch profile summary data
        fetchProfileSummary(userId);
        
        // Fetch recent activities specifically
        fetchRecentActivity(userId);
      } else {
        console.error("No data in API response");
        setError("Could not load profile data from server");
      }
      
    } catch (error) {
      console.error("Error in profile page:", error);
      setError(`Error loading profile: ${error.message}`);
      
      // Check for authentication errors
      if (error.response && error.response.status === 401) {
        logout();
        navigate("/signin");
      }
    } finally {
      setLoading(false);
    }
  };
  
  const fetchProfileSummary = async (userId) => {
    try {
      const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
      const token = localStorage.getItem("token");
      
      // Request only the last 24 hours of activity, including all activity types
      const response = await fetch(`${apiBaseUrl}/api/profile/summary/${userId}?activityTimeframe=24h&includeListings=true`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch profile summary');
      }
      
      const data = await response.json();
      setProfileStats(data.stats);
      setRecentActivity(data.recentActivity);
      
      // Fetch additional data based on the active tab
      if (activeTab === 'auctions') {
        fetchUserBids(userId);
      } else if (activeTab === 'watchlist') {
        fetchWonAuctions(userId);
      } else if (activeTab === 'listings') {
        fetchUserListings(userId);
      }
      
    } catch (error) {
      console.error("Error fetching profile summary:", error);
      setError(`Error fetching profile data: ${error.message}`);
    }
  };
  
  const fetchRecentActivity = async (userId) => {
    try {
      const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
      const token = localStorage.getItem("token");
      
      // Get the user role to include in the request
      const userObj = JSON.parse(localStorage.getItem("user") || "{}");
      const userRole = userObj.role || "";
      
      // Dedicated endpoint for fetching all recent activities
      // Include the role type to ensure appropriate activities are returned
      const response = await fetch(
        `${apiBaseUrl}/api/profile/activities/${userId}?timeframe=24h&roleType=${userRole}`, 
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
      
      if (!response.ok) {
        throw new Error('Failed to fetch recent activities');
      }
      
      const data = await response.json();
      console.log("Recent activities fetched:", data);
      setRecentActivity(data);
      
    } catch (error) {
      console.error("Error fetching recent activities:", error);
    }
  };
  
  const fetchUserBids = async (userId) => {
    try {
      const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
      const token = localStorage.getItem("token");
      
      const response = await fetch(`${apiBaseUrl}/api/profile/active-bids/${userId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch active bids');
      }
      
      const data = await response.json();
      setActiveBids(data);
      
    } catch (error) {
      console.error("Error fetching active bids:", error);
    }
  };
  
  const fetchWonAuctions = async (userId) => {
    try {
      const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
      const token = localStorage.getItem("token");
      
      const response = await fetch(`${apiBaseUrl}/api/profile/won-auctions/${userId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch won auctions');
      }
      
      const data = await response.json();
      setWonAuctions(data);
      
    } catch (error) {
      console.error("Error fetching won auctions:", error);
    }
  };
  
  const fetchUserListings = async (userId) => {
    try {
      const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
      const token = localStorage.getItem("token");
      
      const response = await fetch(`${apiBaseUrl}/api/profile/listings/${userId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch user listings');
      }
      
      const data = await response.json();
      setUserListings(data);
      setProfileListings(data);
      
    } catch (error) {
      console.error("Error fetching user listings:", error);
    }
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    if (updating) return;
    
    setUpdating(true);
    setSuccess("");
    setError("");
    
    try {
      const userId = localStorage.getItem("userId");
      if (!userId) {
        setError("User ID not found. Please log in again.");
        logout();
        return;
      }
      
      // Prepare update data
      const updateData = {
        name,
        profilePic: profilePic || undefined
      };
      
      // Use API utility to update profile
      const response = await updateProfile(userId, updateData);
      
      if (response.data) {
        // Update localStorage with new user data
        const storedUser = JSON.parse(localStorage.getItem("user") || '{}');
        localStorage.setItem(
          "user",
          JSON.stringify({
            ...storedUser,
            name: name,
            profilePic: response.data.profilePic
          })
        );
        
        // Update userData state
        setUserData(prev => ({
          ...prev,
          name: name,
          profilePic: response.data.profilePic
        }));
        
        setSuccess("Profile updated successfully");
        
        // Update preview URL if a new profile picture was uploaded
        if (response.data.profilePic) {
          const profilePicUrl = response.data.profilePic.startsWith("http")
            ? response.data.profilePic
            : `${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/${response.data.profilePic.replace(/^\/+/, "")}`;
          setPreviewUrl(profilePicUrl);
        }
      } else {
        throw new Error("No response data received from server");
      }
    } catch (err) {
      console.error("Error updating profile:", err);
      setError(err.response?.data?.error || "Failed to update profile");
    } finally {
      setUpdating(false);
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
    logout();
    navigate("/signin");
  };
  
  const formatTimeAgo = (date) => {
    const seconds = Math.floor((new Date() - new Date(date)) / 1000);
    
    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + " years ago";
    
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + " months ago";
    
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + " days ago";
    
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + " hours ago";
    
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + " minutes ago";
    
    return Math.floor(seconds) + " seconds ago";
  };
  
  const formatTimeLeft = (endTime) => {
    const diff = new Date(endTime) - new Date();
    if (diff <= 0) return "Ended";
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (days > 0) return `${days}d ${hours}h left`;
    
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    if (hours > 0) return `${hours}h ${minutes}m left`;
    
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);
    return `${minutes}m ${seconds}s left`;
  };

  // Add a function to handle role change request
  const handleRoleChangeRequest = () => {
    setShowRoleSelector(true);
  };

  // Filter listings based on selected filter
  const filterListings = (filter) => {
    setListingFilter(filter);
    if (!profileListings) return;

    let filtered;
    const now = new Date();

    switch (filter) {
      case "active":
        filtered = profileListings.filter(listing => new Date(listing.endTime) > now);
        break;
      case "ended":
        filtered = profileListings.filter(listing => new Date(listing.endTime) <= now);
        break;
      case "noBids":
        filtered = profileListings.filter(listing => !listing.bids || listing.bids.length === 0);
        break;
      case "all":
      default:
        filtered = [...profileListings];
        break;
    }
    setFilteredListings(filtered);
  };

  useEffect(() => {
    if (activeTab === "listings" && profileListings) {
      filterListings(listingFilter);
    } else if (activeTab === "activeListings" && profileListings) {
      // For activeListings tab, automatically filter to show only active listings
      filterListings("active");
    }
  }, [activeTab, profileListings, listingFilter]);

  return (
    <div>
      {loading ? (
        <div className="text-center p-5">
          <div className="spinner-border" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      ) : (
        <>
          <div className="container mt-4">
            <div className="row">
              <div className="col-md-3 mb-4 text-center">
                <div className="position-relative d-inline-block">
                  <img
                    src={previewUrl || `https://ui-avatars.com/api/?name=${name || "User"}&background=random&size=200`}
                    alt="Profile"
                    className="img-thumbnail rounded-circle"
                    style={{ width: "150px", height: "150px", objectFit: "cover" }}
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = `https://ui-avatars.com/api/?name=${name || "User"}&background=random&size=200`;
                    }}
                  />
                  <label htmlFor="profilePic" className="position-absolute bottom-0 end-0 bg-primary text-white rounded-circle p-2" style={{ cursor: "pointer" }}>
                    <FaCamera />
                  </label>
                  <input
                    type="file"
                    id="profilePic"
                    accept="image/*"
                    onChange={handleFileChange}
                    style={{ display: "none" }}
                  />
                </div>
              </div>
              
              <div className="col-md-9">
                <h2>{name || "User"}</h2>
                <p className="text-muted mb-2">{email || "No email set"}</p>
                <div className="mb-3">
                  <span className="badge bg-info me-2">{userData?.role || "User"}</span>
                  <span className="text-muted small">Member since {userData?.createdAt ? new Date(userData.createdAt).toLocaleDateString() : "Unknown"}</span>
                </div>
                
                <ul className="nav nav-tabs mb-4">
                  <li className="nav-item">
                    <button 
                      className={`nav-link ${activeTab === "profile" ? "active" : ""}`}
                      onClick={() => setActiveTab("profile")}
                    >
                      <FaUser className="me-2" />
                      Profile
                    </button>
                  </li>
                  
                  {/* Show My Bids tab only for buyers or when role is unset */}
                  {(userData?.role === 'buyer' || userData?.role === 'unset' || !userData?.role) && (
                    <li className="nav-item">
                      <button 
                        className={`nav-link ${activeTab === "auctions" ? "active" : ""}`}
                        onClick={() => {
                          setActiveTab("auctions");
                          fetchUserBids(localStorage.getItem("userId"));
                        }}
                      >
                        <FaGavel className="me-2" />
                        My Bids
                      </button>
                    </li>
                  )}
                  
                  {/* Show Won Auctions tab for sellers only */}
                  {userData?.role === 'seller' && (
                    <li className="nav-item">
                      <button 
                        className={`nav-link ${activeTab === "watchlist" ? "active" : ""}`}
                        onClick={() => {
                          setActiveTab("watchlist");
                          fetchWonAuctions(localStorage.getItem("userId"));
                        }}
                      >
                        <FaTrophy className="me-2" />
                        All Winners
                      </button>
                    </li>
                  )}
                  
                  {/* Only show Listings tab for sellers */}
                  {userData?.role === 'seller' && (
                    <li className="nav-item">
                      <button 
                        className={`nav-link ${activeTab === "listings" ? "active" : ""}`}
                        onClick={() => {
                          setActiveTab("listings");
                          fetchUserListings(localStorage.getItem("userId"));
                        }}
                      >
                        <FaStore className="me-2" />
                        My Listings
                      </button>
                    </li>
                  )}
                  
                  {/* Show Active Listings tab for sellers only */}
                  {userData?.role === 'seller' && (
                    <li className="nav-item">
                      <button 
                        className={`nav-link ${activeTab === "activeListings" ? "active" : ""}`}
                        onClick={() => {
                          setActiveTab("activeListings");
                          fetchUserListings(localStorage.getItem("userId"));
                        }}
                      >
                        <FaBell className="me-2" />
                        Active Listings
                      </button>
                    </li>
                  )}
                  
                  {/* Add Create Listing tab for sellers only */}
                  {userData?.role === 'seller' && (
                    <li className="nav-item">
                      <button 
                        className={`nav-link ${activeTab === "createListing" ? "active" : ""}`}
                        onClick={() => setActiveTab("createListing")}
                      >
                        <FaUpload className="me-2" />
                        Create Listing
                      </button>
                    </li>
                  )}
                </ul>
              </div>
            </div>
          </div>
          
          <div className="container">
            {error && <div className="alert alert-danger">{error}</div>}
            {success && <div className="alert alert-success">{success}</div>}
            
            {/* Profile Tab */}
            {activeTab === "profile" && (
              <div className="row">
                {/* Role Selection Card */}
                {(userData?.role === 'unset' || !userData?.role || showRoleSelector) && (
                  <div className="col-12 mb-4">
                    <div className="card">
                      <div className="card-header bg-primary text-white d-flex justify-content-between align-items-center">
                        <h5 className="mb-0"><FaUserTag className="me-2" />{userData?.role === 'unset' || !userData?.role ? 'Choose Your Role' : 'Change Your Role'}</h5>
                        {showRoleSelector && (
                          <button 
                            className="btn btn-sm btn-light" 
                            onClick={() => setShowRoleSelector(false)}
                          >
                            Cancel
                          </button>
                        )}
                      </div>
                      <div className="card-body">
                        <div className="alert alert-info">
                          <p className="mb-0">
                            {userData?.role === 'unset' || !userData?.role 
                              ? 'Please select how you would like to use our platform. This will customize your experience.' 
                              : 'You can switch between buyer and seller roles at any time. Your existing data will be preserved.'}
                          </p>
                        </div>
                        <RoleSelector isEmbedded={true} />
                      </div>
                    </div>
                  </div>
                )}
                
                <div className="col-lg-4 col-md-6 mb-4">
                  <div className="card">
                    <div className="card-header">
                      <h5 className="mb-0"><FaUser className="me-2" />Account Information</h5>
                    </div>
                    <div className="card-body">
                      <form onSubmit={handleProfileUpdate}>
                        <div className="mb-3">
                          <label htmlFor="name" className="form-label">
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
                          <label htmlFor="email" className="form-label">
                            Email Address <span className="text-muted small">(cannot be changed)</span>
                          </label>
                          <input
                            type="email"
                            className="form-control bg-light"
                            id="email"
                            value={email}
                            readOnly
                            disabled
                          />
                          <small className="form-text text-muted">
                            Email addresses are used as unique identifiers and cannot be changed.
                          </small>
                        </div>

                        {/* Add role information and change button */}
                        {userData?.role && userData.role !== 'unset' && !showRoleSelector && (
                          <div className="mb-3">
                            <label className="form-label">Current Role</label>
                            <div className="d-flex align-items-center">
                              <div className="badge bg-primary me-2 p-2">
                                {userData.role === 'seller' ? (
                                  <><FaStore className="me-1" /> Seller</>
                                ) : (
                                  <><FaUser className="me-1" /> Buyer</>
                                )}
                              </div>
                              <button 
                                type="button" 
                                className="btn btn-sm btn-outline-primary ms-2"
                                onClick={handleRoleChangeRequest}
                              >
                                <FaExchangeAlt className="me-1" /> Change Role
                              </button>
                            </div>
                            <small className="text-muted d-block mt-1">
                              You can switch between buyer and seller roles at any time.
                            </small>
                          </div>
                        )}

                        <div className="d-grid gap-2">
                          <button
                            type="submit"
                            className="btn btn-primary"
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
                            className="btn btn-outline-danger"
                            onClick={handleLogout}
                          >
                            Logout
                          </button>
                        </div>
                      </form>
                    </div>
                  </div>
                </div>
                
                <div className="col-lg-8 col-md-6 mb-4">
                  <div className="row">
                    {/* Show different stats based on user role */}
                    {userData?.role === 'buyer' ? (
                      // Buyer Stats
                      <>
                        <div className="col-md-6 col-lg-3 mb-3">
                          <div className="card text-center p-3 h-100" onClick={() => {
                            setActiveTab("auctions");
                            fetchUserBids(localStorage.getItem("userId"));
                          }} style={{ cursor: "pointer" }}>
                            <FaGavel className="mx-auto mb-2" style={{ fontSize: "1.5rem", color: "#6366f1" }} />
                            <h3 className="my-1">{profileStats?.activeBids || 0}</h3>
                            <div className="text-muted">Active Bids</div>
                          </div>
                        </div>
                        <div className="col-md-6 col-lg-3 mb-3">
                          <div className="card text-center p-3 h-100" onClick={() => {
                            setActiveTab("auctions");
                            fetchUserBids(localStorage.getItem("userId"));
                          }} style={{ cursor: "pointer" }}>
                            <FaHeart className="mx-auto mb-2" style={{ fontSize: "1.5rem", color: "#f87171" }} />
                            <h3 className="my-1">{profileStats?.totalBidsPlaced || 0}</h3>
                            <div className="text-muted">Total Bids</div>
                          </div>
                        </div>
                        <div className="col-md-6 col-lg-3 mb-3">
                          <div className="card text-center p-3 h-100" onClick={() => {
                            setActiveTab("watchlist");
                            fetchWonAuctions(localStorage.getItem("userId"));
                          }} style={{ cursor: "pointer" }}>
                            <FaTrophy className="mx-auto mb-2" style={{ fontSize: "1.5rem", color: "#facc15" }} />
                            <h3 className="my-1">{profileStats?.wonAuctions || 0}</h3>
                            <div className="text-muted">Auction Wins</div>
                          </div>
                        </div>
                        <div className="col-md-6 col-lg-3 mb-3">
                          <div className="card text-center p-3 h-100" onClick={() => navigate("/wishlist")} style={{ cursor: "pointer" }}>
                            <FaStar className="mx-auto mb-2" style={{ fontSize: "1.5rem", color: "#fbbf24" }} />
                            <h3 className="my-1">{profileStats?.wishlistItems || 0}</h3>
                            <div className="text-muted">Wishlist</div>
                          </div>
                        </div>
                      </>
                    ) : userData?.role === 'seller' ? (
                      // Seller Stats
                      <>
                        <div className="col-md-6 col-lg-3 mb-3">
                          <div className="card text-center p-3 h-100">
                            <FaBell className="mx-auto mb-2" style={{ fontSize: "1.5rem", color: "#6366f1" }} />
                            <h3 className="my-1">{profileStats?.activeListings || 0}</h3>
                            <div className="text-muted">Active Listings</div>
                            <small className="text-muted mt-1">Currently available for bidding</small>
                          </div>
                        </div>
                        <div className="col-md-6 col-lg-3 mb-3">
                          <div className="card text-center p-3 h-100">
                            <FaList className="mx-auto mb-2" style={{ fontSize: "1.5rem", color: "#4ade80" }} />
                            <h3 className="my-1">{profileStats?.totalListings || 0}</h3>
                            <div className="text-muted">All Listings</div>
                            <small className="text-muted mt-1">Total items listed since account creation</small>
                          </div>
                        </div>
                        <div className="col-md-6 col-lg-3 mb-3">
                          <div className="card text-center p-3 h-100">
                            <FaTrophy className="mx-auto mb-2" style={{ fontSize: "1.5rem", color: "#facc15" }} />
                            <h3 className="my-1">{profileStats?.soldItems || 0}</h3>
                            <div className="text-muted">Winners</div>
                          </div>
                        </div>
                        <div className="col-md-6 col-lg-3 mb-3">
                          <div className="card text-center p-3 h-100">
                            <FaStore className="mx-auto mb-2" style={{ fontSize: "1.5rem", color: "#f87171" }} />
                            <h3 className="my-1">{profileStats?.totalEarnings ? `₹${profileStats.totalEarnings}` : '₹0'}</h3>
                            <div className="text-muted">Total Earnings</div>
                          </div>
                        </div>
                      </>
                    ) : (
                      // Default Stats (when role is unset)
                      <>
                        <div className="col-md-6 col-lg-3 mb-3">
                          <div className="card text-center p-3 h-100">
                            <FaGavel className="mx-auto mb-2" style={{ fontSize: "1.5rem", color: "#6366f1" }} />
                            <h3 className="my-1">{profileStats?.activeBids || 0}</h3>
                            <div className="text-muted">Active Bids</div>
                          </div>
                        </div>
                        <div className="col-md-6 col-lg-3 mb-3">
                          <div className="card text-center p-3 h-100">
                            <FaBell className="mx-auto mb-2" style={{ fontSize: "1.5rem", color: "#6366f1" }} />
                            <h3 className="my-1">{profileStats?.activeListings || 0}</h3>
                            <div className="text-muted">Active Listings</div>
                          </div>
                        </div>
                        <div className="col-md-6 col-lg-3 mb-3">
                          <div className="card text-center p-3 h-100">
                            <FaTrophy className="mx-auto mb-2" style={{ fontSize: "1.5rem", color: "#facc15" }} />
                            <h3 className="my-1">{profileStats?.wonAuctions || 0}</h3>
                            <div className="text-muted">Auctions Won</div>
                          </div>
                        </div>
                        <div className="col-md-6 col-lg-3 mb-3">
                          <div className="card text-center p-3 h-100">
                            <FaHeart className="mx-auto mb-2" style={{ fontSize: "1.5rem", color: "#f87171" }} />
                            <h3 className="my-1">{profileStats?.totalBidsPlaced || 0}</h3>
                            <div className="text-muted">Total Bids</div>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                  
                  <div className="card">
                    <div className="card-header d-flex justify-content-between align-items-center">
                      <h5 className="mb-0"><FaHistory className="me-2" />Recent Activity (Last 24 Hours)</h5>
                      <button 
                        className="btn btn-sm btn-outline-primary" 
                        onClick={() => fetchRecentActivity(localStorage.getItem("userId"))}
                        title="Refresh activities"
                      >
                        <FaHistory />
                      </button>
                    </div>
                    <div className="card-body">
                      {!recentActivity || recentActivity.length === 0 ? (
                        <div className="text-center my-3">
                          <FaHistory style={{ fontSize: "2rem", color: "var(--text-muted)", opacity: 0.5 }} />
                          <p className="mt-2 text-muted">No recent activities in the last 24 hours</p>
                          {userData?.role === 'seller' && (
                            <div className="alert alert-info mt-3">
                              <small>
                                Try creating a new listing! Your seller activities will appear here.
                              </small>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="list-group">
                          {recentActivity.map((activity) => (
                            <div key={activity._id || Math.random().toString()} className="list-group-item d-flex align-items-center">
                              <div className="me-3 text-primary">
                                {activity.type === 'listing' ? <FaStore /> : 
                                 activity.type === 'auction_created' ? <FaStore /> :
                                 activity.type === 'auction_ended' ? <FaTrophy /> :
                                 activity.type === 'bid' ? <FaGavel /> : 
                                 <FaHistory />}
                              </div>
                              <div>
                                {activity.type === 'listing' || activity.type === 'auction_created' ? (
                                  <div><strong>Listed new item: {activity.auction?.title || activity.title || 'Unknown Item'}</strong> for ₹{activity.auction?.startingBid || activity.startingBid || '0'}</div>
                                ) : activity.type === 'auction_ended' ? (
                                  <div><strong>Auction ended: {activity.auction?.title || activity.title || 'Unknown Item'}</strong> sold for ₹{activity.auction?.highestBid || activity.highestBid || activity.amount || '0'}</div>
                                ) : activity.type === 'bid' ? (
                                  <div><strong>Bid ₹{activity.amount}</strong> on {activity.auction?.title || 'Unknown Auction'}</div>
                                ) : (
                                  <div><strong>{activity.description || activity.message || 'Activity'}</strong></div>
                                )}
                                <div className="text-muted small">{formatTimeAgo(activity.date || activity.createdAt)}</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {/* Auctions Tab (My Bids) */}
            {activeTab === "auctions" && (
              <div className="row">
                <div className="col-12 mb-4">
                  <div className="card">
                    <div className="card-header d-flex justify-content-between align-items-center">
                      <h5 className="mb-0"><FaGavel className="me-2" />My Active Bids</h5>
                    </div>
                    <div className="card-body">
                      {activeBids.length === 0 ? (
                        <div className="text-center my-5">
                          <FaGavel style={{ fontSize: "3rem", color: "var(--primary-color)", opacity: 0.5 }} />
                          <h5 className="mt-3">You don't have any active bids</h5>
                          <p className="text-muted">Start bidding on items to see them here</p>
                          <button 
                            className="btn btn-primary mt-2"
                            onClick={() => navigate("/")}
                          >
                            Browse Auctions
                          </button>
                        </div>
                      ) : (
                        <div className="row">
                          {activeBids.map((bid) => (
                            <div key={bid._id} className="col-md-6 col-lg-4 mb-3">
                              <div 
                                className="card h-100 auction-card"
                                onClick={() => navigate(`/auction/${bid.auctionId}`)}
                              >
                                <div className="position-relative">
                                  <img 
                                    src={bid.image || getAuctionItemPlaceholder()}
                                    className="card-img-top auction-image" 
                                    alt={bid.title} 
                                  />
                                  <div className={`bid-status-badge ${bid.status === 'winning' ? 'winning' : 'outbid'}`}>
                                    {bid.status === 'winning' ? 'Winning' : 'Outbid'}
                                  </div>
                                </div>
                                <div className="card-body">
                                  <h5 className="card-title">{bid.title}</h5>
                                  <div className="d-flex justify-content-between">
                                    <div>
                                      <p className="mb-0 small">Your bid</p>
                                      <p className="text-primary fw-bold">₹{bid.amount}</p>
                                    </div>
                                    <div>
                                      <p className="mb-0 small">Current high</p>
                                      <p className="text-danger fw-bold">₹{bid.currentHighestBid}</p>
                                    </div>
                                  </div>
                                  <div className="text-end mt-2">
                                    <small className="text-muted">{formatTimeLeft(bid.endTime)}</small>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {/* Won Auctions Tab (renamed to Winners for sellers) */}
            {activeTab === "watchlist" && (
              <div className="row">
                <div className="col-12 mb-4">
                  <div className="card">
                    <div className="card-header">
                      <h5 className="mb-0">
                        <FaTrophy className="me-2" />
                        {userData?.role === 'seller' ? 'All Winners' : 'Won Auctions'}
                      </h5>
                    </div>
                    <div className="card-body">
                      {wonAuctions.length === 0 ? (
                        <div className="text-center my-5">
                          <FaTrophy style={{ fontSize: "3rem", color: "var(--secondary-color)", opacity: 0.5 }} />
                          <h5 className="mt-3">
                            {userData?.role === 'seller' 
                              ? "No auctions with winners yet" 
                              : "You haven't won any auctions yet"}
                          </h5>
                          <p className="text-muted">
                            {userData?.role === 'seller'
                              ? "Your completed auctions with winners will appear here"
                              : "Keep bidding to win items!"}
                          </p>
                          <button 
                            className="btn btn-primary mt-2"
                            onClick={() => navigate("/")}
                          >
                            {userData?.role === 'seller' ? 'Create Auction' : 'Browse Auctions'}
                          </button>
                        </div>
                      ) : (
                        <div className="row">
                          {wonAuctions.map((auction) => (
                            <div key={auction._id} className="col-md-6 col-lg-4 mb-3">
                              <div 
                                className="card h-100 auction-card"
                                onClick={() => navigate(`/auction/${auction._id}`)}
                              >
                                <div className="position-relative">
                                  <img 
                                    src={auction.image || getAuctionItemPlaceholder()}
                                    className="card-img-top auction-image" 
                                    alt={auction.title} 
                                  />
                                  <div className="bid-status-badge winning">
                                    {userData?.role === 'seller' ? 'Sold' : 'Won'}
                                  </div>
                                </div>
                                <div className="card-body">
                                  <h5 className="card-title">{auction.title}</h5>
                                  <p className="card-text small">{auction.description?.substring(0, 100)}...</p>
                                  <div className="d-flex justify-content-between align-items-center mt-2">
                                    <span className="text-success fw-bold">₹{auction.highestBid}</span>
                                    <small className="text-muted">
                                      {userData?.role === 'seller' 
                                        ? `Winner: ${auction.winner?.name || 'Unknown'}` 
                                        : `Won on ${new Date(auction.endTime).toLocaleDateString()}`}
                                    </small>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {/* My Listings Tab - Only shown for sellers */}
            {activeTab === "listings" && (
              <div className="tab-pane fade show active">
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <h3 className="mb-0">My Listings</h3>
                  <div className="btn-group" role="group" aria-label="Listing filters">
                    <button 
                      type="button" 
                      className={`btn ${listingFilter === "all" ? "btn-primary" : "btn-outline-secondary"}`}
                      onClick={() => filterListings("all")}
                    >
                      All Listings
                    </button>
                    <button 
                      type="button" 
                      className={`btn ${listingFilter === "active" ? "btn-primary" : "btn-outline-secondary"}`}
                      onClick={() => filterListings("active")}
                    >
                      Active
                    </button>
                    <button 
                      type="button" 
                      className={`btn ${listingFilter === "ended" ? "btn-primary" : "btn-outline-secondary"}`}
                      onClick={() => filterListings("ended")}
                    >
                      Ended
                    </button>
                    <button 
                      type="button" 
                      className={`btn ${listingFilter === "noBids" ? "btn-primary" : "btn-outline-secondary"}`}
                      onClick={() => filterListings("noBids")}
                    >
                      No Bids
                    </button>
                  </div>
                </div>

                {!filteredListings && (
                  <div className="text-center my-5">
                    <div className="spinner-border" role="status">
                      <span className="visually-hidden">Loading...</span>
                    </div>
                  </div>
                )}

                {filteredListings && filteredListings.length === 0 && (
                  <div className="alert alert-info">
                    You don't have any listings that match the selected filter.
                  </div>
                )}

                {filteredListings && filteredListings.length > 0 && (
                  <div className="row">
                    {filteredListings.map((listing) => (
                      <div key={listing._id} className="col-md-4 mb-4">
                        <div className={`card h-100 ${theme === 'dark' ? 'bg-dark text-light' : ''}`}>
                          <img 
                            src={listing.images && listing.images.length > 0 ? listing.images[0] : getAuctionItemPlaceholder()} 
                            className="card-img-top listing-img" 
                            alt={listing.title} 
                            style={{ height: "200px", objectFit: "cover" }}
                          />
                          <div className="card-body d-flex flex-column">
                            <h5 className="card-title">{listing.title}</h5>
                            <p className="card-text">{listing.description.substring(0, 100)}...</p>
                            <div className="mt-auto">
                              <p className="mb-1">
                                <strong>Current Bid:</strong> ₹{listing.currentBid || listing.startingBid}
                              </p>
                              <p className="mb-2">
                                <strong>Status:</strong> {new Date(listing.endTime) > new Date() ? (
                                  <span className="text-success">Active</span>
                                ) : (
                                  <span className="text-danger">Ended</span>
                                )}
                              </p>
                              <p className="mb-2">
                                <strong>Bids:</strong> {listing.bids ? listing.bids.length : 0}
                              </p>
                              <p className="mb-3">
                                <strong>Time Left:</strong> {formatTimeLeft(listing.endTime)}
                              </p>
                              <Link to={`/auction/${listing._id}`} className="btn btn-primary w-100">
                                View Details
                              </Link>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Active Listings Tab - Only shown for sellers */}
            {activeTab === "activeListings" && userData?.role === 'seller' && (
              <div className="row">
                <div className="col-12 mb-4">
                  <div className="card">
                    <div className="card-header d-flex justify-content-between align-items-center">
                      <h5 className="mb-0"><FaBell className="me-2" />Active Listings</h5>
                      <button className="btn btn-primary btn-sm" onClick={() => setActiveTab("createListing")}>
                        + Create New Auction
                      </button>
                    </div>
                    <div className="card-body">
                      {!filteredListings && (
                        <div className="text-center my-5">
                          <div className="spinner-border" role="status">
                            <span className="visually-hidden">Loading...</span>
                          </div>
                        </div>
                      )}
                      {filteredListings && filteredListings.length === 0 ? (
                        <div className="text-center my-5">
                          <FaStore style={{ fontSize: "3rem", color: "var(--primary-color)", opacity: 0.5 }} />
                          <h5 className="mt-3">You don't have any active auction listings</h5>
                          <p className="text-muted">Create a new auction to get started</p>
                          <button 
                            className="btn btn-primary mt-2"
                            onClick={() => setActiveTab("createListing")}
                          >
                            Create Auction
                          </button>
                        </div>
                      ) : (
                        <div className="row">
                          {filteredListings && filteredListings.map((listing) => (
                              <div key={listing._id} className="col-md-6 col-lg-4 mb-3">
                                <div 
                                  className="card h-100 auction-card"
                                  onClick={() => navigate(`/auction/${listing._id}`)}
                                >
                                  <div className="position-relative">
                                    <img 
                                      src={listing.image || getAuctionItemPlaceholder()}
                                      className="card-img-top auction-image" 
                                      alt={listing.title} 
                                    />
                                    <div className="bid-status-badge active">
                                      Active
                                    </div>
                                  </div>
                                  <div className="card-body">
                                    <h5 className="card-title">{listing.title}</h5>
                                    <p className="card-text small">{listing.description?.substring(0, 100)}...</p>
                                    <div className="d-flex justify-content-between">
                                      <div>
                                        <p className="mb-0 small">Starting bid</p>
                                        <p className="text-primary fw-bold">₹{listing.startingBid}</p>
                                      </div>
                                      <div>
                                        <p className="mb-0 small">Current high</p>
                                        <p className="text-danger fw-bold">₹{listing.highestBid || listing.startingBid}</p>
                                      </div>
                                    </div>
                                    <div className="text-end mt-2">
                                      <small className="text-muted">{formatTimeLeft(listing.endTime)}</small>
                                    </div>
                                  </div>
                                </div>
                              </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Create Listing Tab (integrated Sell component) */}
            {activeTab === "createListing" && userData?.role === 'seller' && (
              <div className="row">
                <div className="col-12">
                  <Sell 
                    onAddItem={() => {
                      // After successfully adding an item, refresh the listings
                      fetchUserListings(localStorage.getItem("userId"));
                      // Switch to listings tab after creation
                      setActiveTab("listings");
                      // Show success message
                      setSuccess("Item successfully listed! It now appears in your listings.");
                    }} 
                  />
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default Profile;