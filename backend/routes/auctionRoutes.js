import express from "express";
import Auction from "../models/Auction.js"; // ✅ Import the Auction model

const router = express.Router();

// Create a new auction item
router.post("/add", async (req, res) => {
  try {
    const { title, description, image, startingBid, duration } = req.body;

    if (!title || !description || !image || !startingBid || !duration) {
      return res.status(400).json({ error: "All fields are required" });
    }

    const endTime = new Date().getTime() + duration * 60 * 1000;

    const newAuction = new Auction({
      title,
      description,
      image,
      startingBid,
      endTime,
    });

    await newAuction.save();
    res.status(201).json({ message: "Auction added successfully", auction: newAuction });
  } catch (error) {
    console.error("Error adding auction:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// Retrieve all auction items
router.get("/", async (req, res) => {
  try {
    const auctions = await Auction.find();
    res.json(auctions);
  } catch (error) {
    console.error("Error retrieving auctions:", error);
    res.status(500).json({ error: "Server error" });
  }
});

export default router;
