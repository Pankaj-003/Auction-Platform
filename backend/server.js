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
import profileRoutes from "./routes/profileRoutes.js";
import dashboardRoutes from "./routes/dashboardRoutes.js";
import watchlistRoutes from "./routes/watchlistRoutes.js";
import Auction from "./models/Auction.js";
import Bid from "./models/Bid.js";
import User from "./models/User.js";
import { declareWinners } from "./models/Auction.js"; // Import the declareWinners function

dotenv.config();
const app = express();

// Get __dirname equivalent in ES module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Middleware
app.use(cors({
  origin: ["http://localhost:5173", "http://localhost:5174", "http://127.0.0.1:5173", "http://127.0.0.1:5174"], // Frontend URLs
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
  optionsSuccessStatus: 200
}));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Database connection
mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    serverSelectionTimeoutMS: 30000, // Increase timeout to 30 seconds
    socketTimeoutMS: 45000, // Socket timeout
    family: 4, // Use IPv4, skip trying IPv6
    retryWrites: true,
    maxPoolSize: 10, // Maintain up to 10 socket connections
  })
  .then(() => console.log("✅ MongoDB Connected"))
  .catch((err) => console.error("❌ MongoDB Connection Error:", err));

// Add MongoDB connection monitoring 
mongoose.connection.on('disconnected', () => {
  console.log('❌ MongoDB disconnected');
  // Attempt to reconnect
  mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    serverSelectionTimeoutMS: 30000,
    socketTimeoutMS: 45000,
    family: 4,
    retryWrites: true,
    maxPoolSize: 10,
  }).catch(err => console.error('Failed to reconnect to MongoDB:', err));
});

mongoose.connection.on('error', (err) => {
  console.error('MongoDB connection error:', err);
});

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/auctions", auctionRoutes);
app.use("/api/bids", bidRoutes);
app.use("/api/users", userRoutes);
app.use("/api/contact", contactRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/watchlist", watchlistRoutes);

// Serve uploads folder
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Global error handling middleware
app.use((err, req, res, next) => {
  console.error('Global error handler:', err);
  
  // Handle multer errors
  if (err.name === 'MulterError') {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'File too large. Maximum size is 2MB.' });
    }
    return res.status(400).json({ error: `Upload error: ${err.message}` });
  }
  
  // Handle validation errors
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map(val => val.message);
    return res.status(400).json({ error: messages.join(', ') });
  }
  
  // Handle duplicate key errors
  if (err.code === 11000) {
    return res.status(409).json({ error: 'A record with this information already exists' });
  }
  
  // Default error response
  res.status(500).json({ error: 'Server error. Please try again later.' });
});

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

// Admin route to fix auctions with missing seller field
app.get("/api/admin/fix-auctions", async (req, res) => {
  try {
    // Check if database is connected
    if (mongoose.connection.readyState !== 1) {
      return res.status(500).json({ 
        success: false, 
        message: 'Database not connected' 
      });
    }
    
    // Find an admin user to set as default seller
    let defaultSeller = await User.findOne({ role: 'admin' });
    
    // If no admin user is found, use the first user available
    if (!defaultSeller) {
      defaultSeller = await User.findOne();
      
      if (!defaultSeller) {
        return res.status(404).json({ 
          success: false, 
          message: 'No users found to use as default seller' 
        });
      }
    }

    // Find all auctions without a seller
    const auctionsQuery = { seller: { $exists: false } };
    const auctionsCount = await Auction.countDocuments(auctionsQuery);
    
    if (auctionsCount === 0) {
      return res.json({ 
        success: true, 
        message: 'No auctions need fixing',
        fixedCount: 0
      });
    }

    // Update all auctions without a seller
    const result = await Auction.updateMany(
      auctionsQuery,
      { $set: { seller: defaultSeller._id } }
    );

    return res.json({ 
      success: true, 
      message: `Fixed ${result.modifiedCount} auctions by setting default seller`,
      seller: {
        id: defaultSeller._id,
        name: defaultSeller.name || defaultSeller.email
      },
      fixedCount: result.modifiedCount
    });
  } catch (error) {
    console.error('Error fixing auctions:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Server error while fixing auctions',
      error: error.message
    });
  }
});

// Start server
const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});

// Auto declare winner every 1 minute using the imported declareWinners function
setInterval(async () => {
  try {
    // Check if database is connected first
    if (mongoose.connection.readyState !== 1) {
      console.log('⚠️ Database not connected, skipping winner declaration');
      return;
    }
    
    // Call the declareWinners function
    await declareWinners();
  } catch (error) {
    console.error("❌ Error declaring winners:", error);
  }
}, 60 * 1000); // Run every 1 minute
