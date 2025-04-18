import Auction from "../models/Auction.js";
import Bid from "../models/Bid.js";

const declareWinners = async () => {
  const now = new Date();

  const expiredAuctions = await Auction.find({
    endTime: { $lt: now },
    winner: null,
  });

  for (const auction of expiredAuctions) {
    // Find the highest bid for this auction
    const highestBid = await Bid.findOne({ auctionId: auction._id })
      .sort({ amount: -1 })
      .populate("userId"); // populate to get user info if needed

    if (highestBid) {
      auction.winner = highestBid.userId;
      auction.highestBid = highestBid.amount;
      auction.highestBidder = highestBid.userId;
      await auction.save();
      console.log(`🏆 Winner declared: ${highestBid.userId.name} for ${auction.title}`);
    } else {
      console.log(`No bids for auction: ${auction.title}`);
    }
  }
};

export default declareWinners;
