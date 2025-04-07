// routes/userRoutes.js
import express from 'express';
const router = express.Router();

import User from '../models/User.js';
import Bid from "../models/Bid.js"; // ✅ correct if Bid.js is in models/

router.get('/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
