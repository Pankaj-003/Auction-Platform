import mongoose from 'mongoose';

// Auction Schema
const auctionSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  image: { type: String, required: true },
  startingBid: { type: Number, required: true },
  endTime: { type: Date, required: true },
  highestBid: { type: Number, default: 0 },  // Current highest bid
  highestBidder: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User',  // Reference to the User model
    default: null 
  },
  winner: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User',  // Reference to the User model for the winner
    default: null 
  },
  seller: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',  // Reference to the User who created this auction
    required: true
  },
  category: { type: String, default: 'Uncategorized' },
  createdAt: { type: Date, default: Date.now },
});

const Auction = mongoose.model("Auction", auctionSchema);

// Function to declare winners for ended auctions
const declareWinners = async () => {
  const now = new Date();
  
  // Find auctions that have ended and do not yet have a winner
  try {
    const auctions = await Auction.find({ endTime: { $lt: now }, winner: null });

    for (const auction of auctions) {
      if (auction.highestBidder) {
        try {
          // Use findByIdAndUpdate instead of save() to bypass validation issues with missing seller
          await Auction.findByIdAndUpdate(auction._id, { winner: auction.highestBidder });
          console.log(`Winner declared for auction: ${auction.title || auction._id}`);
        } catch (saveError) {
          console.error(`Error saving auction ${auction._id}:`, saveError);
        }
      }
    }
  } catch (error) {
    console.error('Error declaring winner:', error);
  }
};

// NOTE: We don't start the interval here anymore to prevent multiple timers
// This should be called from server.js instead

// Export the Auction model and declareWinners function
export default Auction;
export { declareWinners };
