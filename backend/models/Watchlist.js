import mongoose from 'mongoose';
const Schema = mongoose.Schema;

const watchlistSchema = new Schema({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  auctions: [{
    type: Schema.Types.ObjectId,
    ref: 'Auction'
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

// Create compound index to ensure a user can only have one watchlist
watchlistSchema.index({ user: 1 }, { unique: true });

export default mongoose.model('Watchlist', watchlistSchema); 