import React, { useContext } from 'react';
import { Link } from 'react-router-dom';
import { useTheme } from '../context/ThemeProvider';
import { FaGithub, FaTwitter, FaFacebook, FaLinkedin, FaEnvelope } from 'react-icons/fa';

const Footer = () => {
  const currentYear = new Date().getFullYear();
  const { theme } = useTheme();
  
  const isDark = theme === 'dark';
  
  return (
    <footer style={{
      backgroundColor: isDark ? '#1a1a2e' : '#f8fafc',
      color: isDark ? '#e2e8f0' : '#334155',
      borderTop: `1px solid ${isDark ? '#1e293b' : '#e2e8f0'}`,
    }}>
      {/* Main footer content */}
      <div className="container py-4">
        <div className="row">
          <div className="col-12 col-md-4 mb-4 mb-md-0">
            <div className="footer-brand mb-3">
              <h5 style={{
                fontWeight: 600,
                color: isDark ? '#f1f5f9' : '#0f172a',
                marginBottom: '12px',
              }}>AuctionHub</h5>
              <p style={{
                fontSize: '14px',
                color: isDark ? '#94a3b8' : '#64748b',
                marginBottom: '16px',
                paddingRight: '20px',
                lineHeight: '1.5'
              }}>
                We provide a secure and user-friendly platform for online auctions, connecting buyers and sellers worldwide.
              </p>
            </div>
          </div>
          
          <div className="col-6 col-md-2 mb-4 mb-md-0">
            <h6 style={{
              fontSize: '14px',
              fontWeight: '600',
              textTransform: 'uppercase',
              letterSpacing: '1px',
              marginBottom: '16px',
              color: isDark ? '#f1f5f9' : '#0f172a',
            }}>Platform</h6>
            <ul style={{
              listStyle: 'none',
              padding: 0,
              margin: 0,
            }}>
              <li className="mb-2">
                <Link to="/" style={{
                  color: isDark ? '#94a3b8' : '#64748b',
                  textDecoration: 'none',
                  fontSize: '14px',
                  transition: 'color 0.2s',
                  display: 'inline-block',
                }}>Home</Link>
              </li>
              <li className="mb-2">
                <Link to="/auctions" style={{
                  color: isDark ? '#94a3b8' : '#64748b',
                  textDecoration: 'none',
                  fontSize: '14px',
                  transition: 'color 0.2s',
                  display: 'inline-block',
                }}>Auctions</Link>
              </li>
              {/* <li className="mb-2">
                <Link to="/dashboard" style={{
                  color: isDark ? '#94a3b8' : '#64748b',
                  textDecoration: 'none',
                  fontSize: '14px',
                  transition: 'color 0.2s',
                  display: 'inline-block',
                }}>Dashboard</Link>
              </li> */}
              <li className="mb-2">
                <Link to="/winners" style={{
                  color: isDark ? '#94a3b8' : '#64748b',
                  textDecoration: 'none',
                  fontSize: '14px',
                  transition: 'color 0.2s',
                  display: 'inline-block',
                }}>Winners</Link>
              </li>
            </ul>
          </div>
          
          <div className="col-6 col-md-2 mb-4 mb-md-0">
            <h6 style={{
              fontSize: '14px',
              fontWeight: '600',
              textTransform: 'uppercase',
              letterSpacing: '1px',
              marginBottom: '16px',
              color: isDark ? '#f1f5f9' : '#0f172a',
            }}>Support</h6>
            <ul style={{
              listStyle: 'none',
              padding: 0,
              margin: 0,
            }}>
              <li className="mb-2">
                <Link to="/contact" style={{
                  color: isDark ? '#94a3b8' : '#64748b',
                  textDecoration: 'none',
                  fontSize: '14px',
                  transition: 'color 0.2s',
                  display: 'inline-block',
                }}>Contact Us</Link>
              </li>
              <li className="mb-2">
                <Link to="/help" style={{
                  color: isDark ? '#94a3b8' : '#64748b',
                  textDecoration: 'none',
                  fontSize: '14px',
                  transition: 'color 0.2s',
                  display: 'inline-block',
                }}>Help Center</Link>
              </li>
              <li className="mb-2">
                <Link to="/faq" style={{
                  color: isDark ? '#94a3b8' : '#64748b',
                  textDecoration: 'none',
                  fontSize: '14px',
                  transition: 'color 0.2s',
                  display: 'inline-block',
                }}>FAQ</Link>
              </li>
            </ul>
          </div>
          
          <div className="col-6 col-md-2 mb-4 mb-md-0">
            <h6 style={{
              fontSize: '14px',
              fontWeight: '600',
              textTransform: 'uppercase',
              letterSpacing: '1px',
              marginBottom: '16px',
              color: isDark ? '#f1f5f9' : '#0f172a',
            }}>Legal</h6>
            <ul style={{
              listStyle: 'none',
              padding: 0,
              margin: 0,
            }}>
              <li className="mb-2">
                <Link to="/privacy" style={{
                  color: isDark ? '#94a3b8' : '#64748b',
                  textDecoration: 'none',
                  fontSize: '14px',
                  transition: 'color 0.2s',
                  display: 'inline-block',
                }}>Privacy Policy</Link>
              </li>
              <li className="mb-2">
                <Link to="/terms" style={{
                  color: isDark ? '#94a3b8' : '#64748b',
                  textDecoration: 'none',
                  fontSize: '14px',
                  transition: 'color 0.2s',
                  display: 'inline-block',
                }}>Terms of Service</Link>
              </li>
              <li className="mb-2">
                <Link to="/refund" style={{
                  color: isDark ? '#94a3b8' : '#64748b',
                  textDecoration: 'none',
                  fontSize: '14px',
                  transition: 'color 0.2s',
                  display: 'inline-block',
                }}>Refund Policy</Link>
              </li>
            </ul>
          </div>
          
          <div className="col-6 col-md-2 mb-4 mb-md-0">
            <h6 style={{
              fontSize: '14px',
              fontWeight: '600',
              textTransform: 'uppercase',
              letterSpacing: '1px',
              marginBottom: '16px',
              color: isDark ? '#f1f5f9' : '#0f172a',
            }}>Connect</h6>
            <div className="social-icons" style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '16px',
              marginTop: '8px'
            }}>
              <a href="mailto:support@auctionhub.com" className="social-icon" aria-label="Email">
                <FaEnvelope />
              </a>
              <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="social-icon" aria-label="Twitter">
                <FaTwitter />
              </a>
              <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="social-icon" aria-label="Facebook">
                <FaFacebook />
              </a>
              <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="social-icon" aria-label="LinkedIn">
                <FaLinkedin />
              </a>
              {/* <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="social-icon" aria-label="GitHub">
                <FaGithub />
              </a> */}
            </div>
          </div>
        </div>
      </div>
      
      {/* Footer bottom / copyright */}
      <div style={{
        backgroundColor: isDark ? '#0f172a' : '#f1f5f9',
        padding: '16px 0',
        fontSize: '13px',
        borderTop: `1px solid ${isDark ? '#1e293b' : '#e2e8f0'}`,
      }}>
        <div className="container">
          <div className="row align-items-center">
            <div className="col-md-6 text-center text-md-start mb-2 mb-md-0">
              <span style={{ color: isDark ? '#94a3b8' : '#64748b' }}>
                © {currentYear} AuctionHub. All Rights Reserved.
              </span>
            </div>
            <div className="col-md-6 text-center text-md-end">
              <span style={{ color: isDark ? '#94a3b8' : '#64748b' }}>
                Developed by <a href="#" style={{ 
                  color: isDark ? '#a5b4fc' : '#4f46e5',
                  textDecoration: 'none'
                }}>
                  Pankaj Biswas
                </a>
              </span>
            </div>
          </div>
        </div>
      </div>
      
      <style jsx>{`
        @media (max-width: 767px) {
          .row > div {
            padding-left: 24px;
          }
        }
        
        a:hover {
          color: ${isDark ? '#a5b4fc' : '#4f46e5'} !important;
        }
        
        .social-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background-color: ${isDark ? 'rgba(165, 180, 252, 0.1)' : 'rgba(79, 70, 229, 0.1)'};
          color: ${isDark ? '#a5b4fc' : '#4f46e5'};
          font-size: 16px;
          transition: all 0.3s ease;
          position: relative;
          overflow: hidden;
        }
        
        .social-icon:hover {
          transform: translateY(-4px);
          background-color: ${isDark ? 'rgba(165, 180, 252, 0.2)' : 'rgba(79, 70, 229, 0.2)'};
          color: ${isDark ? '#c7d2fe' : '#4338ca'} !important;
          box-shadow: 0 4px 12px ${isDark ? 'rgba(165, 180, 252, 0.3)' : 'rgba(79, 70, 229, 0.3)'};
        }
        
        .social-icon::after {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: radial-gradient(circle, ${isDark ? 'rgba(165, 180, 252, 0.3)' : 'rgba(79, 70, 229, 0.3)'} 0%, transparent 70%);
          opacity: 0;
          transition: opacity 0.3s ease;
        }
        
        .social-icon:hover::after {
          opacity: 1;
          animation: pulse 1.5s infinite;
        }
        
        @keyframes pulse {
          0% { transform: scale(0.95); opacity: 0.7; }
          50% { transform: scale(1.05); opacity: 0.3; }
          100% { transform: scale(0.95); opacity: 0.7; }
        }
      `}</style>
    </footer>
  );
};

export default Footer;
