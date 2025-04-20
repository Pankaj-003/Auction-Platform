import Bid from '../models/Bid.js';
import Auction from '../models/Auction.js';
import Watchlist from '../models/Watchlist.js';
import User from '../models/User.js';
import mongoose from 'mongoose';

/**
 * Get all dashboard statistics for a user
 * @route GET /api/dashboard/stats
 * @access Private
 */
export const getDashboardStats = async (req, res) => {
  try {
    const userId = req.user.id;

    // Run all queries in parallel for better performance
    const [
      bidsPlaced,
      activeAuctions,
      auctionsWon,
      watchlistCount
    ] = await Promise.all([
      getBidsPlacedCount(userId),
      getActiveAuctionsCount(userId),
      getAuctionsWonCount(userId),
      getWatchlistCount(userId)
    ]);

    res.status(200).json({
      success: true,
      stats: {
        bidsPlaced,
        activeAuctions,
        auctionsWon,
        watchlistItems: watchlistCount
      }
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch dashboard statistics'
    });
  }
};

/**
 * Get user's bid history with pagination
 * @route GET /api/dashboard/bids
 * @access Private
 */
export const getUserBids = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const userId = req.user.id;

    // Get bid count for pagination
    const total = await Bid.countDocuments({ user: userId });
    
    // Get bids with auction details
    const bids = await Bid.find({ user: userId })
      .populate({
        path: 'auction',
        select: 'title currentPrice imageUrl endDate isActive winner'
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    // Determine if each bid is winning
    const bidsWithStatus = bids.map(bid => {
      const isWinning = bid.auction.isActive ? 
        bid.amount >= bid.auction.currentPrice : 
        bid.auction.winner && bid.auction.winner.toString() === userId;
      
      return {
        _id: bid._id,
        amount: bid.amount,
        createdAt: bid.createdAt,
        auction: bid.auction,
        isWinning
      };
    });

    res.status(200).json({
      success: true,
      bids: bidsWithStatus,
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get user bids error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch bid history'
    });
  }
};

/**
 * Get user's active auctions
 * @route GET /api/dashboard/active-auctions
 * @access Private
 */
export const getActiveAuctionsForUser = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const userId = req.user.id;

    // Get auctions user has bid on
    const auctionsWithUserBids = await getAuctionsWithUserBids(userId);

    // Get active auctions count for pagination
    const total = await Auction.countDocuments({ 
      $or: [
        // Auctions created by the user (if seller)
        { seller: userId, isActive: true },
        // Auctions where user has placed a bid
        { 
          _id: { $in: auctionsWithUserBids },
          isActive: true 
        }
      ]
    });
    
    // Get active auctions
    const auctions = await Auction.find({
      $or: [
        // Auctions created by the user (if seller)
        { seller: userId, isActive: true },
        // Auctions where user has placed a bid
        { 
          _id: { $in: auctionsWithUserBids },
          isActive: true 
        }
      ]
    })
    .populate('seller', 'name profilePic')
    .sort({ endDate: 1 })
    .skip(skip)
    .limit(limit);

    // Get highest bid for each auction
    const auctionsWithBidStatus = await Promise.all(auctions.map(async (auction) => {
      const highestUserBid = await Bid.findOne({
        auction: auction._id,
        user: userId
      }).sort({ amount: -1 });

      const isHighestBidder = highestUserBid && 
        highestUserBid.amount >= auction.currentPrice;

      return {
        ...auction.toObject(),
        userBid: highestUserBid ? highestUserBid.amount : 0,
        isHighestBidder
      };
    }));

    res.status(200).json({
      success: true,
      auctions: auctionsWithBidStatus,
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get active auctions error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch active auctions'
    });
  }
};

/**
 * Get user's won auctions
 * @route GET /api/dashboard/won-auctions
 * @access Private
 */
export const getWonAuctions = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const userId = req.user.id;

    // Get won auctions count for pagination
    const total = await Auction.countDocuments({ 
      winner: userId,
      isActive: false
    });
    
    // Get won auctions
    const auctions = await Auction.find({
      winner: userId,
      isActive: false
    })
    .populate('seller', 'name profilePic')
    .sort({ endDate: -1 })
    .skip(skip)
    .limit(limit);

    // Get winning bid for each auction
    const auctionsWithWinningBid = await Promise.all(auctions.map(async (auction) => {
      const winningBid = await Bid.findOne({
        auction: auction._id,
        user: userId,
        amount: auction.currentPrice
      });

      return {
        ...auction.toObject(),
        winningBid: winningBid ? winningBid.amount : auction.currentPrice
      };
    }));

    res.status(200).json({
      success: true,
      auctions: auctionsWithWinningBid,
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get won auctions error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch won auctions'
    });
  }
};

/**
 * Get user's watchlist items
 * @route GET /api/dashboard/watchlist
 * @access Private
 */
export const getWatchlistItems = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const userId = req.user.id;

    // Get user's watchlist
    const watchlist = await Watchlist.findOne({ user: userId })
      .populate({
        path: 'auctions',
        populate: {
          path: 'seller',
          select: 'name profilePic'
        },
        options: {
          sort: { endDate: 1 }
        }
      });

    // If no watchlist, return empty array
    if (!watchlist) {
      return res.status(200).json({
        success: true,
        watchlist: [],
        pagination: {
          total: 0,
          page,
          pages: 0
        }
      });
    }

    const total = watchlist.auctions.length;
    const watchlistItems = watchlist.auctions.slice(skip, skip + limit);

    // Add user bid status to each auction
    const itemsWithBidStatus = await Promise.all(watchlistItems.map(async (auction) => {
      const highestUserBid = await Bid.findOne({
        auction: auction._id,
        user: userId
      }).sort({ amount: -1 });

      return {
        ...auction.toObject(),
        userBid: highestUserBid ? highestUserBid.amount : 0,
        isHighestBidder: highestUserBid && highestUserBid.amount >= auction.currentPrice
      };
    }));

    res.status(200).json({
      success: true,
      watchlist: itemsWithBidStatus,
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get watchlist error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch watchlist'
    });
  }
};

/**
 * Add auction to watchlist
 * @route POST /api/dashboard/watchlist/:auctionId
 * @access Private
 */
export const addToWatchlist = async (req, res) => {
  try {
    const { auctionId } = req.params;
    const userId = req.user.id;

    // Verify auction exists
    const auction = await Auction.findById(auctionId);
    if (!auction) {
      return res.status(404).json({
        success: false,
        error: 'Auction not found'
      });
    }

    // Get or create watchlist
    let watchlist = await Watchlist.findOne({ user: userId });
    
    if (!watchlist) {
      watchlist = new Watchlist({
        user: userId,
        auctions: [auctionId]
      });
    } else if (!watchlist.auctions.includes(auctionId)) {
      // Add auction to watchlist if not already there
      watchlist.auctions.push(auctionId);
    }

    await watchlist.save();

    res.status(200).json({
      success: true,
      message: 'Added to watchlist',
      watchlistCount: watchlist.auctions.length
    });
  } catch (error) {
    console.error('Add to watchlist error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to add item to watchlist'
    });
  }
};

/**
 * Remove auction from watchlist
 * @route DELETE /api/dashboard/watchlist/:auctionId
 * @access Private
 */
export const removeFromWatchlist = async (req, res) => {
  try {
    const { auctionId } = req.params;
    const userId = req.user.id;

    // Find user's watchlist
    const watchlist = await Watchlist.findOne({ user: userId });
    
    if (!watchlist) {
      return res.status(404).json({
        success: false,
        error: 'Watchlist not found'
      });
    }

    // Remove auction from watchlist
    watchlist.auctions = watchlist.auctions.filter(
      auction => auction.toString() !== auctionId
    );

    await watchlist.save();

    res.status(200).json({
      success: true,
      message: 'Removed from watchlist',
      watchlistCount: watchlist.auctions.length
    });
  } catch (error) {
    console.error('Remove from watchlist error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to remove item from watchlist'
    });
  }
};

// Helper functions to get the counts

/**
 * Get count of bids placed by a user
 */
async function getBidsPlacedCount(userId) {
  return await Bid.countDocuments({ user: userId });
}

/**
 * Get count of active auctions for a user
 * (either created by the user or with bids from the user)
 */
async function getActiveAuctionsCount(userId) {
  // Get auctions where user has placed bids
  const auctionsWithUserBids = await getAuctionsWithUserBids(userId);

  // Count active auctions where user is the seller or has placed bids
  return await Auction.countDocuments({
    $or: [
      { seller: userId, isActive: true },
      { _id: { $in: auctionsWithUserBids }, isActive: true }
    ]
  });
}

/**
 * Get count of auctions won by a user
 */
async function getAuctionsWonCount(userId) {
  return await Auction.countDocuments({ 
    winner: userId,
    isActive: false
  });
}

/**
 * Get count of items in a user's watchlist
 */
async function getWatchlistCount(userId) {
  const watchlist = await Watchlist.findOne({ user: userId });
  return watchlist ? watchlist.auctions.length : 0;
}

/**
 * Get array of auction IDs where user has placed bids
 */
async function getAuctionsWithUserBids(userId) {
  const userBids = await Bid.find({ user: userId })
    .distinct('auction');
  
  return userBids;
} 