// routes/auctionScheduler.js
import Auction from "../models/Auction.js";
import { sendEmail } from "../utils/mailer.js";

const declareWinners = async () => {
  const now = new Date();
  const auctions = await Auction.find({ endTime: { $lt: now }, winner: null }).populate("highestBidder");

  auctions.forEach(async (auction) => {
    if (auction.highestBidder) {
      auction.winner = auction.highestBidder;
      await auction.save();

      // Send email to the winner
      const email = auction.highestBidder.email;
      const subject = `🎉 You won the auction for: ${auction.title}`;
      const message = `Congratulations! You placed the highest bid of ₹${auction.highestBid} on "${auction.title}".`;

      await sendEmail(email, subject, message);
    }
  });
};

// Start the scheduler
const startScheduler = () => {
  setInterval(declareWinners, 60000);
};

export default startScheduler;
