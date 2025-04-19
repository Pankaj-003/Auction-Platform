import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FaUser, FaEnvelope, FaCamera, FaSave, FaGavel, FaEye, FaHistory, FaTrophy, FaHeart, FaBell } from "react-icons/fa";
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
  const [activeTab, setActiveTab] = useState("profile");
  
  // Mock auction data for demonstration
  const [auctionStats] = useState({
    bidsPlaced: 12,
    activeAuctions: 3,
    wonAuctions: 2,
    watchlistCount: 5
  });
  
  // Mock watchlist data for demonstration
  const [watchlist] = useState([
    {
      id: 1,
      title: "Vintage Camera",
      image: "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?q=80&w=100",
      currentBid: 5200,
      endTime: new Date(Date.now() + 86400000), // 1 day from now
    },
    {
      id: 2,
      title: "Antique Watch",
      image: "https://images.unsplash.com/photo-1524592094857-4f23a29cff92?q=80&w=100",
      currentBid: 7800,
      endTime: new Date(Date.now() + 172800000), // 2 days from now
    },
    {
      id: 3,
      title: "Collectible Coins",
      image: "https://images.unsplash.com/photo-1605792657660-596af9009e82?q=80&w=100",
      currentBid: 3500,
      endTime: new Date(Date.now() + 259200000), // 3 days from now
    }
  ]);
  
  // Mock activity data for demonstration
  const [activities] = useState([
    {
      id: 1,
      type: "bid",
      title: "You placed a bid on Vintage Camera",
      time: new Date(Date.now() - 3600000), // 1 hour ago
      icon: <FaGavel />
    },
    {
      id: 2,
      type: "win",
      title: "You won the auction for Antique Vase",
      time: new Date(Date.now() - 86400000), // 1 day ago
      icon: <FaTrophy />
    },
    {
      id: 3,
      type: "watchlist",
      title: "You added Rare Stamps to your watchlist",
      time: new Date(Date.now() - 172800000), // 2 days ago
      icon: <FaHeart />
    }
  ]);
  
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
  
  const formatTimeAgo = (date) => {
    const seconds = Math.floor((new Date() - date) / 1000);
    
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
    const diff = endTime - new Date();
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
      <div 
        className="d-flex flex-column justify-content-center align-items-center vh-100" 
        style={{ background: "#121212" }}
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
                  {userData?.role || JSON.parse(localStorage.getItem("user") || '{}').role || "User"}
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
                    onClick={() => setActiveTab("auctions")}
                  >
                    <FaGavel className="me-2" />
                    My Auctions
                  </button>
                </li>
                <li className="nav-item">
                  <button 
                    className={`btn ${activeTab === "watchlist" ? "btn-primary" : "btn-dark"} me-2`}
                    onClick={() => setActiveTab("watchlist")}
                  >
                    <FaEye className="me-2" />
                    Watchlist
                  </button>
                </li>
                <li className="nav-item">
                  <button 
                    className={`btn ${activeTab === "activity" ? "btn-primary" : "btn-dark"}`}
                    onClick={() => setActiveTab("activity")}
                  >
                    <FaHistory className="me-2" />
                    Activity
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
        
        {/* Fetch status indicator */}
        {fetchStatus.tried && !loading && !fetchStatus.success && (
          <div className="alert alert-warning small py-2 mb-3">
            <div className="d-flex align-items-center">
              <span className="text-warning me-2">⚠</span>
              <span>Using cached profile data. Some information might be outdated.</span>
            </div>
          </div>
        )}
        
        {/* Profile Tab */}
        {activeTab === "profile" && (
          <div className="row">
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
                    <div className="stats-value">{auctionStats.bidsPlaced}</div>
                    <div className="stats-label">Bids Placed</div>
                  </div>
                </div>
                <div className="col-md-6 col-lg-3 mb-3">
                  <div className="stats-card">
                    <FaBell className="mb-3" style={{ fontSize: "2rem", color: "var(--primary-color)" }} />
                    <div className="stats-value">{auctionStats.activeAuctions}</div>
                    <div className="stats-label">Active Auctions</div>
                  </div>
                </div>
                <div className="col-md-6 col-lg-3 mb-3">
                  <div className="stats-card">
                    <FaTrophy className="mb-3" style={{ fontSize: "2rem", color: "var(--secondary-color)" }} />
                    <div className="stats-value">{auctionStats.wonAuctions}</div>
                    <div className="stats-label">Auctions Won</div>
                  </div>
                </div>
                <div className="col-md-6 col-lg-3 mb-3">
                  <div className="stats-card">
                    <FaHeart className="mb-3" style={{ fontSize: "2rem", color: "#f87171" }} />
                    <div className="stats-value">{auctionStats.watchlistCount}</div>
                    <div className="stats-label">Watchlist Items</div>
                  </div>
                </div>
              </div>
              
              <div className="card">
                <div className="card-header">
                  <h5 className="mb-0"><FaHistory className="me-2" />Recent Activity</h5>
                </div>
                <div className="card-body">
                  {activities.length === 0 ? (
                    <p className="text-muted text-center">No recent activities</p>
                  ) : (
                    <div className="list-group">
                      {activities.slice(0, 3).map((activity) => (
                        <div key={activity.id} className="list-group-item bg-dark border-secondary d-flex align-items-center">
                          <div className="me-3" style={{ color: activity.type === 'win' ? 'var(--secondary-color)' : 'var(--primary-color)' }}>
                            {activity.icon}
                          </div>
                          <div className="flex-grow-1">
                            <div className="fw-bold">{activity.title}</div>
                            <div className="text-muted small">{formatTimeAgo(activity.time)}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  {activities.length > 3 && (
                    <button 
                      className="btn btn-link text-primary d-block mx-auto mt-3"
                      onClick={() => setActiveTab("activity")}
                    >
                      View all activity
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Auctions Tab */}
        {activeTab === "auctions" && (
          <div className="row">
            <div className="col-12 mb-4">
              <div className="card">
                <div className="card-header d-flex justify-content-between align-items-center">
                  <h5 className="mb-0"><FaGavel className="me-2" />My Auctions</h5>
                  <button className="btn btn-primary btn-sm" onClick={() => navigate("/sell")}>
                    + Create New Auction
                  </button>
                </div>
                <div className="card-body">
                  <ul className="nav nav-tabs mb-4">
                    <li className="nav-item">
                      <button className="nav-link active">Active Bids</button>
                    </li>
                    <li className="nav-item">
                      <button className="nav-link">Won Auctions</button>
                    </li>
                    <li className="nav-item">
                      <button className="nav-link">My Listings</button>
                    </li>
                  </ul>
                  
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
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Watchlist Tab */}
        {activeTab === "watchlist" && (
          <div className="row">
            <div className="col-12 mb-4">
              <div className="card">
                <div className="card-header">
                  <h5 className="mb-0"><FaEye className="me-2" />My Watchlist</h5>
                </div>
                <div className="card-body">
                  {watchlist.length === 0 ? (
                    <div className="text-center my-5">
                      <FaEye style={{ fontSize: "3rem", color: "var(--primary-color)", opacity: 0.5 }} />
                      <h5 className="mt-3">Your watchlist is empty</h5>
                      <p className="text-muted">Add items to your watchlist to keep track of them</p>
                      <button 
                        className="btn btn-primary mt-2"
                        onClick={() => navigate("/")}
                      >
                        Browse Auctions
                      </button>
                    </div>
                  ) : (
                    <div className="list-group">
                      {watchlist.map((item) => (
                        <div 
                          key={item.id} 
                          className="list-group-item bg-dark border-secondary d-flex align-items-center"
                          style={{ cursor: "pointer" }}
                          onClick={() => navigate(`/auction/${item.id}`)}
                        >
                          <img 
                            src={item.image} 
                            alt={item.title} 
                            className="me-3" 
                            style={{ width: "60px", height: "60px", objectFit: "cover", borderRadius: "5px" }}
                          />
                          <div className="flex-grow-1">
                            <h6 className="mb-1">{item.title}</h6>
                            <div className="d-flex justify-content-between">
                              <span className="text-success">₹ {item.currentBid.toLocaleString()}</span>
                              <span className="text-muted small">{formatTimeLeft(item.endTime)}</span>
                            </div>
                          </div>
                          <button 
                            className="btn btn-outline-danger btn-sm ms-2"
                            onClick={(e) => {
                              e.stopPropagation();
                              alert("Item removed from watchlist");
                            }}
                          >
                            <FaHeart />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Activity Tab */}
        {activeTab === "activity" && (
          <div className="row">
            <div className="col-12 mb-4">
              <div className="card">
                <div className="card-header">
                  <h5 className="mb-0"><FaHistory className="me-2" />Activity History</h5>
                </div>
                <div className="card-body">
                  {activities.length === 0 ? (
                    <div className="text-center my-5">
                      <FaHistory style={{ fontSize: "3rem", color: "var(--primary-color)", opacity: 0.5 }} />
                      <h5 className="mt-3">No activity yet</h5>
                      <p className="text-muted">Your auction activities will appear here</p>
                      <button 
                        className="btn btn-primary mt-2"
                        onClick={() => navigate("/")}
                      >
                        Browse Auctions
                      </button>
                    </div>
                  ) : (
                    <div className="list-group">
                      {activities.map((activity) => (
                        <div key={activity.id} className="list-group-item bg-dark border-secondary d-flex align-items-center">
                          <div className="me-3" style={{ color: activity.type === 'win' ? 'var(--secondary-color)' : 'var(--primary-color)' }}>
                            {activity.icon}
                          </div>
                          <div className="flex-grow-1">
                            <div className="fw-bold">{activity.title}</div>
                            <div className="text-muted small">{formatTimeAgo(activity.time)}</div>
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