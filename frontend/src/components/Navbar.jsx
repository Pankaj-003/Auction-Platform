import React, { useState, useEffect, useRef, useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap/dist/js/bootstrap.bundle.min.js";
import "../styles/Navbar.css";
import { getUserProfile } from "../api/auth";
import { FaChevronDown, FaUser, FaSignOutAlt, FaMoon, FaSun } from "react-icons/fa";
import { useTheme } from "../context/ThemeProvider";
import { AuthContext } from "../context/AuthContext";

const Navbar = () => {
  const { isAuthenticated, user, logout } = useContext(AuthContext);
  const [userProfile, setUserProfile] = useState(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();

  // Load user from context or localStorage
  useEffect(() => {
    if (user) {
      setUserProfile(user);
    } else if (isAuthenticated) {
      // If not provided via context, try to load from localStorage
      const storedUser = localStorage.getItem("user");
      
      if (storedUser) {
        try {
          const parsedUser = JSON.parse(storedUser);
          setUserProfile(parsedUser);
        } catch (error) {
          console.error("Error parsing user data:", error);
        }
      }
    } else {
      setUserProfile(null);
    }
  }, [user, isAuthenticated]);

  // Logout handler
  const handleLogoutClick = () => {
    logout();
    setShowDropdown(false);
  };

  // Function to fetch user profile from MongoDB
  const fetchUserProfile = async (userId) => {
    try {
      if (!userId) {
        console.error("Cannot fetch profile: User ID is missing");
        return;
      }
      
      console.log(`Navbar: Fetching profile for user ID: ${userId}`);
      const response = await getUserProfile(userId);
      
      if (response && response.data) {
        console.log("Navbar: User profile fetched successfully");
        
        // Update only the userProfile state with the latest data
        setUserProfile(prev => ({
          ...prev,
          userId: userId,
          profilePic: response.data.profilePic,
          name: response.data.name,
          email: response.data.email,
          role: response.data.role
        }));
        
        // Also update localStorage with the latest profile data
        const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
        localStorage.setItem("user", JSON.stringify({
          ...storedUser,
          userId: userId,
          profilePic: response.data.profilePic,
          name: response.data.name,
          email: response.data.email,
          role: response.data.role
        }));
        
        console.log("Navbar: Updated user profile in localStorage");
      }
    } catch (error) {
      console.error("Navbar: Error fetching user profile:", error);
      // Don't throw - just log the error since this is a secondary function
    }
  };

  const handleProfileClick = () => {
    // Force check localStorage for token in case state is out of sync
    const token = localStorage.getItem("token");
    console.log("Profile click - Token exists:", !!token);
    
    if (!token) {
      console.warn("No token found, redirecting to signin");
      navigate("/signin");
      return;
    }
    
    // Just navigate to profile
    console.log("Navigating to profile page");
    navigate("/profile", { replace: true });
    setShowDropdown(false);
  };

  const toggleDropdown = () => {
    // Force check localStorage for token in case bb state is out of sync
    const token = localStorage.getItem("token");
    
    if (!token) {
      navigate("/signin");
      return;
    }
    
    setShowDropdown((prev) => !prev);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Enhanced theme toggle handler with logging
  const handleThemeToggle = () => {
    console.log("Theme toggle clicked, current theme:", theme);
    toggleTheme();
  };

  return (
    <nav className="navbar navbar-expand-lg navbar-dark custom-navbar">
      <div className="container">
        <Link className="navbar-brand brand-title" to="/">
          AuctionHub
        </Link>

        <button
          className="navbar-toggler custom-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#navbarNav"
        >
          <span className="navbar-toggler-icon"></span>
        </button>

        <div className="collapse navbar-collapse justify-content-end" id="navbarNav">
          <ul className="navbar-nav align-items-center">
            <li className="nav-item">
              <Link className="nav-link" to="/">
                Auctions
              </Link>
            </li>
            <li className="nav-item">
              <Link className="nav-link" to="/contact">
                Contact
              </Link>
            </li>

            {isAuthenticated && (
              <>
                <li className="nav-item">
                  <button 
                    className="theme-toggle-navbar" 
                    onClick={handleThemeToggle}
                    aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
                  >
                    {theme === 'light' ? (
                      <FaMoon className="icon" />
                    ) : (
                      <FaSun className="icon" />
                    )}
                    <span className="theme-label">{theme === 'light' ? 'Dark Mode' : 'Light Mode'}</span>
                  </button>
                </li>
              </>
            )}

            {isAuthenticated ? (
              <li className="nav-item position-relative" ref={dropdownRef}>
                <div 
                  className="d-flex align-items-center" 
                  onClick={toggleDropdown}
                  style={{ cursor: "pointer" }}
                >
                  <img
                    src={
                      userProfile?.profilePic
                        ? userProfile.profilePic.startsWith("http")
                          ? userProfile.profilePic
                          : `http://localhost:8000/${userProfile.profilePic.replace(/^\/+/, "")}`
                        : `https://ui-avatars.com/api/?name=${userProfile?.name || "User"}&background=random`
                    }
                    alt="Profile"
                    className="rounded-circle profile-image"
                    style={{
                      marginLeft: "5px",
                      objectFit: "cover",
                    }}

                    title="Your Profile" 
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = `https://ui-avatars.com/api/?name=${userProfile?.name || "User"}&background=random`;
                    }}
                  />
                  {/* {userProfile?.name && (
                    <span className="ms-2 text-white">
                      {userProfile.name.split(' ')[0]}
                    </span>
                  )} */}
                </div>

                {showDropdown && (
                  <div
                    className="dropdown-menu show position-absolute"
                    style={{
                      right: 0,
                      top: "45px",
                      minWidth: "140px",
                    }}
                  >
                    <button className="dropdown-item" onClick={handleProfileClick}>
                      Profile
                    </button>
                    <button
                      className="dropdown-item text-danger"
                      onClick={handleLogoutClick}
                    >
                      Logout
                    </button>
                  </div>
                )}
              </li>
            ) : (
              <>
                <li className="nav-item">
                  <button 
                    className="theme-toggle-navbar" 
                    onClick={handleThemeToggle}
                    aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
                  >
                    {theme === 'light' ? (
                      <FaMoon className="icon" />
                    ) : (
                      <FaSun className="icon" />
                    )}
                    <span className="theme-label">{theme === 'light' ? 'Dark Mode' : 'Light Mode'}</span>
                  </button>
                </li>
                <li className="nav-item ms-2">
                  <Link className="btn login-btn" to="/signin">
                    Login
                  </Link>
                </li>
              </>
            )}
          </ul>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
