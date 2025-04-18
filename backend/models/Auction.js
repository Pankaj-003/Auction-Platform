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
        auction.winner = auction.highestBidder;  // Set highest bidder as the winner
        await auction.save();
        console.log(`Winner declared for auction: ${auction._id}`);
      }
    }
  } catch (error) {
    console.error('Error declaring winner:', error);
  }
};

// Call declareWinners function every 1 minute (60000ms)
setInterval(declareWinners, 60000);  // Check for ended auctions every 1 minute

// Export the Auction model and declareWinners function
export default Auction;
export { declareWinners };
