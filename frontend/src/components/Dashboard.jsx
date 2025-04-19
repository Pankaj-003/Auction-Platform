import React, { useState, useEffect } from "react";
import { FaUser, FaGavel, FaEye, FaHistory, FaTrophy, FaBell, FaHeart, FaInfoCircle } from "react-icons/fa";
import "../styles/Dashboard.css";
import { Link } from "react-router-dom";

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState("profile");
  const [stats, setStats] = useState({
    bidsPlaced: 0,
    activeAuctions: 0,
    auctionsWon: 0,
    watchlistItems: 0,
  });
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState(null);
  const [myAuctions, setMyAuctions] = useState([]);
  const [watchlist, setWatchlist] = useState([]);
  
  const userId = localStorage.getItem("userId");

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    if (!userId) return;
    
    setLoading(true);
    try {
      // Fetch all dashboard data in parallel
      const [statsRes, activitiesRes, profileRes, auctionsRes, watchlistRes] = await Promise.all([
        fetch(`http://localhost:8000/api/dashboard/stats/${userId}`),
        fetch(`http://localhost:8000/api/dashboard/activities/${userId}`),
        fetch(`http://localhost:8000/api/users/${userId}`),
        fetch(`http://localhost:8000/api/auctions/user/${userId}`),
        fetch(`http://localhost:8000/api/watchlist/${userId}`)
      ]);

      const statsData = await statsRes.json();
      const activitiesData = await activitiesRes.json();
      const profileData = await profileRes.json();
      const auctionsData = await auctionsRes.json();
      const watchlistData = await watchlistRes.json();

      setStats(statsData);
      setActivities(activitiesData);
      setUserProfile(profileData);
      setMyAuctions(auctionsData);
      setWatchlist(watchlistData);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  // Format relative time
  const formatTimeAgo = (dateString) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInSeconds = Math.floor((now - date) / 1000);
    
    if (diffInSeconds < 60) return `${diffInSeconds} seconds ago`;
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} days ago`;
    return `${Math.floor(diffInSeconds / 604800)} weeks ago`;
  };

  // Get activity icon based on type
  const getActivityIcon = (type) => {
    switch (type) {
      case 'bid': return <FaGavel className="activity-icon bid" />;
      case 'win': return <FaTrophy className="activity-icon win" />;
      case 'watchlist': return <FaHeart className="activity-icon watchlist" />;
      default: return <FaInfoCircle className="activity-icon" />;
    }
  };

  // Render loading spinner
  if (loading) {
    return (
      <div className="dashboard-container">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      {/* Dashboard Navigation */}
      <div className="dashboard-tabs">
        <div 
          className={`dashboard-tab ${activeTab === 'profile' ? 'active' : ''}`}
          onClick={() => setActiveTab('profile')}
        >
          <FaUser className="tab-icon" />
          <span>Profile</span>
        </div>
        <div 
          className={`dashboard-tab ${activeTab === 'auctions' ? 'active' : ''}`}
          onClick={() => setActiveTab('auctions')}
        >
          <FaGavel className="tab-icon" />
          <span>My Auctions</span>
        </div>
        <div 
          className={`dashboard-tab ${activeTab === 'watchlist' ? 'active' : ''}`}
          onClick={() => setActiveTab('watchlist')}
        >
          <FaEye className="tab-icon" />
          <span>Watchlist</span>
        </div>
        <div 
          className={`dashboard-tab ${activeTab === 'activity' ? 'active' : ''}`}
          onClick={() => setActiveTab('activity')}
        >
          <FaHistory className="tab-icon" />
          <span>Activity</span>
        </div>
      </div>

      {/* Dashboard Content */}
      <div className="dashboard-content">
        {/* Stats Cards */}
        <div className="stats-container">
          <div className="stat-card">
            <FaGavel className="stat-icon" />
            <div className="stat-number">{stats.bidsPlaced}</div>
            <div className="stat-label">Bids Placed</div>
          </div>
          <div className="stat-card">
            <FaBell className="stat-icon" />
            <div className="stat-number">{stats.activeAuctions}</div>
            <div className="stat-label">Active Auctions</div>
          </div>
          <div className="stat-card">
            <FaTrophy className="stat-icon" />
            <div className="stat-number">{stats.auctionsWon}</div>
            <div className="stat-label">Auctions Won</div>
          </div>
          <div className="stat-card">
            <FaHeart className="stat-icon" />
            <div className="stat-number">{stats.watchlistItems}</div>
            <div className="stat-label">Watchlist Items</div>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'profile' && (
          <div className="profile-container">
            {userProfile ? (
              <>
                <div className="profile-header">
                  <div className="profile-avatar">{userProfile.name.charAt(0)}</div>
                  <div className="profile-info">
                    <h2>{userProfile.name}</h2>
                    <p>{userProfile.email}</p>
                    <p>Member since {new Date(userProfile.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>
                <div className="profile-details">
                  <div className="profile-section">
                    <h3>Account Information</h3>
                    <div className="profile-field">
                      <label>Username</label>
                      <span>{userProfile.username || "Not set"}</span>
                    </div>
                    <div className="profile-field">
                      <label>Phone</label>
                      <span>{userProfile.phone || "Not set"}</span>
                    </div>
                    <div className="profile-field">
                      <label>Address</label>
                      <span>{userProfile.address || "Not set"}</span>
                    </div>
                    <Link to="/profile/edit" className="edit-profile-btn">Edit Profile</Link>
                  </div>
                </div>
              </>
            ) : (
              <div className="empty-profile">
                <p>Profile not found. Please log in again.</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'auctions' && (
          <div className="my-auctions-container">
            <h3>My Listed Auctions</h3>
            {myAuctions.length > 0 ? (
              <div className="auctions-grid">
                {myAuctions.map(auction => (
                  <div key={auction._id} className="auction-card">
                    <div className="auction-image" style={{backgroundImage: `url(${auction.image})`}}></div>
                    <div className="auction-details">
                      <h4>{auction.title}</h4>
                      <div className="auction-info">
                        <span>Start: ₹{auction.startingBid}</span>
                        <span>Current: ₹{auction.highestBid || auction.startingBid}</span>
                      </div>
                      <div className="auction-status">
                        {new Date(auction.endTime) > new Date() ? 
                          <span className="active-status">Active</span> : 
                          <span className="ended-status">Ended</span>
                        }
                      </div>
                      <Link to={`/auctions/${auction._id}`} className="view-auction-btn">View Details</Link>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <p>You haven't listed any auctions yet.</p>
                <Link to="/sell" className="create-auction-btn">Create Your First Auction</Link>
              </div>
            )}
          </div>
        )}

        {activeTab === 'watchlist' && (
          <div className="watchlist-container">
            <h3>My Watchlist</h3>
            {watchlist.length > 0 ? (
              <div className="watchlist-grid">
                {watchlist.map(item => (
                  <div key={item._id} className="watchlist-card">
                    <div className="watchlist-image" style={{backgroundImage: `url(${item.auction.image})`}}></div>
                    <div className="watchlist-details">
                      <h4>{item.auction.title}</h4>
                      <p className="watchlist-description">{item.auction.description}</p>
                      <div className="watchlist-info">
                        <span className="current-bid">Current Bid: ₹{item.auction.highestBid || item.auction.startingBid}</span>
                        <span className="time-remaining">
                          {new Date(item.auction.endTime) > new Date() ? 
                            `Ends: ${new Date(item.auction.endTime).toLocaleDateString()}` : 
                            "Auction Ended"
                          }
                        </span>
                      </div>
                      <div className="watchlist-actions">
                        <Link to={`/auctions/${item.auction._id}`} className="view-btn">View</Link>
                        <button className="remove-btn" onClick={() => removeFromWatchlist(item._id)}>Remove</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <p>Your watchlist is empty.</p>
                <Link to="/" className="browse-auctions-btn">Browse Auctions</Link>
              </div>
            )}
          </div>
        )}
        
        {activeTab === 'activity' && (
          <div className="activity-container">
            <h3>Recent Activity</h3>
            {activities.length > 0 ? (
              <div className="activity-list">
                {activities.map(activity => (
                  <div key={activity._id} className="activity-item">
                    {getActivityIcon(activity.type)}
                    <div className="activity-content">
                      <p className="activity-text">{activity.message}</p>
                      <span className="activity-time">{formatTimeAgo(activity.createdAt)}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-activity">
                <p>No recent activity found.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard; 