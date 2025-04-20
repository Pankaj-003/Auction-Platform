import express from 'express';
import { getActiveBids, getWonAuctions, getUserListings, getProfileSummary, getAuctionBidHistory } from '../controllers/profileController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = express.Router();

// Middleware to verify token for all profile routes
router.use(authMiddleware);

// Get profile summary for authenticated user
router.get('/summary/:userId', getProfileSummary);

// Get active bids for authenticated user
router.get('/active-bids/:userId', getActiveBids);

// Get won auctions for authenticated user
router.get('/won-auctions/:userId', getWonAuctions);

// Get user's listings (auctions they created)
router.get('/listings/:userId', getUserListings);

// Get bid history for specific auction
router.get('/bid-history/:userId/:auctionId', getAuctionBidHistory);

export default router; 