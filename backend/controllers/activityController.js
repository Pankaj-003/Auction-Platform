import mongoose from 'mongoose';
import Auction from '../models/Auction.js';
import Bid from '../models/Bid.js';
import User from '../models/User.js';

// Get recent activities for a user (both buyer and seller activities)
export const getRecentActivities = async (req, res) => {
  try {
    const { userId } = req.params;
    const { timeframe = '24h', roleType = '' } = req.query;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: 'Invalid user ID' });
    }

    // Calculate timeframe in milliseconds
    let timeInMs = 24 * 60 * 60 * 1000; // Default 24 hours
    if (timeframe === '7d') timeInMs = 7 * 24 * 60 * 60 * 1000;
    if (timeframe === '30d') timeInMs = 30 * 24 * 60 * 60 * 1000;

    const cutoffDate = new Date(Date.now() - timeInMs);
    
    // Array to hold all activities
    let activities = [];

    // Get bids (for buyers)
    if (roleType !== 'seller') {
      const recentBids = await Bid.find({ 
        userId,
        createdAt: { $gte: cutoffDate }
      })
      .sort({ createdAt: -1 })
      .populate({
        path: 'auctionId',
        select: 'title image highestBid'
      });
      
      // Format bid activities
      const bidActivities = recentBids.map(bid => ({
        _id: bid._id,
        type: 'bid',
        amount: bid.amount,
        date: bid.createdAt,
        auction: bid.auctionId ? {
          _id: bid.auctionId._id,
          title: bid.auctionId.title,
          image: bid.auctionId.image,
          highestBid: bid.auctionId.highestBid
        } : null
      }));
      
      activities = activities.concat(bidActivities);
    }

    // Get auction activities (for sellers)
    if (roleType === 'seller' || !roleType) {
      // Created auctions
      const createdAuctions = await Auction.find({
        seller: userId,
        createdAt: { $gte: cutoffDate }
      })
      .sort({ createdAt: -1 })
      .select('title image startingBid highestBid createdAt');

      const createdAuctionActivities = createdAuctions.map(auction => ({
        _id: auction._id,
        type: 'auction_created',
        title: auction.title,
        image: auction.image,
        startingBid: auction.startingBid,
        date: auction.createdAt,
      }));

      // Completed auctions
      const completedAuctions = await Auction.find({
        seller: userId,
        endTime: { $gte: cutoffDate, $lte: new Date() }
      })
      .sort({ endTime: -1 })
      .populate({
        path: 'winner',
        select: 'name email'
      })
      .select('title image highestBid endTime winner');

      const completedAuctionActivities = completedAuctions.map(auction => ({
        _id: auction._id,
        type: 'auction_ended',
        title: auction.title,
        image: auction.image,
        highestBid: auction.highestBid,
        winner: auction.winner ? {
          name: auction.winner.name,
          email: auction.winner.email
        } : null,
        date: auction.endTime
      }));

      activities = activities.concat(createdAuctionActivities, completedAuctionActivities);
    }

    // Sort all activities by date (newest first)
    activities.sort((a, b) => new Date(b.date) - new Date(a.date));

    console.log(`Found ${activities.length} activities for user ${userId}`);
    res.status(200).json(activities);
  } catch (error) {
    console.error('Error getting recent activities:', error);
    res.status(500).json({ message: 'Failed to retrieve recent activities', error: error.message });
  }
}; 