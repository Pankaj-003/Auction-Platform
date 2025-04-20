import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { ensureJwtSecret, verifyToken as validateToken } from '../utils/tokenUtils.js';

// Make sure environment variables are loaded
dotenv.config();

export const verifyToken = async (req, res, next) => {
  try {
    // Get the token from the Authorization header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('Auth failed: No bearer token in header');
      return res.status(401).json({ 
        message: 'Access denied. No token provided.',
        status: 'auth_error',
        error: 'missing_token'
      });
    }
    
    const token = authHeader.split(' ')[1];
    
    if (!token) {
      console.log('Auth failed: Empty token after Bearer prefix');
      return res.status(401).json({ 
        message: 'Access denied. No token provided.',
        status: 'auth_error',
        error: 'empty_token'
      });
    }
    
    // Ensure JWT_SECRET is available and use tokenUtils
    const jwtSecret = ensureJwtSecret();
    
    // Verify the token with environment variable
    let decoded;
    try {
      decoded = validateToken(token);
      console.log('Token decoded successfully, user ID:', decoded.id || decoded.userId);
    } catch (tokenError) {
      console.error('Token validation failed:', tokenError.message);
      
      if (tokenError.name === 'JsonWebTokenError') {
        return res.status(401).json({ 
          message: 'Invalid token format or signature',
          status: 'auth_error',
          error: 'invalid_token'
        });
      } else if (tokenError.name === 'TokenExpiredError') {
        return res.status(401).json({ 
          message: 'Token expired',
          status: 'auth_error',
          error: 'expired_token'
        });
      } else {
        return res.status(500).json({ 
          message: 'Server error during authentication',
          status: 'server_error',
          error: tokenError.message
        });
      }
    }
    
    // Get user ID from token (handle both formats)
    const userId = decoded.id || decoded.userId;
    
    if (!userId) {
      console.log('Auth failed: No user ID in token');
      return res.status(401).json({ 
        message: 'Invalid token: No user ID',
        status: 'auth_error',
        error: 'missing_user_id' 
      });
    }
    
    // Validate userId is a valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      console.log(`Auth failed: Invalid user ID format: ${userId}`);
      return res.status(401).json({ 
        message: 'Invalid token: User ID format invalid',
        status: 'auth_error',
        error: 'invalid_user_id_format'
      });
    }
    
    // Check if user exists
    const user = await User.findById(userId);
    if (!user) {
      console.log(`Auth failed: User with id ${userId} not found`);
      return res.status(401).json({ 
        message: 'Invalid token: User not found',
        status: 'auth_error',
        error: 'user_not_found'
      });
    }
    
    // Add user info to request object
    req.user = {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role
    };
    
    console.log(`User ${user.name} successfully authenticated`);
    next();
  } catch (error) {
    console.error('Auth middleware error:', error.name, error.message);
    return res.status(500).json({ 
      message: 'Server error during authentication',
      status: 'server_error',
      error: error.message
    });
  }
};

// Admin middleware
export const isAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({ 
      message: 'Access denied: Admin permission required',
      status: 'auth_error',
      error: 'insufficient_permissions'
    });
  }
}; 