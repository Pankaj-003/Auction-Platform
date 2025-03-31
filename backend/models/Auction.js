import mongoose from "mongoose";

const auctionSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  image: { type: String, required: true },
  startingBid: { type: Number, required: true },
  endTime: { type: Number, required: true },
});

const Auction = mongoose.model("Auction", auctionSchema);

export default Auction;
