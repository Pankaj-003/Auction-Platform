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
});

const Auction = mongoose.model("Auction", auctionSchema);

export default Auction;
