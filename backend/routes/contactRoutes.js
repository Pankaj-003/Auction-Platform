import express from "express";
import ContactMessage from "../models/contact.js";

const router = express.Router();

router.post("/", async (req, res) => {
  try {
    const { name, email, message } = req.body;
    const newMessage = new ContactMessage({ name, email, message });
    await newMessage.save();
    res.status(200).json({ message: "Message sent successfully" });
  } catch (error) {
    console.error("Error saving contact message:", error);
    res.status(500).json({ error: "Server error" });
  }
});

export default router;
