import jwt from 'jsonwebtoken';
import User from '../models/User.js';

// Use the same JWT secret as in authRoutes.js
const JWT_SECRET = process.env.JWT_SECRET || 'auction-platform-secret-key';

export const verifyToken = async (req, res, next) => {
  try {
    // Get the token from the Authorization header
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ message: 'Access denied. No token provided.' });
    }
    
    // Verify the token
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Check if user exists
    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(401).json({ message: 'Invalid token: User not found' });
    }
    
    // Add user info to request object
    req.user = {
      id: user._id,
      name: user.name,
      email: user.email,
    };
    
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: 'Invalid token' });
    } else if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token expired' });
    } else {
      console.error('Auth middleware error:', error);
      return res.status(500).json({ message: 'Server error' });
    }
  }
};

// Optional: Add other auth-related middleware functions as needed
export const isAdmin = (req, res, next) => {
  if (req.user && req.user.isAdmin) {
    next();
  } else {
    res.status(403).json({ message: 'Access denied: Admin permission required' });
  }
}; 