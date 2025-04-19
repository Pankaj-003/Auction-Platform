import express from "express";
import mongoose from "mongoose";
import Bid from "../models/Bid.js";
import Auction from "../models/Auction.js";
import User from "../models/User.js";
import { verifyToken } from "../middleware/auth.js";

const router = express.Router();

// POST a new bid (authenticated route)
router.post("/:auctionId", verifyToken, async (req, res) => {
  try {
    const { auctionId } = req.params;
    const { userId, amount } = req.body;
    
    console.log("Bid request:", { auctionId, userId, amount });
    
    // Validate input
    if (!amount || isNaN(amount) || amount <= 0) {
      return res.status(400).json({ message: "Bid amount must be a positive number" });
    }

    if (!mongoose.Types.ObjectId.isValid(userId) || !mongoose.Types.ObjectId.isValid(auctionId)) {
      return res.status(400).json({ message: "Invalid userId or auctionId" });
    }

    // Verify the requesting user matches the userId in the request body
    if (req.user.id.toString() !== userId) {
      return res.status(403).json({ message: "Unauthorized: You can only place bids as yourself" });
    }

    // Find user and auction
    const user = await User.findById(userId);
    const auction = await Auction.findById(auctionId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    
    if (!auction) {
      return res.status(404).json({ message: "Auction not found" });
    }

    // Check if auction has ended
    if (new Date(auction.endTime) <= new Date()) {
      return res.status(400).json({ message: "❌ Auction has already ended" });
    }

    // Get current highest bid
    const highestBid = await Bid.findOne({ auctionId }).sort({ amount: -1 });
    const highestAmount = highestBid ? highestBid.amount : auction.startingBid;

    if (parseFloat(amount) <= highestAmount) {
      return res.status(400).json({
        message: `❌ Your bid must be higher than the current highest bid of ₹${highestAmount}`,
      });
    }

    // Check if user already placed a bid on this auction
    const existingBid = await Bid.findOne({ userId, auctionId });
    
    if (existingBid) {
      // Update the existing bid instead of creating a new one
      existingBid.amount = amount;
      await existingBid.save();
      
      // Update auction's highest bid and bidder
      auction.highestBid = amount;
      auction.highestBidder = userId;
      await auction.save();
      
      return res.status(200).json({ 
        message: "✅ Bid updated successfully", 
        bid: existingBid 
      });
    } else {
      // Save the new bid
      const newBid = new Bid({ userId, auctionId, amount });
      await newBid.save();

      // Update auction's highest bid and bidder
      auction.highestBid = amount;
      auction.highestBidder = userId;
      await auction.save();

      return res.status(201).json({ 
        message: "✅ Bid placed successfully", 
        bid: newBid 
      });
    }
  } catch (err) {
    console.error("Bid Error:", err);
    return res.status(500).json({
      message: "❌ Server error while placing bid",
      error: err.message,
    });
  }
});

// GET bids by auction ID (public route)
router.get("/auction/:auctionId", async (req, res) => {
  try {
    const { auctionId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(auctionId)) {
      return res.status(400).json({ message: "Invalid auction ID format" });
    }

    const bids = await Bid.find({ auctionId })
      .populate("userId", "name email")
      .sort({ amount: -1 });

    return res.status(200).json(bids);
  } catch (err) {
    return res.status(500).json({
      message: "Server error while fetching bids",
      error: err.message,
    });
  }
});

// GET bids by userId (authenticated route)
router.get("/user", verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;

    // Fetch bids placed by the user and populate auction details
    const bids = await Bid.find({ userId })
      .populate("auctionId", "title description startingBid endTime highestBid highestBidder image")
      .sort({ createdAt: -1 });

    return res.status(200).json(bids);
  } catch (err) {
    return res.status(500).json({
      message: "Server error while fetching user bids",
      error: err.message,
    });
  }
});

export default router;
