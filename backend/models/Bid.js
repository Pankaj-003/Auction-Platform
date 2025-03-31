import mongoose from "mongoose";

const bidSchema = new mongoose.Schema({
  userId: { type: String, required: true }, // Assuming userId is the user's unique identifier
  auctionItemId: { type: mongoose.Schema.Types.ObjectId, ref: "AuctionItem", required: true },
  amount: { type: Number, required: true },
  createdAt: { type: Date, default: Date.now },
});

const Bid = mongoose.model("Bid", bidSchema);

export default Bid;
