import express from "express";
import User from "../models/User.js";
import Auction from "../models/Auction.js";
import Bid from "../models/Bid.js";
import Watchlist from "../models/watchlist.model.js";
import Activity from "../models/activity.model.js";
import { verifyToken } from "../middleware/auth.js";

const router = express.Router();

// Get dashboard stats
router.get("/stats/:userId", verifyToken, async (req, res) => {
  try {
    const userId = req.params.userId;
    
    // Verify user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    
    // Get all stats in parallel
    const [bids, auctions, watchlistItems] = await Promise.all([
      Bid.find({ userId }),
      Auction.find({}),
      Watchlist.find({ userId })
    ]);
    
    // Calculate stats
    const bidsPlaced = bids.length;
    
    // Count active auctions (not ended)
    const now = new Date();
    const activeAuctions = auctions.filter(auction => 
      new Date(auction.endTime) > now && auction.userId && auction.userId.toString() === userId
    ).length;
    
    // Count auctions won
    const auctionsWon = auctions.filter(auction => 
      new Date(auction.endTime) < now && 
      auction.highestBidderId && 
      auction.highestBidderId.toString() === userId
    ).length;
    
    // Count watchlist items
    const watchlistCount = watchlistItems.length;
    
    res.status(200).json({
      bidsPlaced,
      activeAuctions,
      auctionsWon,
      watchlistItems: watchlistCount
    });
  } catch (error) {
    console.error("Error retrieving dashboard stats:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Get user activities
router.get("/activities/:userId", verifyToken, async (req, res) => {
  try {
    const userId = req.params.userId;
    
    // Verify user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    
    // Get recent activities
    const activities = await Activity.find({ userId })
      .sort({ createdAt: -1 })
      .limit(20)
      .populate("relatedAuction", "title image");
    
    res.status(200).json(activities);
  } catch (error) {
    console.error("Error retrieving activities:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Add a new activity
router.post("/activities/:userId", verifyToken, async (req, res) => {
  try {
    const userId = req.params.userId;
    const { type, message, relatedAuction } = req.body;
    
    if (!type || !message) {
      return res.status(400).json({ message: "Type and message are required" });
    }
    
    // Verify user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    
    // Create activity
    const activity = new Activity({
      userId,
      type,
      message,
      relatedAuction
    });
    
    await activity.save();
    
    res.status(201).json({ message: "Activity added", activity });
  } catch (error) {
    console.error("Error adding activity:", error);
    res.status(500).json({ message: "Server error" });
  }
});

export default router; 