import mongoose from 'mongoose';

const auctionSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  image: { type: String, required: true },
  startingBid: { type: Number, required: true },
  endTime: { type: Date, required: true },
  highestBid: { type: Number, default: 0 }, // To store the current highest bid
  highestBidder: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', // Reference to the User model to store the highest bidder
    default: null 
  },
  winner: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', // Reference to the User model to store the auction winner (after auction ends)
    default: null 
  },
});

const Auction = mongoose.model("Auction", auctionSchema);

// Function to declare winners for ended auctions
const declareWinners = async () => {
  const now = new Date();
  
  // Find auctions that have ended and do not yet have a winner
  const auctions = await Auction.find({ endTime: { $lt: now }, winner: null });
  
  auctions.forEach(async (auction) => {
    if (auction.highestBidder) {
      auction.winner = auction.highestBidder;  // Set the highest bidder as the winner
      await auction.save();
    }
  });
};

// Call declareWinners function every 1 minute (60000ms)
setInterval(declareWinners, 60000);  // Check for ended auctions every 1 minute

// Export as default
export default Auction;
export { declareWinners };
