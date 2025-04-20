import express from "express";
import mongoose from "mongoose";
import Bid from "../models/Bid.js";
import Auction from "../models/Auction.js";
import User from "../models/User.js";
import { verifyToken } from "../middleware/auth.js";
import { placeBid, findExistingBid } from "../utils/bidUtils.js";

const router = express.Router();

// POST a new bid (authenticated route)
router.post("/:auctionId", verifyToken, async (req, res) => {
  try {
    const { auctionId } = req.params;
    const { amount } = req.body;
    // Use the authenticated user ID from the token
    const userId = req.user.id;
    
    console.log("Bid request:", { auctionId, userId, amount });
    
    // Validate basic input
    if (!amount || isNaN(parseFloat(amount))) {
      return res.status(400).json({ message: "Bid amount must be a valid number" });
    }

    if (!mongoose.Types.ObjectId.isValid(auctionId)) {
      return res.status(400).json({ message: "Invalid auction ID format" });
    }

    // Use the utility function to place or update the bid
    try {
      const result = await placeBid(userId, auctionId, amount);
      
      // Return the appropriate response based on the result
      return res.status(result.status).json({
        message: `✅ ${result.message}`,
        bid: result.bid
      });
    } catch (bidError) {
      // Handle specific error messages from the bid utility
      console.error("Bid placement error:", bidError.message);
      
      // Check for specific error messages to determine the appropriate status code
      if (bidError.message.includes("must be higher")) {
        return res.status(400).json({ message: `❌ ${bidError.message}` });
      } else if (bidError.message.includes("ended")) {
        return res.status(400).json({ message: `❌ ${bidError.message}` });
      } else if (bidError.message.includes("not found")) {
        return res.status(404).json({ message: `❌ ${bidError.message}` });
      } else if (bidError.message.includes("Server error while placing bid")) {
        // Extract the actual error message from the thrown error
        const errorMessage = bidError.message.replace("Server error while placing bid: ", "");
        return res.status(500).json({ 
          message: "❌ Error processing bid",
          error: errorMessage 
        });
      } else {
        return res.status(500).json({ 
          message: "❌ Error processing bid",
          error: bidError.message 
        });
      }
    }
  } catch (err) {
    console.error("Bid route error:", err);
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
