import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import http from "http";
import nodemailer from "nodemailer";

import authRoutes from "./routes/authRoutes.js";
import auctionRoutes from "./routes/auctionRoutes.js";
import bidRoutes from "./routes/bidRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import contactRoutes from "./routes/contactRoutes.js";
import Auction from "./models/Auction.js";
import Bid from "./models/Bid.js";
import User from "./models/User.js";

dotenv.config();
const app = express();

// Middleware
app.use(cors({
  origin: "http://localhost:5173", // Frontend URL
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  credentials: true,
}));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Database connection
mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("✅ MongoDB Connected"))
  .catch((err) => console.error("❌ MongoDB Connection Error:", err));

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/auctions", auctionRoutes);
app.use("/api/bids", bidRoutes);
app.use("/api/users", userRoutes);
app.use("/api/contact", contactRoutes);

// API route to get all auctions with winner's name populated
app.get("/api/auctions", async (req, res) => {
  try {
    const auctions = await Auction.find()
      .populate('winner', 'name') // Shows winner name
      .populate('highestBidder', 'name'); // Optional
    res.json(auctions);
  } catch (err) {
    res.status(500).send("Error fetching auctions");
  }
});


// Start server
const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});

// Auto declare winner every 1 minute
setInterval(async () => {
  try {
    const endedAuctions = await Auction.find({ endTime: { $lt: new Date() }, winner: null });

    for (const auction of endedAuctions) {
      // Get highest bid
      const highestBid = await Bid.findOne({ auctionId: auction._id }).sort({ amount: -1 });

      if (highestBid) {
        auction.winner = highestBid.userId; // Save userId as winner
        await auction.save();

        console.log(`🏆 Winner declared for auction "${auction.title}"`);
      }
    }
  } catch (error) {
    console.error("❌ Error declaring winners:", error);
  }
}, 60 * 1000); // Run every 1 minute