import express from 'express';
import { 
  getDashboardStats,
  getUserBids,
  getActiveAuctionsForUser,
  getWonAuctions,
  getWatchlistItems,
  addToWatchlist,
  removeFromWatchlist
} from '../controllers/dashboardController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = express.Router();

// Apply auth middleware to all dashboard routes
router.use(authMiddleware);

// Dashboard statistics
router.get('/stats', getDashboardStats);

// User's bids
router.get('/bids', getUserBids);

// User's active auctions
router.get('/active-auctions', getActiveAuctionsForUser);

// User's won auctions
router.get('/won-auctions', getWonAuctions);

// User's watchlist
router.get('/watchlist', getWatchlistItems);

// Add/remove from watchlist
router.post('/watchlist/:auctionId', addToWatchlist);
router.delete('/watchlist/:auctionId', removeFromWatchlist);

export default router; 