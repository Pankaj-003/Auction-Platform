// routes/userRoutes.js
import express from 'express';
const router = express.Router();

import User from '../models/User.js';
import Bid from "../models/Bid.js"; // ✅ correct if Bid.js is in models/
import Auction from "../models/Auction.js";
import { verifyToken } from "../middleware/auth.js";
import mongoose from "mongoose";

router.get('/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("name email");
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get user profile
router.get("/profile", verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;
    
    const user = await User.findById(userId).select("-password");
    
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    
    // Get additional user stats
    const [bidsCount, wonAuctions, activeAuctions] = await Promise.all([
      Bid.countDocuments({ userId }),
      Auction.countDocuments({ winner: userId }),
      Auction.countDocuments({ 
        createdBy: userId, 
        endTime: { $gt: new Date() } 
      })
    ]);
    
    // Try to get watchlist count if the model exists
    let watchlistCount = 0;
    try {
      const Watchlist = mongoose.model('Watchlist');
      watchlistCount = await Watchlist.countDocuments({ userId });
    } catch (error) {
      // Watchlist model might not exist
      console.log("Watchlist model not available");
    }
    
    res.status(200).json({
      user,
      stats: {
        bidsPlaced: bidsCount,
        auctionsWon: wonAuctions,
        activeAuctions,
        watchlistItems: watchlistCount
      }
    });
  } catch (error) {
    console.error("Error fetching user profile:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Update user profile
router.put("/profile", verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { name, email, phone, address } = req.body;
    
    // Find user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    
    // Update fields
    if (name) user.name = name;
    if (email) user.email = email;
    if (phone) user.phone = phone;
    if (address) user.address = address;
    
    await user.save();
    
    // Return updated user without password
    const updatedUser = await User.findById(userId).select("-password");
    
    res.status(200).json({
      message: "Profile updated successfully",
      user: updatedUser
    });
  } catch (error) {
    console.error("Error updating profile:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Get user's auctions (created by user)
router.get("/auctions", verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;
    
    const auctions = await Auction.find({ createdBy: userId })
      .sort({ createdAt: -1 });
    
    res.status(200).json(auctions);
  } catch (error) {
    console.error("Error fetching user auctions:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Get user's won auctions
router.get("/won-auctions", verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;
    
    const wonAuctions = await Auction.find({ 
      winner: userId,
      endTime: { $lt: new Date() }
    }).sort({ endTime: -1 });
    
    res.status(200).json(wonAuctions);
  } catch (error) {
    console.error("Error fetching won auctions:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Add new route for updating user role
router.patch('/updateRole', verifyToken, async (req, res) => {
  try {
    const { role } = req.body;
    
    if (!role || !['buyer', 'seller'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role specified' });
    }
    
    const userId = req.user.id;
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { role },
      { new: true, runValidators: true }
    ).select('-password');
    
    if (!updatedUser) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.status(200).json({
      success: true,
      message: 'User role updated successfully',
      user: updatedUser
    });
  } catch (error) {
    console.error('Error updating user role:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

export default router;
