import React from "react";
import { Link } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap/dist/js/bootstrap.bundle.min.js";
import "../index.css";

const Navbar = ({ isAuthenticated, setIsAuthenticated }) => {
  const handleLogout = () => {
    localStorage.removeItem("userId");
    setIsAuthenticated(false);
  };

  return (
    <nav className="navbar navbar-expand-lg navbar-dark custom-navbar">
      <div className="container">
        <Link className="navbar-brand brand-title" to="/">AuctionHub</Link>

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
              <Link className="nav-link" to="/">Auctions</Link>
            </li>
            <li className="nav-item">
              <Link className="nav-link" to="/sell">Sell</Link>
            </li>
            <li className="nav-item">
              <Link className="nav-link" to="/contact">Contact</Link>
            </li>

            {isAuthenticated && (
              <>
                <li className="nav-item">
                  <Link className="nav-link" to="/mybids">My Bids</Link>
                </li>
                {/* <li className="nav-item">
                  <Link className="nav-link" to="/winners">Winners</Link>
                </li> */}
              </>
            )}

            <li className="nav-item ms-2">
              {isAuthenticated ? (
                <button className="btn btn-danger logout-btn" onClick={handleLogout}>
                  Logout
                </button>
              ) : (
                <Link className="btn btn-light login-btn" to="/signin">
                  Login
                </Link>
              )}
            </li>
          </ul>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
