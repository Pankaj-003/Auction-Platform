import mongoose from "mongoose";

const bidSchema = new mongoose.Schema({
  auctionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Auction", // Reference to the Auction model
    required: true,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User", // Reference to the User model
    required: true,
  },
  amount: {
    type: Number,
    required: true,
  },
}, { timestamps: true });

const Bid = mongoose.model("Bid", bidSchema);

export default Bid;
