import Auction from '../models/Auction.js';
import Bid from '../models/Bid.js';
import User from '../models/User.js'; // Import the User model to populate highestBidder

// Create Auction (POST)
export const createAuction = async (req, res) => {
  try {
    const { title, description, image, startingBid, endTime } = req.body;

    // Validate incoming data
    if (!title || !description || !image || !startingBid || !endTime) {
      return res.status(400).json({ error: "All fields are required!" });
    }

    // Create the auction with default values for highestBid and highestBidder
    const newAuction = new Auction({
      title,
      description,
      image,
      startingBid,
      endTime,
      highestBid: 0,  // Default value for highest bid
      highestBidder: null,  // Default value for the highest bidder
    });

    // Save the auction to the database
    const savedAuction = await newAuction.save();

    res.status(201).json({ auction: savedAuction });
  } catch (error) {
    console.error("Error creating auction:", error);
    res.status(500).json({ error: "Failed to create auction" });
  }
};

// Get all auctions (GET)
export const getAuctions = async (req, res) => {
  try {
    const auctions = await Auction.find()
      .populate('highestBidder', 'name'); // Populate highestBidder with the user's name
    
    res.status(200).json(auctions);
  } catch (error) {
    console.error("Error fetching auctions:", error);
    res.status(500).json({ error: "Failed to fetch auctions" });
  }
};

// Get auction by ID (GET)
export const getAuctionById = async (req, res) => {
  const { id } = req.params;

  try {
    const auction = await Auction.findById(id)
      .populate('highestBidder', 'name'); // Populate highestBidder with the user's name

    if (!auction) {
      return res.status(404).json({ error: "Auction not found" });
    }

    res.status(200).json(auction);
  } catch (error) {
    console.error("Error fetching auction:", error);
    res.status(500).json({ error: "Failed to fetch auction" });
  }
};

// Update auction (PUT)
export const updateAuction = async (req, res) => {
  const { id } = req.params;
  const { title, description, image, startingBid, endTime } = req.body;

  try {
    const updatedAuction = await Auction.findByIdAndUpdate(
      id,
      {
        title,
        description,
        image,
        startingBid,
        endTime,
      },
      { new: true }
    );

    if (!updatedAuction) {
      return res.status(404).json({ error: "Auction not found" });
    }

    res.status(200).json({ auction: updatedAuction });
  } catch (error) {
    console.error("Error updating auction:", error);
    res.status(500).json({ error: "Failed to update auction" });
  }
};

// Delete auction (DELETE)
export const deleteAuction = async (req, res) => {
  const { id } = req.params;

  try {
    const deletedAuction = await Auction.findByIdAndDelete(id);

    if (!deletedAuction) {
      return res.status(404).json({ error: "Auction not found" });
    }

    res.status(200).json({ message: "Auction deleted successfully" });
  } catch (error) {
    console.error("Error deleting auction:", error);
    res.status(500).json({ error: "Failed to delete auction" });
  }
};

// Place a bid (POST)
export const placeBid = async (req, res) => {
  const { auctionId, amount } = req.body;
  const { userId } = req.params;

  try {
    // Find auction by ID
    const auction = await Auction.findById(auctionId);

    if (!auction) {
      return res.status(404).json({ error: "Auction not found" });
    }

    // Check if the bid is higher than the current highest bid
    if (amount <= auction.highestBid) {
      return res.status(400).json({ error: "Bid must be higher than the current highest bid" });
    }

    // Find the user placing the bid
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Create the bid and save it
    const newBid = new Bid({
      auctionId,
      userId,
      amount,
    });

    const savedBid = await newBid.save();

    // Update auction with the new highest bid and highest bidder
    auction.highestBid = amount;
    auction.highestBidder = user._id;

    await auction.save();

    // Send response
    res.status(200).json({ message: "Bid placed successfully", bid: savedBid });
  } catch (error) {
    console.error("Error placing bid:", error);
    res.status(500).json({ error: "Failed to place bid" });
  }
};
