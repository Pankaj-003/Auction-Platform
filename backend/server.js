import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import http from "http";
import nodemailer from "nodemailer";
import path from "path";
import { fileURLToPath } from "url";

import authRoutes from "./routes/authRoutes.js";
import auctionRoutes from "./routes/auctionRoutes.js";
import bidRoutes from "./routes/bidRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import contactRoutes from "./routes/contactRoutes.js";
import Auction from "./models/Auction.js";
import Bid from "./models/Bid.js";
import User from "./models/User.js";

// Import dashboard and watchlist routes
import dashboardRoutes from "./routes/dashboard.routes.js";
import watchlistRoutes from "./routes/watchlist.routes.js";

dotenv.config();
const app = express();

// Get __dirname equivalent in ES module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/watchlist", watchlistRoutes);

// Serve uploads folder
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

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

// API route to fetch user profile (including the profile picture)
app.get("/api/user/:id", async (req, res) => {
  const userId = req.params.id;
  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).send("User not found");
    }

    // Return user profile data, including the profile picture path
    res.json({
      name: user.name,
      email: user.email,
      profilePic: user.profilePic ? `/uploads/${user.profilePic}` : null,
    });
  } catch (err) {
    console.error("Error fetching user profile:", err);
    res.status(500).send("Error fetching user profile");
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
