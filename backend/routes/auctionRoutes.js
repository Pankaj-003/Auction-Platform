import express from "express";
import Auction from "../models/Auction.js";
import Bid from "../models/Bid.js";
import User from "../models/User.js";
import mongoose from "mongoose";

const router = express.Router();

// ✅ Create a new auction item
router.post("/add", async (req, res) => {
  try {
    const { title, description, image, startingBid, endDate, seller, category } = req.body;

    if (!title || !description || !image || !startingBid || !endDate) {
      return res.status(400).json({ error: "All fields are required" });
    }

    const endTime = new Date(endDate + "T23:59:59");

    if (isNaN(endTime.getTime())) {
      return res.status(400).json({ error: "Invalid end date" });
    }

    if (endTime <= new Date()) {
      return res.status(400).json({ error: "End date must be in the future" });
    }

    const newAuction = new Auction({
      title,
      description,
      image,
      startingBid,
      endTime,
      isEnded: false,
      winner: null,
      seller: seller || null,
      category: category || "Uncategorized"
    });

    await newAuction.save();

    return res.status(201).json({ message: "Auction added successfully", auction: newAuction });
  } catch (error) {
    console.error("❌ Error adding auction:", error);
    return res.status(500).json({ error: "Server error while adding auction" });
  }
});

// ✅ Get all auction items (with current highest bid and winner)
router.get("/", async (req, res) => {
  try {
    const auctions = await Auction.find()
      .sort({ endTime: 1 })
      .populate("winner", "name")
      .populate("seller", "name");

    const auctionsWithBids = await Promise.all(
      auctions.map(async (auction) => {
        const highestBid = await Bid.findOne({ auctionId: auction._id })
          .sort({ amount: -1 })
          .populate("userId", "name");

        return {
          ...auction._doc,
          highestBid: highestBid ? highestBid.amount : auction.startingBid,
          highestBidder: highestBid ? highestBid.userId : null,
        };
      })
    );

    return res.json(auctionsWithBids);
  } catch (error) {
    console.error("❌ Error fetching auctions:", error);
    return res.status(500).json({ error: "Server error while fetching auctions" });
  }
});

// ✅ Get auction details by ID (with bids and related data)
router.get('/:auctionId', async (req, res) => {
  try {
    const { auctionId } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(auctionId)) {
      return res.status(400).json({ message: "Invalid auction ID format" });
    }
    
    // Find the auction with populated references
    const auction = await Auction.findById(auctionId)
      .populate('winner', 'name email')
      .populate('seller', 'name email')
      .populate('highestBidder', 'name email');
    
    if (!auction) {
      return res.status(404).json({ message: "Auction not found" });
    }
    
    // Get highest bid if not already present
    if (!auction.highestBid) {
      const highestBid = await Bid.findOne({ auctionId })
        .sort({ amount: -1 });
      
      if (highestBid) {
        auction.highestBid = highestBid.amount;
        auction.highestBidder = highestBid.userId;
      }
    }
    
    // Get total number of bids
    const bidCount = await Bid.countDocuments({ auctionId });
    
    // Calculate time remaining
    const now = new Date();
    const endTime = new Date(auction.endTime);
    const timeRemaining = endTime > now ? endTime - now : 0;
    
    // Return comprehensive auction data
    return res.status(200).json({
      ...auction._doc,
      bidCount,
      isActive: timeRemaining > 0,
      timeRemaining
    });
  } catch (error) {
    console.error("Error fetching auction:", error);
    return res.status(500).json({ 
      message: "Server error while fetching auction",
      error: error.message 
    });
  }
});

// ✅ Declare winner for an auction after it ends
router.post("/declareWinner/:auctionId", async (req, res) => {
  const { auctionId } = req.params;

  try {
    const auction = await Auction.findById(auctionId);
    if (!auction) {
      return res.status(404).json({ error: "Auction not found" });
    }

    if (auction.isEnded) {
      return res.status(400).json({ error: "Auction already ended" });
    }

    if (new Date() < auction.endTime) {
      return res.status(400).json({ error: "Auction is still ongoing" });
    }

    const highestBid = await Bid.findOne({ auctionId: auction._id }).sort({ amount: -1 });

    if (!highestBid) {
      return res.status(400).json({ error: "No bids placed for this auction" });
    }

    const winner = await User.findById(highestBid.userId);

    if (!winner) {
      return res.status(404).json({ error: "Winner user not found" });
    }

    auction.isEnded = true;
    auction.winner = winner._id;
    await auction.save();

    return res.status(200).json({
      message: "Winner declared successfully",
      winner: {
        name: winner.name,
        email: winner.email,
      },
      auction: auction,
    });
  } catch (error) {
    console.error("❌ Error declaring winner:", error);
    return res.status(500).json({ error: "Server error while declaring winner" });
  }
});

export default router;
