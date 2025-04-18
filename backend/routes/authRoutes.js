import express from "express";
import bcrypt from "bcryptjs";
import User from "../models/User.js";
import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config(); // Load environment variables

const router = express.Router();

// ✅ Nodemailer setup (secure, using .env)
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER, // from .env
    pass: process.env.EMAIL_PASS, // from .env (App Password)
  },
});

// ✅ Signup Route
router.post("/signup", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: "All fields are required" });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ name, email, password: hashedPassword });
    await user.save();

    res.status(201).json({ message: "User registered successfully", user });
  } catch (error) {
    console.error("Signup Error:", error.message);
    res.status(500).json({ error: "Server error" });
  }
});

// ✅ Login Route
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "All fields are required" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ error: "User not found. Please sign up first." });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: "Invalid credentials" });
    }

    res.status(200).json({
      message: "Login successful",
      userId: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    });
  } catch (error) {
    console.error("Login Error:", error.message);
    res.status(500).json({ error: "Server error" });
  }
});

// ✅ Forgot Password Route
router.post("/forgot-password", async (req, res) => {
  const { email } = req.body;

  try {
    if (!email) {
      return res.status(400).json({ error: "Email is required" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // (In a real app: generate a token, save to DB, and expire it)
    const resetLink = `http://localhost:3000/reset-password?email=${encodeURIComponent(email)}`;

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Password Reset Request",
      html: `
        <p>Hello ${user.name},</p>
        <p>Click the link below to reset your password:</p>
        <a href="${resetLink}">${resetLink}</a>
        <p>If you did not request a password reset, please ignore this email.</p>
      `,
    };

    await transporter.sendMail(mailOptions);

    res.status(200).json({ message: "Password reset link has been sent to your email." });
  } catch (err) {
    console.error("Forgot Password Error:", err.message);
    res.status(500).json({ error: "Failed to send reset email. Please try again later." });
  }
});

export default router;
