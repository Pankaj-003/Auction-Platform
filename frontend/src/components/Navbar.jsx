import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap/dist/js/bootstrap.bundle.min.js";
import "../Navbar.css";

const Navbar = ({ isAuthenticated, setIsAuthenticated }) => {
  const [userProfile, setUserProfile] = useState(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  // Load user from localStorage
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    const token = localStorage.getItem("token");

    if (storedUser && token) {
      const parsedUser = JSON.parse(storedUser);
      setUserProfile(parsedUser);
      setIsAuthenticated(true);
    } else {
      setIsAuthenticated(false);
    }
  }, [setIsAuthenticated]);

  // Logout
  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    setIsAuthenticated(false);
    setShowDropdown(false);
    navigate("/signin");
  };

  const handleProfileClick = () => {
    navigate("/profile");
    setShowDropdown(false);
  };

  const toggleDropdown = () => {
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
              <Link className="nav-link" to="/sell">
                Sell
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
                  <Link className="nav-link" to="/mybids">
                    My Bids
                  </Link>
                </li>
                <li className="nav-item">
                  <Link className="nav-link" to="/winners">
                    Winners
                  </Link>
                </li>
              </>
            )}

            {isAuthenticated ? (
              <li className="nav-item position-relative" ref={dropdownRef}>
              <img
  src={
    userProfile?.profilePic
      ? userProfile.profilePic.startsWith("http")
        ? userProfile.profilePic
        : `http://localhost:8000/${userProfile.profilePic.replace(/^\/+/, "")}`
      : "https://ui-avatars.com/api/?name=User&background=random"
  }
  alt={userProfile?.name || "User"}
  className="rounded-circle"
  style={{
    width: "35px",
    height: "35px",
    marginLeft: "15px",
    cursor: "pointer",
    objectFit: "cover",
    border: "2px solid #ddd",
  }}
  onClick={toggleDropdown}
  title={userProfile?.name || "Profile"}
  onError={(e) => {
    e.target.onerror = null;
    e.target.src = "https://ui-avatars.com/api/?name=User&background=random";
  }}
/>



                {showDropdown && (
                  <div
                    className="dropdown-menu show position-absolute"
                    style={{
                      right: 0,
                      top: "45px",
                      minWidth: "140px",
                      boxShadow: "0px 4px 12px rgba(0,0,0,0.1)",
                    }}
                  >
                    <button className="dropdown-item" onClick={handleProfileClick}>
                      Profile
                    </button>
                    <button
                      className="dropdown-item text-danger"
                      onClick={handleLogout}
                    >
                      Logout
                    </button>
                  </div>
                )}
              </li>
            ) : (
              <li className="nav-item ms-2">
                <Link className="btn btn-light login-btn" to="/signin">
                  Login
                </Link>
              </li>
            )}
          </ul>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
