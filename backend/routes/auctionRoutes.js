import express from "express";
import Auction from "../models/Auction.js";
import Bid from "../models/Bid.js"; // Assuming you have a Bid model to track bids
import User from "../models/User.js"; // Assuming you have a User model for the winner

const router = express.Router();

// ✅ Create a new auction item
router.post("/add", async (req, res) => {
  try {
    const { title, description, image, startingBid, endDate } = req.body;

    // Check if all fields are provided
    if (!title || !description || !image || !startingBid || !endDate) {
      return res.status(400).json({ error: "All fields are required" });
    }

    // Convert the endDate from the frontend into a Date object
    const endTime = new Date(endDate + "T23:59:59");

    // Validate if the end date is a valid date
    if (isNaN(endTime.getTime())) {
      return res.status(400).json({ error: "Invalid end date" });
    }

    // Check if the provided end date is in the future
    if (endTime <= new Date()) {
      return res.status(400).json({ error: "End date must be in the future" });
    }

    // Create the new auction
    const newAuction = new Auction({
      title,
      description,
      image,
      startingBid,
      endTime,
      isEnded: false,
      winner: null,
    });

    // Save the new auction to the database
    await newAuction.save();

    // Respond with success
    return res.status(201).json({ message: "Auction added successfully", auction: newAuction });
  } catch (error) {
    console.error("❌ Error adding auction:", error);
    return res.status(500).json({ error: "Server error while adding auction" });
  }
});

// ✅ Get all auction items (with current highest bid)
router.get("/", async (req, res) => {
  try {
    // Fetch all auctions sorted by the soonest ending
    const auctions = await Auction.find().sort({ endTime: 1 });

    // Fetch the highest bid for each auction
    const auctionsWithBids = await Promise.all(
      auctions.map(async (auction) => {
        // Find the highest bid for this auction
        const highestBid = await Bid.findOne({ auctionId: auction._id }).sort({ amount: -1 });

        // If there is no bid, use the starting bid as the highest bid
        return {
          ...auction._doc,
          highestBid: highestBid ? highestBid.amount : auction.startingBid,
        };
      })
    );

    return res.json(auctionsWithBids);
  } catch (error) {
    console.error("❌ Error fetching auctions:", error);
    return res.status(500).json({ error: "Server error while fetching auctions" });
  }
});

// ✅ Get ended auctions with winners
router.get("/winners", async (req, res) => {
  try {
    // Find ended auctions that have a winner
    const endedAuctions = await Auction.find({ isEnded: true, winner: { $ne: null } })
      .populate("winner", "name email") // Assuming a 'User' model exists
      .sort({ endTime: -1 });

    return res.json(endedAuctions);
  } catch (error) {
    console.error("❌ Error fetching winners:", error);
    return res.status(500).json({ error: "Server error while fetching winners" });
  }
});

// ✅ Declare winner for an auction after it ends (New Endpoint)
router.post("/declareWinner/:auctionId", async (req, res) => {
  const { auctionId } = req.params;

  try {
    // Find the auction by ID
    const auction = await Auction.findById(auctionId);
    if (!auction) {
      return res.status(404).json({ error: "Auction not found" });
    }

    // Check if the auction has already ended
    if (auction.isEnded) {
      return res.status(400).json({ error: "Auction already ended" });
    }

    // Find the highest bid for this auction
    const highestBid = await Bid.findOne({ auctionId: auction._id }).sort({ amount: -1 });

    if (!highestBid) {
      return res.status(400).json({ error: "No bids placed for this auction" });
    }

    // Find the user who placed the highest bid
    const winner = await User.findById(highestBid.userId);

    if (!winner) {
      return res.status(404).json({ error: "Winner user not found" });
    }

    // Set the auction as ended and assign the winner
    auction.isEnded = true;
    auction.winner = winner._id;

    // Save the updated auction
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
// Fetch auction details along with the winner
router.get('/:id', async (req, res) => {
  try {
    const auction = await Auction.findById(req.params.id).populate('winner');
    if (!auction) {
      return res.status(404).send('Auction not found');
    }
    res.json(auction);  // Send the auction data with the winner
  } catch (error) {
    console.error(error);
    res.status(500).send('Server error');
  }
});
export default router;
