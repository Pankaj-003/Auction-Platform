import mongoose from 'mongoose';
import Auction from '../models/Auction.js';
import Bid from '../models/Bid.js';
import User from '../models/User.js';

// Get active bids for a user
export const getActiveBids = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: 'Invalid user ID' });
    }

    const now = new Date();
    
    // Find active auctions
    const activeAuctions = await Auction.find({ 
      endTime: { $gt: now } 
    }).select('_id title image highestBid endTime');
    
    // Get user's bids for these auctions
    const userBids = await Bid.find({
      userId,
      auctionId: { $in: activeAuctions.map(a => a._id) }
    }).sort({ amount: -1 });
    
    // Group bids by auction and take only the highest
    const bidsByAuction = {};
    userBids.forEach(bid => {
      if (!bidsByAuction[bid.auctionId] || bid.amount > bidsByAuction[bid.auctionId].amount) {
        bidsByAuction[bid.auctionId] = bid;
      }
    });
    
    // Format response
    const activeBids = [];
    for (const auction of activeAuctions) {
      const userBid = bidsByAuction[auction._id];
      
      if (userBid) {
        const isWinning = userBid.amount >= auction.highestBid;
        
        activeBids.push({
          _id: userBid._id,
          auctionId: auction._id,
          title: auction.title,
          image: auction.image,
          amount: userBid.amount,
          currentHighestBid: auction.highestBid,
          status: isWinning ? 'winning' : 'outbid',
          endTime: auction.endTime
        });
      }
    }
    
    res.status(200).json(activeBids);
  } catch (error) {
    console.error('Error getting active bids:', error);
    res.status(500).json({ message: 'Failed to retrieve active bids', error: error.message });
  }
};

// Get won auctions for a user
export const getWonAuctions = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: 'Invalid user ID' });
    }

    // Find auctions where this user is the winner and the auction has ended
    const wonAuctions = await Auction.find({
      winner: userId,
      endTime: { $lt: new Date() }
    })
    .sort({ endTime: -1 }) // Most recently ended first
    .select('title description image startingBid highestBid endTime');

    res.status(200).json(wonAuctions);
  } catch (error) {
    console.error('Error getting won auctions:', error);
    res.status(500).json({ message: 'Failed to retrieve won auctions', error: error.message });
  }
};

// Get auctions created by a user (listings)
export const getUserListings = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: 'Invalid user ID' });
    }

    // Find auctions created by the user
    const userListings = await Auction.find({ seller: userId })
      .sort({ createdAt: -1 }) // Most recently created first
      .select('title description image startingBid highestBid endTime winner');

    // Add status for each listing (active, ended, sold)
    const now = new Date();
    const enrichedListings = userListings.map(listing => {
      let status = 'active';
      if (new Date(listing.endTime) < now) {
        status = listing.winner ? 'sold' : 'ended';
      }

      return {
        ...listing._doc,
        status
      };
    });

    res.status(200).json(enrichedListings);
  } catch (error) {
    console.error('Error getting user listings:', error);
    res.status(500).json({ message: 'Failed to retrieve user listings', error: error.message });
  }
};

// Get user profile summary
export const getProfileSummary = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: 'Invalid user ID' });
    }

    // Get user details
    const user = await User.findById(userId).select('name email profilePic role createdAt');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Get stats
    const now = new Date();
    
    // Active bids count
    const activeBidsCount = await Bid.countDocuments({ 
      userId,
      'auctionId': { $in: await Auction.find({ endTime: { $gt: now } }).distinct('_id') }
    });
    
    // Won auctions count
    const wonAuctionsCount = await Auction.countDocuments({ 
      winner: userId,
      endTime: { $lt: now }
    });
    
    // Active listings count
    const activeListingsCount = await Auction.countDocuments({
      seller: userId,
      endTime: { $gt: now }
    });
    
    // Total listings count (all listings ever created by this user)
    const totalListingsCount = await Auction.countDocuments({
      seller: userId
    });
    
    // Total bids placed
    const totalBidsPlaced = await Bid.countDocuments({ userId });
    
    // Recent activity (last 5 bids)
    const recentBids = await Bid.find({ userId })
      .sort({ createdAt: -1 })
      .limit(5)
      .populate({
        path: 'auctionId',
        select: 'title image'
      });
    
    const summary = {
      user,
      stats: {
        activeBids: activeBidsCount,
        wonAuctions: wonAuctionsCount,
        activeListings: activeListingsCount,
        totalListings: totalListingsCount,
        totalBidsPlaced
      },
      recentActivity: recentBids.map(bid => ({
        _id: bid._id,
        amount: bid.amount,
        date: bid.createdAt,
        auction: bid.auctionId ? {
          _id: bid.auctionId._id,
          title: bid.auctionId.title,
          image: bid.auctionId.image
        } : null
      }))
    };

    res.status(200).json(summary);
  } catch (error) {
    console.error('Error getting profile summary:', error);
    res.status(500).json({ message: 'Failed to retrieve profile summary', error: error.message });
  }
};

// Get user's bid history for a specific auction
export const getAuctionBidHistory = async (req, res) => {
  try {
    const { userId, auctionId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(userId) || !mongoose.Types.ObjectId.isValid(auctionId)) {
      return res.status(400).json({ message: 'Invalid user ID or auction ID' });
    }

    // Get auction details
    const auction = await Auction.findById(auctionId).select('title image startingBid highestBid highestBidder endTime');
    
    if (!auction) {
      return res.status(404).json({ message: 'Auction not found' });
    }

    // Get all bids by this user for this auction
    const bids = await Bid.find({ 
      userId: userId,
      auctionId: auctionId
    })
    .sort({ createdAt: -1 }); // Latest bids first

    // Format the response
    const response = {
      auction: {
        _id: auction._id,
        title: auction.title,
        image: auction.image,
        startingBid: auction.startingBid,
        highestBid: auction.highestBid,
        isWinning: auction.highestBidder?.toString() === userId,
        endTime: auction.endTime,
        isEnded: new Date(auction.endTime) < new Date()
      },
      bids: bids.map(bid => ({
        _id: bid._id,
        amount: bid.amount,
        timestamp: bid.createdAt,
        isHighest: bid.amount === auction.highestBid
      }))
    };

    res.status(200).json(response);
  } catch (error) {
    console.error('Error getting auction bid history:', error);
    res.status(500).json({ message: 'Failed to retrieve bid history', error: error.message });
  }
};

// Update user profile
export const updateUserProfile = async (req, res) => {
  try {
    const { userId } = req.params;
    const { name, role } = req.body;
    
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: 'Invalid user ID' });
    }
    
    // Handle profile picture upload if provided
    let profilePicUrl = undefined;
    if (req.file) {
      profilePicUrl = `uploads/${req.file.filename}`;
    }
    
    // Update user in database
    const updateData = {
      ...(name && { name }),
      ...(role && { role }),
      ...(profilePicUrl && { profilePic: profilePicUrl })
    };
    
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      updateData,
      { new: true, runValidators: true }
    ).select('-password');
    
    if (!updatedUser) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.status(200).json({
      message: 'Profile updated successfully',
      data: updatedUser
    });
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ message: 'Failed to update profile', error: error.message });
  }
}; 