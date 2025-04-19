// Get auctions by user
router.get("/user/:userId", async (req, res) => {
  try {
    const userId = req.params.userId;
    
    // Get all auctions created by the user
    const auctions = await Auction.find({ userId })
      .sort({ createdAt: -1 })
      .populate("highestBidder", "name");
    
    res.status(200).json(auctions);
  } catch (error) {
    console.error("Error retrieving user auctions:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Get auctions by category
router.get("/category/:category", async (req, res) => {
  try {
    const category = req.params.category;
    
    // Get all auctions in the specified category
    const auctions = await Auction.find({ category })
      .sort({ endDate: 1 })
      .populate("highestBidder", "name");
    
    res.status(200).json(auctions);
  } catch (error) {
    console.error("Error retrieving category auctions:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Get categories with count
router.get("/categories", async (req, res) => {
  try {
    // Get all unique categories and their counts
    const categories = await Auction.aggregate([
      { $group: { _id: "$category", count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);
    
    res.status(200).json(categories);
  } catch (error) {
    console.error("Error retrieving categories:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Add activity tracking when a bid is placed
router.post("/:id/bid", auth, async (req, res) => {
  try {
    // ... existing code for placing a bid ...

    // Add activity entry
    const Activity = require("../models/activity.model");
    const activity = new Activity({
      userId: req.user.id,
      type: "bid",
      message: `You placed a bid of ₹${amount} on "${auction.title}"`,
      relatedAuction: auction._id
    });
    await activity.save();

    // ... rest of existing code ...
  } catch (error) {
    // ... existing error handling ...
  }
}); 