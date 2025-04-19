import React from 'react';
import { Link } from 'react-router-dom';
import '../styles/Footer.css';

const Footer = () => {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="simple-footer">
      <div className="footer-container">
        <div className="footer-copyright">
          © {currentYear} AuctionHub. All Rights Reserved @Pankaj Biswas.
        </div>
        <div className="footer-links">
          <Link to="/privacy" className="footer-link">Privacy Policy</Link>
          <span className="footer-separator">|</span>
          <Link to="/terms" className="footer-link">Terms of Service</Link>
          <span className="footer-separator">|</span>
          <Link to="/contact" className="footer-link">Contact Us</Link>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
