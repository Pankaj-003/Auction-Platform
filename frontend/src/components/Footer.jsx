import React from "react";
import "bootstrap/dist/css/bootstrap.min.css";
// import './Footer.css';  // Import custom styles
import "../Footer.css"
const Footer = () => {
  return (
    <footer className="footer bg-dark text-light py-4 mt-5">
      <div className="container text-center">
        <p className="footer-text mb-1">
          © {new Date().getFullYear()} AuctionHub. All Rights Reserved @Pankaj Biswas.
        </p>
        <div className="footer-links">
          <a href="#" className="text-light mx-3 footer-link">Privacy Policy</a> | 
          <a href="#" className="text-light mx-3 footer-link">Terms of Service</a> | 
          <a href="/contact" className="text-light mx-3 footer-link">Contact Us</a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
