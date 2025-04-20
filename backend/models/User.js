import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['buyer', 'seller', 'unset'], default: 'unset' },
  profilePic: { type: String, default: '' }, // Optional, default empty string
  roleSelected: { type: Boolean, default: false }, // Track if user has selected a role
}, {
  timestamps: true // Add timestamps for createdAt and updatedAt
});

const User = mongoose.model('User', userSchema);

export default User;
