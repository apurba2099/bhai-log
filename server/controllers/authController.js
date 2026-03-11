// controllers/authController.js — Handles register, login, forgot password
const User = require("../models/User");
const generateToken = require("../utils/generateToken");

// Helper: build safe user response object (includes createdAt for "Joined" display)
const userResponse = (user, token) => ({
  _id: user._id,
  fullName: user.fullName,
  userId: user.userId,
  profilePic: user.profilePic,
  about: user.about,
  createdAt: user.createdAt, // Required for "Joined date" in profile
  token,
});

// @route POST /api/auth/register
const register = async (req, res) => {
  const { fullName, userId, password, confirmPassword, petName } = req.body;

  if (!fullName || !userId || !password || !confirmPassword || !petName)
    return res.status(400).json({ message: "All fields are required" });

  if (password !== confirmPassword)
    return res.status(400).json({ message: "Passwords do not match" });

  const exists = await User.findOne({ userId });
  if (exists) return res.status(400).json({ message: "UserID already taken" });

  const user = await User.create({ fullName, userId, password, petName });
  res.status(201).json(userResponse(user, generateToken(user._id)));
};

// @route POST /api/auth/login
const login = async (req, res) => {
  const { userId, password } = req.body;

  const user = await User.findOne({ userId });
  if (!user) return res.status(401).json({ message: "Invalid credentials" });

  const isMatch = await user.matchPassword(password);
  if (!isMatch) return res.status(401).json({ message: "Invalid credentials" });

  res.json(userResponse(user, generateToken(user._id)));
};

// @route POST /api/auth/forgot-password — Step 1: verify userId + petName
const verifySecret = async (req, res) => {
  const { userId, petName } = req.body;
  const user = await User.findOne({ userId });
  if (!user) return res.status(404).json({ message: "User not found" });

  const match = await user.matchPetName(petName);
  if (!match) return res.status(401).json({ message: "Incorrect answer" });

  res.json({ verified: true, userId });
};

// @route POST /api/auth/reset-password — Step 2: set new password
const resetPassword = async (req, res) => {
  const { userId, newPassword, confirmPassword } = req.body;

  if (newPassword !== confirmPassword)
    return res.status(400).json({ message: "Passwords do not match" });

  const user = await User.findOne({ userId });
  if (!user) return res.status(404).json({ message: "User not found" });

  user.password = newPassword; // Pre-save hook will hash it
  await user.save();

  res.json({ message: "Password reset successful" });
};

module.exports = { register, login, verifySecret, resetPassword };
