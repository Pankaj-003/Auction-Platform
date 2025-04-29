import mongoose from 'mongoose';
import Watchlist from '../models/watchlist.model.js';
import Auction from '../models/Auction.js';

// Get user's watchlist
export const getUserWatchlist = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: 'Invalid user ID' });
    }

    // Find watchlist items for this user and populate auction details
    const watchlistItems = await Watchlist.find({ userId })
      .populate({
        path: 'auctionId',
        select: '_id title description image startingBid highestBid endTime',
        model: 'Auction'
      })
      .sort({ createdAt: -1 });

    // Format response
    const formattedItems = watchlistItems.map(item => ({
      _id: item._id,
      auction: item.auctionId ? {
        _id: item.auctionId._id,
        title: item.auctionId.title,
        description: item.auctionId.description,
        image: item.auctionId.image,
        startingBid: item.auctionId.startingBid,
        highestBid: item.auctionId.highestBid,
        endTime: item.auctionId.endTime
      } : null,
      addedAt: item.createdAt
    }));

    res.status(200).json(formattedItems);
  } catch (error) {
    console.error('Error getting watchlist:', error);
    res.status(500).json({ message: 'Failed to retrieve watchlist', error: error.message });
  }
};

// Add item to watchlist
export const addToWatchlist = async (req, res) => {
  try {
    const { userId, auctionId } = req.body;

    if (!mongoose.Types.ObjectId.isValid(userId) || !mongoose.Types.ObjectId.isValid(auctionId)) {
      return res.status(400).json({ message: 'Invalid user ID or auction ID' });
    }

    // Check if auction exists
    const auction = await Auction.findById(auctionId);
    if (!auction) {
      return res.status(404).json({ message: 'Auction not found' });
    }

    // Check if already in watchlist
    const existingItem = await Watchlist.findOne({ userId, auctionId });
    if (existingItem) {
      return res.status(400).json({ message: 'Item already in watchlist' });
    }

    // Create watchlist item
    const watchlistItem = new Watchlist({
      userId,
      auctionId
    });

    await watchlistItem.save();

    res.status(201).json({
      _id: watchlistItem._id,
      message: 'Item added to watchlist'
    });
  } catch (error) {
    console.error('Error adding to watchlist:', error);
    res.status(500).json({ message: 'Failed to add item to watchlist', error: error.message });
  }
};

// Remove item from watchlist
export const removeFromWatchlist = async (req, res) => {
  try {
    const { watchlistId } = req.params;
    const { userId } = req.body;

    if (!mongoose.Types.ObjectId.isValid(watchlistId)) {
      return res.status(400).json({ message: 'Invalid watchlist item ID' });
    }

    // Find and ensure it belongs to the user
    const watchlistItem = await Watchlist.findOne({ 
      _id: watchlistId,
      userId
    });

    if (!watchlistItem) {
      return res.status(404).json({ message: 'Watchlist item not found or not owned by user' });
    }

    // Delete the item
    await Watchlist.findByIdAndDelete(watchlistId);

    res.status(200).json({ message: 'Item removed from watchlist' });
  } catch (error) {
    console.error('Error removing from watchlist:', error);
    res.status(500).json({ message: 'Failed to remove item from watchlist', error: error.message });
  }
};

// Check if an auction is in the user's watchlist
export const checkWatchlistStatus = async (req, res) => {
  try {
    const { userId, auctionId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(userId) || !mongoose.Types.ObjectId.isValid(auctionId)) {
      return res.status(400).json({ message: 'Invalid user ID or auction ID' });
    }

    // Check if in watchlist
    const watchlistItem = await Watchlist.findOne({ userId, auctionId });
    
    res.status(200).json({
      isInWatchlist: !!watchlistItem,
      watchlistItemId: watchlistItem ? watchlistItem._id : null
    });
  } catch (error) {
    console.error('Error checking watchlist status:', error);
    res.status(500).json({ message: 'Failed to check watchlist status', error: error.message });
  }
}; 