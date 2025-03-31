import express from "express";
import Bid from "../models/Bid.js";
import AuctionItem from "../models/AuctionItem.js";

const router = express.Router();

// POST: Place a bid
router.post("/:auctionItemId", async (req, res) => {
  const { auctionItemId } = req.params;
  const { userId, amount } = req.body;

  // Check if auction item exists
  const auctionItem = await AuctionItem.findById(auctionItemId);
  if (!auctionItem) {
    return res.status(404).json({ message: "Auction item not found" });
  }

  // Check if bid is higher than current bid
  const currentHighestBid = await Bid.findOne({ auctionItemId }).sort({ amount: -1 });
  if (amount <= (currentHighestBid ? currentHighestBid.amount : auctionItem.startingBid)) {
    return res.status(400).json({ message: "Your bid must be higher than the current highest bid." });
  }

  // Create a new bid
  const newBid = new Bid({
    userId,
    auctionItemId,
    amount,
  });

  await newBid.save();

  res.status(201).json({ message: "Bid placed successfully", bid: newBid });
});

export default router;
