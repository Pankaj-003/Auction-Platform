import mongoose from "mongoose";

const activitySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  type: {
    type: String,
    enum: ["bid", "win", "watchlist", "auction", "system"],
    required: true
  },
  message: {
    type: String,
    required: true
  },
  relatedAuction: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Auction"
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Index for faster queries by user and creation date
activitySchema.index({ userId: 1, createdAt: -1 });

export default mongoose.model("Activity", activitySchema); 