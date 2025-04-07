// controllers/bidController.js
import Bid from '../models/Bid.js';
import Auction from '../models/Auction.js';
import User from '../models/User.js'; // Make sure this is imported

export const placeBid = async (req, res) => {
  try {
    const { userId, amount } = req.body;
    const { auctionId } = req.params;

    if (!userId || !amount || !auctionId) {
      return res.status(400).json({ message: "auctionId, userId, and amount are required" });
    }

    // ✅ Check if user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(401).json({ message: "Unauthorized: User does not exist" });
    }

    // ✅ Ensure bid amount is greater than starting bid
    const auction = await Auction.findById(auctionId);
    if (!auction) {
      return res.status(404).json({ message: "Auction not found" });
    }

    if (Number(amount) <= auction.startingBid) {
      return res.status(400).json({ message: "Bid amount must be greater than starting bid" });
    }

    // ✅ Check if user already placed a bid
    const existingBid = await Bid.findOne({ auctionId, userId });
    if (existingBid) {
      return res.status(400).json({ message: "You have already placed a bid on this item" });
    }

    const newBid = new Bid({ userId, auctionId, amount });
    await newBid.save();

    res.status(201).json({ message: "Bid placed successfully", bid: newBid });
  } catch (error) {
    console.error("Bid Error:", error);
    res.status(500).json({ message: "Server error" });
  }
};
