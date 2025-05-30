import express from "express";
import Watchlist from "../models/watchlist.model.js";
import User from "../models/User.js";
import Auction from "../models/Auction.js";
import Activity from "../models/activity.model.js";
import { verifyToken } from "../middleware/auth.js";
import mongoose from "mongoose";

const router = express.Router();

// Get all watchlist items for a user
router.get("/:userId", verifyToken, async (req, res) => {
  try {
    const userId = req.params.userId;
    
    // Validate userId is a valid ObjectId
    if (!userId || userId === 'undefined' || !mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }
    
    // Verify user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    
    // Get watchlist items with populated auction details
    const watchlistItems = await Watchlist.find({ userId })
      .populate("auction")
      .sort({ createdAt: -1 });
    
    res.status(200).json(watchlistItems);
  } catch (error) {
    console.error("Error retrieving watchlist:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Add item to watchlist
router.post("/:userId", verifyToken, async (req, res) => {
  try {
    const userId = req.params.userId;
    const { auctionId } = req.body;
    
    // Validate both userId and auctionId
    if (!userId || userId === 'undefined' || !mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }
    
    if (!auctionId || auctionId === 'undefined' || !mongoose.Types.ObjectId.isValid(auctionId)) {
      return res.status(400).json({ message: "Invalid auction ID" });
    }
    
    // Verify user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    
    // Verify auction exists
    const auction = await Auction.findById(auctionId);
    if (!auction) {
      return res.status(404).json({ message: "Auction not found" });
    }
    
    // Check if already in watchlist
    const existingItem = await Watchlist.findOne({ userId, auction: auctionId });
    if (existingItem) {
      return res.status(400).json({ message: "Item already in watchlist" });
    }
    
    // Create new watchlist entry
    const watchlistItem = new Watchlist({
      userId,
      auction: auctionId
    });
    
    await watchlistItem.save();
    
    // Add to user activity
    await addUserActivity(userId, "watchlist", `You added "${auction.title}" to your watchlist`);
    
    res.status(201).json({ message: "Added to watchlist", watchlistItem });
  } catch (error) {
    console.error("Error adding to watchlist:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Remove item from watchlist
router.delete("/:userId/:auctionId", verifyToken, async (req, res) => {
  try {
    const { userId, auctionId } = req.params;
    
    // Validate both userId and auctionId
    if (!userId || userId === 'undefined' || !mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }
    
    if (!auctionId || auctionId === 'undefined' || !mongoose.Types.ObjectId.isValid(auctionId)) {
      return res.status(400).json({ message: "Invalid auction ID" });
    }
    
    // Verify user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    
    // Find and remove watchlist item
    const removed = await Watchlist.findOneAndDelete({ userId, auction: auctionId });
    
    if (!removed) {
      return res.status(404).json({ message: "Item not found in watchlist" });
    }
    
    res.status(200).json({ message: "Removed from watchlist" });
  } catch (error) {
    console.error("Error removing from watchlist:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Helper function to add activity
async function addUserActivity(userId, type, message) {
  try {
    // Validate userId before creating activity
    if (!userId || userId === 'undefined' || !mongoose.Types.ObjectId.isValid(userId)) {
      console.error("Invalid userId for activity:", userId);
      return;
    }
    
    const activity = new Activity({
      userId,
      type,
      message
    });
    await activity.save();
  } catch (error) {
    console.error("Error adding activity:", error);
  }
}

export default router; 