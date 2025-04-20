import express from 'express';
import bcrypt from 'bcryptjs';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import User from '../models/User.js';
import { upload } from '../middleware/upload.js'; // Import the upload middleware
import { generateToken, ensureJwtSecret } from '../utils/tokenUtils.js';
import jwt from 'jsonwebtoken';
import { authMiddleware } from '../middleware/authMiddleware.js';

dotenv.config();
const router = express.Router();

// Ensure JWT Secret is available
ensureJwtSecret();

// Nodemailer Config for sending emails
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  tls: {
    rejectUnauthorized: false,
  },
});

// Signup Route (with file upload)
router.post('/signup', upload.single('profilePic'), (req, res, next) => {
  // Handle multer errors
  if (req.fileValidationError) {
    return res.status(400).json({ error: req.fileValidationError });
  }
  
  // Continue with normal signup logic
  const signupHandler = async () => {
    try {
      const { name, email, password, role = 'unset' } = req.body;

      // Check for required fields
      if (!name || !email || !password) {
        return res.status(400).json({ error: 'Name, email, and password are required' });
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({ error: 'Please provide a valid email address' });
      }

      // Validate password strength
      if (password.length < 8) {
        return res.status(400).json({ error: 'Password must be at least 8 characters long' });
      }

      // Check if the email is already registered
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(409).json({ error: 'User already exists with this email' });
      }

      // Use only valid roles
      const validRole = ['buyer', 'seller', 'unset'].includes(role) ? role : 'unset';

      // Hash the password before saving it to the database
      const hashedPassword = await bcrypt.hash(password, 10);

      // Create the new user
      const newUser = new User({
        name,
        email,
        password: hashedPassword,
        role: validRole,
        // Set profile picture only if file was uploaded
        profilePic: req.file ? `uploads/${req.file.filename}` : undefined
      });

      // Save the new user to the database
      await newUser.save();

      // Create JWT token using the utility function
      const token = generateToken({
        _id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role
      });

      // Send success response with user data and token
      res.status(201).json({
        success: true,
        message: 'User registered successfully',
        user: {
          _id: newUser._id,
          name: newUser.name,
          email: newUser.email,
          role: newUser.role,
          profilePic: newUser.profilePic,
        },
        token: token
      });
    } catch (error) {
      console.error('Signup Error:', error);
      
      // Better error handling for MongoDB duplicate key error
      if (error.code === 11000) {
        return res.status(409).json({ error: 'User already exists with this email' });
      }
      
      res.status(500).json({ error: 'Server error during signup. Please try again.' });
    }
  };
  
  signupHandler().catch(err => next(err));
});

// Login Route
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Ensure email and password are provided
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Find the user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Compare passwords
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Create JWT token using the utility function
    const token = generateToken({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role
    });

    // Send success response with user info and token
    res.status(200).json({
      success: true,
      message: 'Login successful',
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        profilePic: user.profilePic,
      },
      token: token
    });
  } catch (error) {
    console.error('Login Error:', error);
    res.status(500).json({ error: 'Server error during login' });
  }
});

// Forgot Password Route
router.post('/forgot-password', async (req, res) => {
  const { email } = req.body;

  try {
    if (!email) return res.status(400).json({ error: 'Email is required' });

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ error: 'User not found' });

    const resetLink = `${process.env.FRONTEND_URL}/reset-password?email=${encodeURIComponent(email)}`;

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Password Reset Request',
      html: `
        <p>Hello ${user.name},</p>
        <p>Click below to reset your password:</p>
        <a href="${resetLink}" style="padding: 10px 20px; background-color: #007bff; color: white; text-decoration: none; border-radius: 5px;">
          Reset Password
        </a>
        <p>If you did not request this, you can ignore this email.</p>
      `,
    };

    await transporter.sendMail(mailOptions);

    res.status(200).json({ message: 'Password reset link sent to your email.' });
  } catch (error) {
    console.error('Forgot Password Error:', error);
    res.status(500).json({ error: 'Failed to send reset email.' });
  }
});

// Reset Password Route
router.post('/reset-password', async (req, res) => {
  const { email, newPassword } = req.body;

  try {
    if (!email || !newPassword) {
      return res.status(400).json({ error: 'Email and new password are required' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    res.status(200).json({ message: 'Password reset successful' });
  } catch (error) {
    console.error('Reset Password Error:', error);
    res.status(500).json({ error: 'Failed to reset password' });
  }
});

// Get User Info by ID (to show profile pic in navbar)
router.get('/user/:userId', async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    res.status(200).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      profilePic: user.profilePic,
      createdAt: user.createdAt
    });
  } catch (err) {
    console.error('Fetch User Error:', err);
    res.status(500).json({ message: 'Error fetching user' });
  }
});

// Update User Profile
router.put('/update-profile/:userId', upload.single('profilePic'), async (req, res) => {
  try {
    const userId = req.params.userId;
    const { name } = req.body;
    
    // Validate required fields
    if (!name) {
      return res.status(400).json({ error: 'Name is required' });
    }
    
    // Find the user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // If email is provided in request, check if it matches the existing email
    if (req.body.email && req.body.email !== user.email) {
      return res.status(400).json({ 
        error: 'Email cannot be changed as it serves as a unique identifier',
        message: 'Email address cannot be modified after registration'
      });
    }
    
    // Update basic info - only name can be updated
    user.name = name;
    // Email remains unchanged
    
    // Update profile pic if provided
    if (req.file) {
      user.profilePic = `uploads/${req.file.filename}`;
    }
    
    // Save updated user
    await user.save();
    
    // Return updated user data
    res.status(200).json({
      message: 'Profile updated successfully',
      name: user.name,
      email: user.email, // Return the unchanged email
      role: user.role,
      profilePic: user.profilePic
    });
  } catch (err) {
    console.error('Update Profile Error:', err);
    res.status(500).json({ error: 'Server error during profile update' });
  }
});

// Validate Token Route (protected route that verifies token and returns user data)
router.get('/validate-token', async (req, res) => {
  try {
    // Get the token from the Authorization header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        message: 'Access denied. No token provided.', 
        status: 'auth_error',
        error: 'missing_token'
      });
    }
    
    const token = authHeader.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ 
        message: 'Access denied. No token provided.',
        status: 'auth_error',
        error: 'empty_token'
      });
    }
    
    // Verify the token
    const jwtSecret = ensureJwtSecret();
    const decoded = jwt.verify(token, jwtSecret);
    
    // Get user ID from token (handling both formats)
    const userId = decoded.id || decoded._id;
    
    if (!userId) {
      return res.status(401).json({ 
        message: 'Invalid token: No user ID',
        status: 'auth_error',
        error: 'missing_user_id'
      });
    }
    
    // Find the user to verify they exist
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(401).json({ 
        message: 'Invalid token: User not found',
        status: 'auth_error',
        error: 'user_not_found'
      });
    }
    
    // Return success with user details
    return res.status(200).json({
      message: 'Token is valid',
      status: 'success',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        profilePic: user.profilePic
      }
    });
  } catch (error) {
    // Handle specific JWT errors
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        message: 'Invalid token format or signature',
        status: 'auth_error',
        error: 'invalid_token'
      });
    } else if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        message: 'Token expired',
        status: 'auth_error',
        error: 'expired_token'
      });
    }
    
    console.error('Token validation error:', error);
    return res.status(500).json({ 
      message: 'Server error while validating token',
      status: 'server_error',
      error: error.message
    });
  }
});

// Update User Role
router.patch('/set-role/:userId', authMiddleware, async (req, res) => {
  try {
    const userId = req.params.userId;
    const { role } = req.body;
    
    // Validate input
    if (!role || !['buyer', 'seller'].includes(role)) {
      return res.status(400).json({ error: 'Valid role (buyer or seller) is required' });
    }
    
    // Find the user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Update role
    user.role = role;
    user.roleSelected = true;
    
    // Save updated user
    await user.save();
    
    res.status(200).json({
      success: true,
      message: 'Role updated successfully',
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        profilePic: user.profilePic,
        roleSelected: user.roleSelected
      }
    });
  } catch (error) {
    console.error('Role Update Error:', error);
    res.status(500).json({ error: 'Server error during role update' });
  }
});

// Add check email route
router.post('/check-email', async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }
    
    const user = await User.findOne({ email });
    
    return res.status(200).json({
      exists: !!user
    });
  } catch (error) {
    console.error('Check email error:', error);
    return res.status(500).json({ error: 'Server error checking email' });
  }
});

export default router;
