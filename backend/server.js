import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import http from "http";  // Import http module
import nodemailer from "nodemailer";  // Import nodemailer

import authRoutes from "./routes/authRoutes.js";
import auctionRoutes from "./routes/auctionRoutes.js";
import bidRoutes from "./routes/bidRoutes.js";
import userRoutes from "./routes/userRoutes.js";
// import auctionScheduler from 'auctionScheduler.js'; 
//  // Import the auction scheduler
import auctionScheduler from "./routes/auctionScheduler.js"; // Import the auction scheduler
dotenv.config();

const app = express();

// ✅ Improved CORS setup to prevent "Failed to fetch"
app.use(cors({
  origin: "http://localhost:5173", // Vite frontend
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  credentials: true, // Allow cookies/localStorage
}));

// ✅ Body parser
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// ✅ MongoDB Connection
mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("✅ MongoDB Connected"))
  .catch((err) => console.error("❌ MongoDB Connection Error:", err));

// ✅ API Routes
app.use("/api/auth", authRoutes);
app.use("/api/auctions", auctionRoutes);
app.use("/api/bids", bidRoutes);
app.use("/api/users", userRoutes);

// ✅ Start Server
const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});

// Run the auction scheduler
auctionScheduler();

// Email Notification for auction end
const server = http.createServer((request, response) => {
  const auth = nodemailer.createTransport({
    service: 'gmail',
    secure: true,
    port: 465,
    auth: {
      user: process.env.EMAIL,
      pass: process.env.PASSWORD,
    }
  });

  const mailOptions = {
    from: process.env.EMAIL,
    to: process.env.EMAIL,  // Recipient email (can be dynamic if needed)
    subject: 'Auction Notification',
    text: 'Your auction has ended. Please check your account for details.',
  };

  auth.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.log('Error sending email:', error);
    } else {
      console.log('Email sent:', info.response);
    }
  });
  response.end('Email sent!');
});
