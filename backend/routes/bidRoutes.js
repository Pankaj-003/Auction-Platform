import express from "express";
import mongoose from "mongoose";
import Bid from "../models/Bid.js";
import Auction from "../models/Auction.js";
import User from "../models/User.js";

const router = express.Router();

// POST a new bid
router.post("/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const { auctionId, amount } = req.body;

    // Validate input
    if (!amount || isNaN(amount) || amount <= 0) {
      return res.status(400).json({ message: "Bid amount must be a positive number" });
    }

    if (!mongoose.Types.ObjectId.isValid(userId) || !mongoose.Types.ObjectId.isValid(auctionId)) {
      return res.status(400).json({ message: "Invalid userId or auctionId" });
    }

    // Find user and auction
    const user = await User.findById(userId);
    const auction = await Auction.findById(auctionId);

    if (!user || !auction) {
      return res.status(404).json({ message: "User or Auction not found" });
    }

    // Check if auction has ended
    if (new Date(auction.endTime) <= new Date()) {
      return res.status(400).json({ message: "❌ Auction has already ended" });
    }

    // Prevent duplicate bid
    const existingBid = await Bid.findOne({ userId, auctionId });
    if (existingBid) {
      return res.status(400).json({ message: "❌ You have already placed a bid on this auction" });
    }

    // Get current highest bid
    const highestBid = await Bid.findOne({ auctionId }).sort({ amount: -1 });
    const highestAmount = highestBid ? highestBid.amount : 0;

    if (amount <= highestAmount) {
      return res.status(400).json({
        message: `❌ Your bid must be higher than the current highest bid of ₹${highestAmount}`,
      });
    }

    // Ensure bid is higher than starting bid
    if (amount <= auction.startingBid) {
      return res.status(400).json({
        message: `❌ Your bid must be higher than the starting bid of ₹${auction.startingBid}`,
      });
    }

    // Save the new bid
    const newBid = new Bid({ userId, auctionId, amount });
    await newBid.save();

    // Update auction's highest bid and bidder
    auction.highestBid = amount;
    auction.highestBidder = userId;
    await auction.save();

    return res.status(201).json({ message: "✅ Bid placed successfully", bid: newBid });
  } catch (err) {
    return res.status(500).json({
      message: "❌ Server error while placing bid",
      error: err.message,
    });
  }
});

// GET bids by userId
router.get("/:userId", async (req, res) => {
  try {
    const { userId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "Invalid user ID format" });
    }

    // Fetch bids placed by the user and populate auction details
    const bids = await Bid.find({ userId })
      .populate("auctionId", "title description startingBid endTime highestBid highestBidder isEnded") // Populate auction details
      .populate("userId", "name email"); // Populate user details

    if (!bids.length) {
      return res.status(404).json({ message: "No bids found for this user" });
    }

    return res.status(200).json(bids);
  } catch (err) {
    return res.status(500).json({
      message: "❌ Server error while fetching bids",
      error: err.message,
    });
  }
});

export default router;
