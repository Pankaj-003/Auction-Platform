import React, { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { FaUser, FaEnvelope, FaCamera, FaSave, FaGavel, FaEye, FaHistory, FaTrophy, FaHeart, FaBell, FaUserTag, FaStore } from "react-icons/fa";
import { getUserProfile, updateProfile } from "../api/auth";
import "../styles/Profile.css";
import { AuthContext } from "../context/AuthContext";
import RoleSelector from "./RoleSelector";
import { checkAuth } from "../utils/authUtils";

const Profile = () => {
  const navigate = useNavigate();
  const { isAuthenticated, user: contextUser, logout } = useContext(AuthContext);
  const [userData, setUserData] = useState(null);
  const [profileStats, setProfileStats] = useState(null);
  const [activeBids, setActiveBids] = useState([]);
  const [wonAuctions, setWonAuctions] = useState([]);
  const [userListings, setUserListings] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [activeTab, setActiveTab] = useState("profile");
  
  // Form state
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [profilePic, setProfilePic] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");

  useEffect(() => {
    fetchUserData();
  }, []);
  
  const fetchUserData = async () => {
    try {
      // Get token from localStorage
      const token = localStorage.getItem("token");
      if (!token) {
        console.warn("No authentication token found");
        logout();
        navigate("/signin");
        return;
      }
      
      // Get userId from localStorage
      const userId = localStorage.getItem("userId");
      if (!userId) {
        console.warn("No userId found");
        logout();
        navigate("/signin");
        return;
      }
      
      // Get initial user data from localStorage
      const storedUser = localStorage.getItem("user");
      if (storedUser) {
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
      }
      
      // Fetch user profile from API
      const response = await getUserProfile(userId);
      if (response && response.data) {
        setUserData(response.data);
        setName(response.data.name || "");
        setEmail(response.data.email || "");
        
        if (response.data.profilePic) {
          const profilePicUrl = response.data.profilePic.startsWith("http")
            ? response.data.profilePic
            : `${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/${response.data.profilePic.replace(/^\/+/, "")}`;
          setPreviewUrl(profilePicUrl);
        }
      }
      
      // Fetch profile summary data
      fetchProfileSummary(userId);
      
    } catch (error) {
      console.error("Error in profile page:", error);
      setError(`Error loading profile: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };
  
  const fetchProfileSummary = async (userId) => {
    try {
      const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
      const token = localStorage.getItem("token");
      
      const response = await fetch(`${apiBaseUrl}/api/profile/summary/${userId}`, {
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

  if (loading) {
    return (
      <div className="d-flex flex-column justify-content-center align-items-center vh-100" style={{ background: "#121212" }}>
        <div className="spinner-border text-light mb-3" style={{ width: "3rem", height: "3rem" }} role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <h5 className="text-light mt-3">Loading your profile...</h5>
      </div>
    );
  }

  return (
    <div className="profile-container">
      <div className="profile-header">
        <div className="container py-4">
          <div className="row align-items-center">
            <div className="col-md-3 mb-4 mb-md-0">
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
                <label htmlFor="profilePic" className="upload-overlay">
                  <FaCamera className="upload-btn" />
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
              <h2 className="mb-1">{name || "User"}</h2>
              <p className="mb-3 text-muted">{email || "No email set"}</p>
              <div className="d-flex align-items-center mb-3">
                <span className="badge bg-info me-2">
                  {userData?.role || "User"}
                </span>
                <span className="text-muted small">Member since {userData?.createdAt ? new Date(userData.createdAt).toLocaleDateString() : "Unknown"}</span>
              </div>
              <ul className="nav nav-pills">
                <li className="nav-item">
                  <button 
                    className={`btn ${activeTab === "profile" ? "btn-primary" : "btn-dark"} me-2`}
                    onClick={() => setActiveTab("profile")}
                  >
                    <FaUser className="me-2" />
                    Profile
                  </button>
                </li>
                <li className="nav-item">
                  <button 
                    className={`btn ${activeTab === "auctions" ? "btn-primary" : "btn-dark"} me-2`}
                    onClick={() => {
                      setActiveTab("auctions");
                      fetchUserBids(localStorage.getItem("userId"));
                    }}
                  >
                    <FaGavel className="me-2" />
                    My Bids
                  </button>
                </li>
                <li className="nav-item">
                  <button 
                    className={`btn ${activeTab === "watchlist" ? "btn-primary" : "btn-dark"} me-2`}
                    onClick={() => {
                      setActiveTab("watchlist");
                      fetchWonAuctions(localStorage.getItem("userId"));
                    }}
                  >
                    <FaTrophy className="me-2" />
                    Won Auctions
                  </button>
                </li>
                <li className="nav-item">
                  <button 
                    className={`btn ${activeTab === "listings" ? "btn-primary" : "btn-dark"}`}
                    onClick={() => {
                      setActiveTab("listings");
                      fetchUserListings(localStorage.getItem("userId"));
                    }}
                  >
                    <FaStore className="me-2" />
                    My Listings
                  </button>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
      
      <div className="container">
        {error && <div className="alert alert-danger">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}
        
        {/* Profile Tab */}
        {activeTab === "profile" && (
          <div className="row">
            {/* Role Selection Card - Only shown if role is unset */}
            {(userData?.role === 'unset' || !userData?.role) && (
              <div className="col-12 mb-4">
                <div className="card border-primary">
                  <div className="card-header bg-primary text-white">
                    <h5 className="mb-0"><FaUserTag className="me-2" />Choose Your Role</h5>
                  </div>
                  <div className="card-body">
                    <div className="alert alert-info">
                      <p className="mb-0">Please select how you would like to use our platform. This will customize your experience.</p>
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
                <div className="col-md-6 col-lg-3 mb-3">
                  <div className="stats-card">
                    <FaGavel className="mb-3" style={{ fontSize: "2rem", color: "var(--primary-color)" }} />
                    <div className="stats-value">{profileStats?.activeBids || 0}</div>
                    <div className="stats-label">Active Bids</div>
                  </div>
                </div>
                <div className="col-md-6 col-lg-3 mb-3">
                  <div className="stats-card">
                    <FaBell className="mb-3" style={{ fontSize: "2rem", color: "var(--primary-color)" }} />
                    <div className="stats-value">{profileStats?.activeListings || 0}</div>
                    <div className="stats-label">Active Listings</div>
                  </div>
                </div>
                <div className="col-md-6 col-lg-3 mb-3">
                  <div className="stats-card">
                    <FaTrophy className="mb-3" style={{ fontSize: "2rem", color: "var(--secondary-color)" }} />
                    <div className="stats-value">{profileStats?.wonAuctions || 0}</div>
                    <div className="stats-label">Auctions Won</div>
                  </div>
                </div>
                <div className="col-md-6 col-lg-3 mb-3">
                  <div className="stats-card">
                    <FaHeart className="mb-3" style={{ fontSize: "2rem", color: "#f87171" }} />
                    <div className="stats-value">{profileStats?.totalBidsPlaced || 0}</div>
                    <div className="stats-label">Total Bids</div>
                  </div>
                </div>
              </div>
              
              <div className="card">
                <div className="card-header">
                  <h5 className="mb-0"><FaHistory className="me-2" />Recent Activity</h5>
                </div>
                <div className="card-body">
                  {!recentActivity || recentActivity.length === 0 ? (
                    <p className="text-muted text-center">No recent activities</p>
                  ) : (
                    <div className="list-group">
                      {recentActivity.map((activity) => (
                        <div key={activity._id} className="list-group-item bg-dark border-secondary d-flex align-items-center">
                          <div className="me-3" style={{ color: "var(--primary-color)" }}>
                            <FaGavel />
                          </div>
                          <div className="flex-grow-1">
                            <div className="fw-bold">Bid ₹{activity.amount} on {activity.auction?.title || 'Unknown Auction'}</div>
                            <div className="text-muted small">{formatTimeAgo(activity.date)}</div>
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
                                src={bid.image || "https://via.placeholder.com/300x200?text=No+Image"} 
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
        
        {/* Won Auctions Tab */}
        {activeTab === "watchlist" && (
          <div className="row">
            <div className="col-12 mb-4">
              <div className="card">
                <div className="card-header">
                  <h5 className="mb-0"><FaTrophy className="me-2" />Won Auctions</h5>
                </div>
                <div className="card-body">
                  {wonAuctions.length === 0 ? (
                    <div className="text-center my-5">
                      <FaTrophy style={{ fontSize: "3rem", color: "var(--secondary-color)", opacity: 0.5 }} />
                      <h5 className="mt-3">You haven't won any auctions yet</h5>
                      <p className="text-muted">Keep bidding to win items!</p>
                      <button 
                        className="btn btn-primary mt-2"
                        onClick={() => navigate("/")}
                      >
                        Browse Auctions
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
                                src={auction.image || "https://via.placeholder.com/300x200?text=No+Image"} 
                                className="card-img-top auction-image" 
                                alt={auction.title} 
                              />
                              <div className="bid-status-badge winning">
                                Won
                              </div>
                            </div>
                            <div className="card-body">
                              <h5 className="card-title">{auction.title}</h5>
                              <p className="card-text small">{auction.description?.substring(0, 100)}...</p>
                              <div className="d-flex justify-content-between align-items-center mt-2">
                                <span className="text-success fw-bold">₹{auction.highestBid}</span>
                                <small className="text-muted">Won on {new Date(auction.endTime).toLocaleDateString()}</small>
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
        
        {/* My Listings Tab */}
        {activeTab === "listings" && (
          <div className="row">
            <div className="col-12 mb-4">
              <div className="card">
                <div className="card-header d-flex justify-content-between align-items-center">
                  <h5 className="mb-0"><FaStore className="me-2" />My Listings</h5>
                  <button className="btn btn-primary btn-sm" onClick={() => navigate("/sell")}>
                    + Create New Auction
                  </button>
                </div>
                <div className="card-body">
                  {userListings.length === 0 ? (
                    <div className="text-center my-5">
                      <FaStore style={{ fontSize: "3rem", color: "var(--primary-color)", opacity: 0.5 }} />
                      <h5 className="mt-3">You don't have any auction listings</h5>
                      <p className="text-muted">Create your first auction to sell items</p>
                      <button 
                        className="btn btn-primary mt-2"
                        onClick={() => navigate("/sell")}
                      >
                        Create Auction
                      </button>
                    </div>
                  ) : (
                    <div className="row">
                      {userListings.map((listing) => (
                        <div key={listing._id} className="col-md-6 col-lg-4 mb-3">
                          <div 
                            className="card h-100 auction-card"
                            onClick={() => navigate(`/auction/${listing._id}`)}
                          >
                            <div className="position-relative">
                              <img 
                                src={listing.image || "https://via.placeholder.com/300x200?text=No+Image"} 
                                className="card-img-top auction-image" 
                                alt={listing.title} 
                              />
                              <div className={`bid-status-badge ${listing.status === 'active' ? 'active' : listing.status === 'sold' ? 'winning' : 'outbid'}`}>
                                {listing.status === 'active' ? 'Active' : listing.status === 'sold' ? 'Sold' : 'Ended'}
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
                                <small className="text-muted">
                                  {listing.status === 'active' 
                                    ? formatTimeLeft(listing.endTime) 
                                    : `Ended ${formatTimeAgo(listing.endTime)}`}
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
      </div>
    </div>
  );
};

export default Profile;