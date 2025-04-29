import express from 'express';
import { 
  getUserWatchlist, 
  addToWatchlist, 
  removeFromWatchlist, 
  checkWatchlistStatus 
} from '../controllers/watchlistController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = express.Router();

// Apply authentication middleware to all watchlist routes
router.use(authMiddleware);

// Get user's watchlist items
router.get('/:userId', getUserWatchlist);

// Add item to watchlist
router.post('/', addToWatchlist);

// Remove item from watchlist
router.delete('/:watchlistId', removeFromWatchlist);

// Check if an auction is in user's watchlist
router.get('/check/:userId/:auctionId', checkWatchlistStatus);

export default router; 