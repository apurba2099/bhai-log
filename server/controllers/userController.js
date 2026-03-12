// controllers/userController.js — Profile, friends, search
const User = require("../models/User");
const Conversation = require("../models/Conversation");
const Message = require("../models/Message");
const cloudinary = require("../config/cloudinary");

// Helper: extract Cloudinary public_id from full URL for deletion
// e.g. "https://res.cloudinary.com/demo/image/upload/v123/bhailog/images/photo.jpg"
// →    "bhailog/images/photo"
const getPublicId = (url) => {
  if (!url) return null;
  try {
    const parts = url.split("/upload/");
    const afterUpload = parts[1];
    const withoutVersion = afterUpload.replace(/^v\d+\//, "");
    const withoutExt = withoutVersion.replace(/\.[^/.]+$/, "");
    return withoutExt;
  } catch { return null; }
};

// @route GET /api/users/search?q=userId
const searchUsers = async (req, res) => {
  const { q } = req.query;
  if (!q) return res.status(400).json({ message: "Query required" });
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
  if (req.body.about !== undefined) user.about = req.body.about;
  await user.save();
  res.json({ about: user.about });
};

// @route POST /api/users/upload-dp — Upload profile picture to Cloudinary
const uploadDP = async (req, res) => {
  const user = await User.findById(req.user._id);

  // Delete old DP from Cloudinary if exists
  if (user.profilePic) {
    const publicId = getPublicId(user.profilePic);
    if (publicId) await cloudinary.uploader.destroy(publicId);
  }

  // req.file.path is the full Cloudinary URL set by multer-storage-cloudinary
  user.profilePic = req.file.path;
  await user.save();
  res.json({ profilePic: user.profilePic });
};

// @route DELETE /api/users/remove-dp — Remove profile picture
const removeDP = async (req, res) => {
  const user = await User.findById(req.user._id);
  if (user.profilePic) {
    const publicId = getPublicId(user.profilePic);
    if (publicId) await cloudinary.uploader.destroy(publicId);
  }
  user.profilePic = "";
  await user.save();
  res.json({ profilePic: "" });
};

// @route POST /api/users/friend-request/:id
const sendFriendRequest = async (req, res) => {
  const toUser = await User.findById(req.params.id);
  const fromUser = await User.findById(req.user._id);
  if (!toUser) return res.status(404).json({ message: "User not found" });
  if (toUser.friendRequests.includes(fromUser._id))
    return res.status(400).json({ message: "Request already sent" });
  if (toUser.friends.includes(fromUser._id))
    return res.status(400).json({ message: "Already friends" });
  toUser.friendRequests.push(fromUser._id);
  fromUser.sentRequests.push(toUser._id);
  await toUser.save();
  await fromUser.save();
  res.json({ message: "Friend request sent" });
};

// @route POST /api/users/accept-request/:id
const acceptFriendRequest = async (req, res) => {
  const fromUser = await User.findById(req.params.id);
  const toUser = await User.findById(req.user._id);
  toUser.friends.push(fromUser._id);
  fromUser.friends.push(toUser._id);
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

// @route POST /api/users/decline-request/:id
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

// @route DELETE /api/users/remove-friend/:id
const removeFriend = async (req, res) => {
  const user = await User.findById(req.user._id);
  const friend = await User.findById(req.params.id);
  user.friends = user.friends.filter((id) => id.toString() !== friend._id.toString());
  friend.friends = friend.friends.filter((id) => id.toString() !== user._id.toString());
  await user.save();
  await friend.save();
  res.json({ message: "Friend removed" });
};

// @route GET /api/users/friends
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

// @route GET /api/users/:id
const getUserById = async (req, res) => {
  const user = await User.findById(req.params.id).select(
    "fullName userId profilePic about isOnline lastSeen createdAt"
  );
  if (!user) return res.status(404).json({ message: "User not found" });
  res.json(user);
};

// @route DELETE /api/users/delete-account
const deleteAccount = async (req, res) => {
  const userId = req.user._id;

  // Delete all message files from Cloudinary
  const messagesWithFiles = await Message.find({ sender: userId, fileUrl: { $ne: "" } });
  for (const msg of messagesWithFiles) {
    const publicId = getPublicId(msg.fileUrl);
    if (publicId) await cloudinary.uploader.destroy(publicId, { resource_type: "auto" });
  }

  await Message.deleteMany({ sender: userId });
  await Conversation.deleteMany({ participants: userId });
  await User.updateMany(
    { friends: userId },
    { $pull: { friends: userId, friendRequests: userId, sentRequests: userId } }
  );

  // Delete profile picture from Cloudinary
  const user = await User.findById(userId);
  if (user?.profilePic) {
    const publicId = getPublicId(user.profilePic);
    if (publicId) await cloudinary.uploader.destroy(publicId);
  }

  await User.findByIdAndDelete(userId);
  res.json({ message: "Account deleted successfully" });
};

module.exports = {
  searchUsers, getProfile, updateProfile, uploadDP, removeDP,
  sendFriendRequest, acceptFriendRequest, declineFriendRequest,
  removeFriend, getFriends, getUserById, deleteAccount,
};