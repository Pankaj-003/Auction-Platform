import React from 'react';
import { Link } from 'react-router-dom';
import { FaGithub, FaTwitter, FaLinkedin, FaEnvelope, FaCode } from 'react-icons/fa';
import '../styles/Footer.css';

const Footer = () => {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="futuristic-footer">
      <div className="grid-bg"></div>
      
      <div className="footer-content glass-panel">
        <div className="footer-brand">
          <h3 className="footer-logo gradient-text">AuctionHub</h3>
          <p className="footer-tagline">The Future of Online Auctions</p>
        </div>
        
        <div className="footer-nav">
          <div className="footer-nav-group">
            <h4 className="footer-nav-title">Platform</h4>
            <div className="footer-nav-links">
              <Link to="/" className="footer-nav-link">Home</Link>
              <Link to="/auctions" className="footer-nav-link">Auctions</Link>
              <Link to="/dashboard" className="footer-nav-link">Dashboard</Link>
              <Link to="/winners" className="footer-nav-link">Winners</Link>
            </div>
          </div>
          
          <div className="footer-nav-group">
            <h4 className="footer-nav-title">Support</h4>
            <div className="footer-nav-links">
              <Link to="/contact" className="footer-nav-link">Contact Us</Link>
              <Link to="/help" className="footer-nav-link">Help Center</Link>
              <Link to="/privacy" className="footer-nav-link">Privacy Policy</Link>
              <Link to="/terms" className="footer-nav-link">Terms of Service</Link>
            </div>
          </div>
        </div>
        
        <div className="footer-social">
          <h4 className="footer-social-title">Connect</h4>
          <div className="social-icons">
            <a href="https://github.com/yourgithub" target="_blank" rel="noopener noreferrer" aria-label="GitHub">
              <FaGithub />
            </a>
            <a href="https://twitter.com/yourtwitter" target="_blank" rel="noopener noreferrer" aria-label="Twitter">
              <FaTwitter />
            </a>
            <a href="https://linkedin.com/in/yourlinkedin" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn">
              <FaLinkedin />
            </a>
            <a href="mailto:your.email@example.com" aria-label="Email">
              <FaEnvelope />
            </a>
          </div>
        </div>
      </div>
      
      <div className="footer-bottom">
        <div className="footer-copyright">
          <p>© {currentYear} AuctionHub. All Rights Reserved.</p>
          <p className="developer-credit">
            <FaCode /> Developed by Pankaj Biswas
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
