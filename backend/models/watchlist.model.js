import mongoose from "mongoose";

const watchlistSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  auction: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Auction",
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Compound index to prevent duplicate entries
watchlistSchema.index({ userId: 1, auction: 1 }, { unique: true });

export default mongoose.model("Watchlist", watchlistSchema); 