// models/User.js — Mongoose schema for User
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true, trim: true },       // Display name
    userId: { type: String, required: true, unique: true, trim: true }, // Unique login ID
    password: { type: String, required: true },                   // Hashed password
    petName: { type: String, required: true },                    // Secret Q answer (hashed)
    profilePic: { type: String, default: "" },                    // Path to uploaded DP
    about: { type: String, default: "Hey there! I am using ChatApp." }, // Bio
    friends: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],   // Accepted friends
    friendRequests: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }], // Incoming requests
    sentRequests: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],   // Outgoing requests
    lastSeen: { type: Date, default: Date.now },                  // For offline timestamp
    isOnline: { type: Boolean, default: false },                  // Online status flag
  },
  { timestamps: true } // Auto adds createdAt, updatedAt
);

// Hash password before saving
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next(); // Skip if password not changed
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

// Hash petName before saving
userSchema.pre("save", async function (next) {
  if (!this.isModified("petName")) return next();
  this.petName = await bcrypt.hash(this.petName.toLowerCase(), 10);
  next();
});

// Compare plain password with hashed
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Compare plain petName with hashed
userSchema.methods.matchPetName = async function (enteredPetName) {
  return await bcrypt.compare(enteredPetName.toLowerCase(), this.petName);
};

module.exports = mongoose.model("User", userSchema);
