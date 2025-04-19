// Add this to your bid placement endpoint
router.post("/:userId", async (req, res) => {
  try {
    // ... existing bid placement code ...

    // After successful bid placement, add to activity feed
    const Activity = require("../models/activity.model");
    const activity = new Activity({
      userId,
      type: "bid",
      message: `You bid ₹${amount} on "${auction.title}"`,
      relatedAuction: auctionId
    });
    await activity.save();

    // ... rest of existing code ...
  } catch (error) {
    // ... error handling ...
  }
});

// When auction ends, add a win activity if there's a winner
// This could be in a scheduler or in your auction end logic
async function addWinActivity(auction) {
  if (auction.highestBidderId) {
    const Activity = require("../models/activity.model");
    const activity = new Activity({
      userId: auction.highestBidderId,
      type: "win",
      message: `You won the auction for "${auction.title}" with a bid of ₹${auction.highestBid}`,
      relatedAuction: auction._id
    });
    await activity.save();
  }
} 