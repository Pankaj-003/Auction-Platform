import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import authRoutes from "./routes/authRoutes.js";
import auctionRoutes from "./routes/auctionRoutes.js";

dotenv.config();

const app = express();

// Increase JSON payload limit
app.use(express.json({ limit: "10mb" })); // Increase to 10MB or as needed
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

app.use(cors({ origin: "http://localhost:5173", credentials: true }));

mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => console.log("✅ MongoDB Connected"))
  .catch(err => console.error("❌ MongoDB Connection Error:", err));

app.use("/api/auth", authRoutes);
app.use("/api/auctions", auctionRoutes);

const PORT = process.env.PORT || 8000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
