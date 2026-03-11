// controllers/userController.js — Profile, friends, search
const User = require("../models/User");
const Conversation = require("../models/Conversation");
const Message = require("../models/Message");
const path = require("path");
const fs = require("fs");

// @route GET /api/users/search?q=userId
const searchUsers = async (req, res) => {
  const { q } = req.query;
  if (!q) return res.status(400).json({ message: "Query required" });

  // Find users whose userId matches (case-insensitive), exclude self
  const users = await User.find({
    userId: { $regex: q, $options: "i" },
    _id: { $ne: req.user._id },
  }).select("fullName userId profilePic about isOnline lastSeen");

  res.json(users);
};

// @route GET /api/users/profile
const getProfile = async (req, res) => {
  const user = await User.findById(req.user._id).select("-password -petName");
  res.json(user);
};

// @route PUT /api/users/profile — Update about bio
const updateProfile = async (req, res) => {
  const user = await User.findById(req.user._id);
  if (req.body.about !== undefined) user.about = req.body.about; // Update bio if provided
  await user.save();
  res.json({ about: user.about });
};

// @route POST /api/users/upload-dp — Upload profile picture
const uploadDP = async (req, res) => {
  const user = await User.findById(req.user._id);

  // Delete old DP file if it exists
  if (user.profilePic) {
    const oldPath = path.join(__dirname, "../", user.profilePic);
    if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
  }

  user.profilePic = `uploads/${req.file.filename}`; // Store relative path
  await user.save();
  res.json({ profilePic: user.profilePic });
};

// @route DELETE /api/users/remove-dp — Remove profile picture
const removeDP = async (req, res) => {
  const user = await User.findById(req.user._id);
  if (user.profilePic) {
    const filePath = path.join(__dirname, "../", user.profilePic);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath); // Delete file from disk
  }
  user.profilePic = "";
  await user.save();
  res.json({ profilePic: "" });
};

// @route POST /api/users/friend-request/:id — Send friend request
const sendFriendRequest = async (req, res) => {
  const toUser = await User.findById(req.params.id);
  const fromUser = await User.findById(req.user._id);

  if (!toUser) return res.status(404).json({ message: "User not found" });
  if (toUser.friendRequests.includes(fromUser._id))
    return res.status(400).json({ message: "Request already sent" });
  if (toUser.friends.includes(fromUser._id))
    return res.status(400).json({ message: "Already friends" });

  toUser.friendRequests.push(fromUser._id);   // Add to recipient's incoming
  fromUser.sentRequests.push(toUser._id);     // Add to sender's outgoing
  await toUser.save();
  await fromUser.save();

  res.json({ message: "Friend request sent" });
};

// @route POST /api/users/accept-request/:id — Accept friend request
const acceptFriendRequest = async (req, res) => {
  const fromUser = await User.findById(req.params.id);
  const toUser = await User.findById(req.user._id);

  // Add each to the other's friends list
  toUser.friends.push(fromUser._id);
  fromUser.friends.push(toUser._id);

  // Remove from request arrays
  toUser.friendRequests = toUser.friendRequests.filter(
    (id) => id.toString() !== fromUser._id.toString()
  );
  fromUser.sentRequests = fromUser.sentRequests.filter(
    (id) => id.toString() !== toUser._id.toString()
  );

  await toUser.save();
  await fromUser.save();

  res.json({ message: "Friend request accepted" });
};

// @route POST /api/users/decline-request/:id — Decline friend request
const declineFriendRequest = async (req, res) => {
  const fromUser = await User.findById(req.params.id);
  const toUser = await User.findById(req.user._id);

  toUser.friendRequests = toUser.friendRequests.filter(
    (id) => id.toString() !== fromUser._id.toString()
  );
  fromUser.sentRequests = fromUser.sentRequests.filter(
    (id) => id.toString() !== toUser._id.toString()
  );

  await toUser.save();
  await fromUser.save();
  res.json({ message: "Request declined" });
};

// @route DELETE /api/users/remove-friend/:id — Remove a friend
const removeFriend = async (req, res) => {
  const user = await User.findById(req.user._id);
  const friend = await User.findById(req.params.id);

  user.friends = user.friends.filter((id) => id.toString() !== friend._id.toString());
  friend.friends = friend.friends.filter((id) => id.toString() !== user._id.toString());

  await user.save();
  await friend.save();
  res.json({ message: "Friend removed" });
};

// @route GET /api/users/friends — Get all friends with their info
const getFriends = async (req, res) => {
  const user = await User.findById(req.user._id)
    .populate("friends", "fullName userId profilePic about isOnline lastSeen")
    .populate("friendRequests", "fullName userId profilePic")
    .populate("sentRequests", "fullName userId profilePic");
  res.json({
    friends: user.friends,
    friendRequests: user.friendRequests,
    sentRequests: user.sentRequests,
  });
};

// @route GET /api/users/:id — Get a specific user's public profile
const getUserById = async (req, res) => {
  const user = await User.findById(req.params.id).select(
    "fullName userId profilePic about isOnline lastSeen createdAt"
  );
  if (!user) return res.status(404).json({ message: "User not found" });
  res.json(user);
};

// @route DELETE /api/users/delete-account — Delete account + all data + all files
const deleteAccount = async (req, res) => {
  const userId = req.user._id;

  // Find all messages with files sent by this user and delete from disk
  const messagesWithFiles = await Message.find({ sender: userId, fileUrl: { $ne: "" } });
  messagesWithFiles.forEach(({ fileUrl }) => {
    const filePath = path.join(__dirname, "../", fileUrl);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath); // Delete each file from uploads/
  });

  // Delete all messages sent by this user from DB
  await Message.deleteMany({ sender: userId });

  // Delete all conversations involving this user
  await Conversation.deleteMany({ participants: userId });

  // Remove user from friends lists of all other users
  await User.updateMany(
    { friends: userId },
    { $pull: { friends: userId, friendRequests: userId, sentRequests: userId } }
  );

  // Delete profile picture from disk if exists
  const user = await User.findById(userId);
  if (user?.profilePic) {
    const dpPath = path.join(__dirname, "../", user.profilePic);
    if (fs.existsSync(dpPath)) fs.unlinkSync(dpPath);
  }

  // Delete the user document
  await User.findByIdAndDelete(userId);

  res.json({ message: "Account deleted successfully" });
};

module.exports = {
  searchUsers, getProfile, updateProfile, uploadDP, removeDP,
  sendFriendRequest, acceptFriendRequest, declineFriendRequest,
  removeFriend, getFriends, getUserById, deleteAccount,
};
