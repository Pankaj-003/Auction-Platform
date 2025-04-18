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
import auctionScheduler from "./routes/auctionScheduler.js";
import declareWinners from "./routes/winnerChecker.js";
import contactRoutes from "./routes/contactRoutes.js";

dotenv.config();
const app = express();

// Middleware
app.use(cors({
  origin: "http://localhost:5173",
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  credentials: true,
}));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Database
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

// Start server
const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});

// Run scheduled tasks
setInterval(declareWinners, 60 * 1000); // Auto declare winner every minute
auctionScheduler();
