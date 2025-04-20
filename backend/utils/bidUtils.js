import mongoose from 'mongoose';
import Bid from '../models/Bid.js';
import Auction from '../models/Auction.js';

/**
 * Find an existing bid for a user on an auction
 * @param {string} userId - User ID
 * @param {string} auctionId - Auction ID
 * @returns {Promise<Object|null>} Existing bid or null
 */
export const findExistingBid = async (userId, auctionId) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(userId) || !mongoose.Types.ObjectId.isValid(auctionId)) {
      throw new Error("Invalid user ID or auction ID");
    }

    return await Bid.findOne({ userId, auctionId });
  } catch (error) {
    console.error("Error finding existing bid:", error);
    throw error;
  }
};

/**
 * Place a bid on an auction
 * @param {string} userId - User ID
 * @param {string} auctionId - Auction ID
 * @param {number} amount - Bid amount
 * @returns {Promise<Object>} Response with status and message
 */
export const placeBid = async (userId, auctionId, amount) => {
  const session = await mongoose.startSession();
  
  try {
    session.startTransaction();
    
    // Validate IDs
    if (!mongoose.Types.ObjectId.isValid(userId) || !mongoose.Types.ObjectId.isValid(auctionId)) {
      await session.abortTransaction();
      session.endSession();
      return { 
        success: false, 
        status: 400, 
        message: "Invalid user ID or auction ID format" 
      };
    }

    // Check if amount is a valid number
    const bidAmount = parseFloat(amount);
    if (isNaN(bidAmount) || bidAmount <= 0) {
      await session.abortTransaction();
      session.endSession();
      return { 
        success: false, 
        status: 400, 
        message: "Bid amount must be a positive number" 
      };
    }

    // Check if auction exists and has not ended
    const auction = await Auction.findById(auctionId).session(session);
    if (!auction) {
      await session.abortTransaction();
      session.endSession();
      return { 
        success: false, 
        status: 404, 
        message: "Auction not found" 
      };
    }

    if (auction.isEnded || new Date() > auction.endTime) {
      await session.abortTransaction();
      session.endSession();
      return { 
        success: false, 
        status: 400, 
        message: "Auction has ended" 
      };
    }

    // Get the current highest bid for the auction
    const highestBid = await Bid.findOne({ auctionId }).sort({ amount: -1 }).session(session);
    
    // Ensure bid is higher than starting bid or highest bid
    const minBid = highestBid ? highestBid.amount : auction.startingBid;
    if (bidAmount <= minBid) {
      await session.abortTransaction();
      session.endSession();
      return { 
        success: false, 
        status: 400, 
        message: `Bid must be higher than ${minBid}` 
      };
    }

    // Check if user already has a bid for this auction
    const existingBid = await Bid.findOne({ userId, auctionId }).session(session);
    
    let bid;
    if (existingBid) {
      // Update existing bid
      existingBid.amount = bidAmount;
      existingBid.bidTime = new Date();
      bid = await existingBid.save({ session });
      console.log(`Updated bid: ${bid._id} for auction ${auctionId} by user ${userId}`);
    } else {
      // Create new bid
      bid = new Bid({
        userId,
        auctionId,
        amount: bidAmount,
        bidTime: new Date()
      });
      bid = await bid.save({ session });
      console.log(`New bid: ${bid._id} for auction ${auctionId} by user ${userId}`);
    }

    // Update auction with highest bid and bidder using findByIdAndUpdate
    // This avoids Mongoose validation on other required fields that might not be set
    await Auction.findByIdAndUpdate(
      auctionId,
      { 
        highestBid: bidAmount,
        highestBidder: userId
      },
      { session }
    );

    await session.commitTransaction();
    session.endSession();

    return { 
      success: true, 
      status: 200, 
      message: "Bid placed successfully", 
      bid: {
        id: bid._id,
        amount: bid.amount,
        auctionId: bid.auctionId,
        bidTime: bid.bidTime
      }
    };
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error("Error placing bid:", error);
    // Instead of returning an error object, throw the error to be caught by the route handler
    throw new Error(`Server error while placing bid: ${error.message}`);
  }
}; 