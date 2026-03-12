// controllers/messageController.js — Send, fetch, delete messages
const Message = require("../models/Message");
const Conversation = require("../models/Conversation");
const mongoose = require("mongoose");
const cloudinary = require("../config/cloudinary");

// Helper: extract Cloudinary public_id from full URL for deletion
const getPublicId = (url) => {
  if (!url) return null;
  try {
    const parts = url.split("/upload/");
    const afterUpload = parts[1];
    const withoutVersion = afterUpload.replace(/^v\d+\//, "");
    const withoutExt = withoutVersion.replace(/\.[^/.]+$/, "");
    return withoutExt; // e.g. "bhailog/images/photo"
  } catch { return null; }
};

// Helper: find or create a conversation between two users
const getOrCreateConversation = async (userA, userB) => {
  const participants = userA.toString() === userB.toString()
    ? [userA]
    : [userA, userB];
  let conv = await Conversation.findOne({ participants: { $all: participants, $size: participants.length } });
  if (!conv) conv = await Conversation.create({ participants });
  return conv;
};

// @route GET /api/messages/:friendId — Get messages in a conversation
const getMessages = async (req, res) => {
  const { friendId } = req.params;
  const myId = req.user._id;

  const isSelf = friendId === myId.toString();
  const participants = isSelf ? [myId] : [myId, new mongoose.Types.ObjectId(friendId)];

  const conv = await Conversation.findOne({
    participants: { $all: participants, $size: participants.length },
  });

  if (!conv) return res.json([]);

  const messages = await Message.find({
    conversationId: conv._id,
    deletedFor: { $nin: [myId] },
  }).sort({ createdAt: 1 });

  // Mark unread messages as seen
  await Message.updateMany(
    { conversationId: conv._id, sender: { $ne: myId }, status: { $ne: "seen" } },
    { $set: { status: "seen" } }
  );

  conv.unreadCount.set(myId.toString(), 0);
  await conv.save();

  res.json(messages);
};

// @route POST /api/messages/:friendId — Send a message
const sendMessage = async (req, res) => {
  const { friendId } = req.params;
  const myId = req.user._id;
  const { text } = req.body;

  const isSelf = friendId === myId.toString();
  const conv = await getOrCreateConversation(myId, isSelf ? myId : friendId);

  // Cloudinary gives full URL in req.file.path
  let fileUrl = "", fileType = "none", fileName = "";
  if (req.file) {
    fileUrl = req.file.path;  // Full Cloudinary URL
    fileName = req.file.originalname;
    const mime = req.file.mimetype;
    if (mime.startsWith("image/"))       fileType = "image";
    else if (mime.startsWith("video/"))  fileType = "video";
    else if (mime === "application/pdf") fileType = "pdf";
    else if (mime === "text/plain")      fileType = "text";
  }

  const message = await Message.create({
    conversationId: conv._id,
    sender: myId,
    text: text || "",
    fileUrl,
    fileType,
    fileName,
    status: "sent",
  });

  conv.lastMessage = message._id;

  if (!isSelf) {
    const currentCount = conv.unreadCount.get(friendId.toString()) || 0;
    conv.unreadCount.set(friendId.toString(), currentCount + 1);
  }

  await conv.save();
  res.status(201).json(message);
};

// @route DELETE /api/messages/:messageId/delete-for-me
const deleteForMe = async (req, res) => {
  const message = await Message.findById(req.params.messageId);
  if (!message) return res.status(404).json({ message: "Message not found" });
  if (!message.deletedFor.includes(req.user._id)) {
    message.deletedFor.push(req.user._id);
  }
  await message.save();
  res.json({ message: "Deleted for you" });
};

// @route DELETE /api/messages/:messageId/delete-for-everyone
const deleteForEveryone = async (req, res) => {
  const message = await Message.findById(req.params.messageId);
  if (!message) return res.status(404).json({ message: "Message not found" });

  if (message.sender.toString() !== req.user._id.toString())
    return res.status(403).json({ message: "Not authorized" });

  // Permanently delete file from Cloudinary if exists
  if (message.fileUrl) {
    const publicId = getPublicId(message.fileUrl);
    if (publicId) {
      const resourceType = message.fileType === "video" ? "video"
                         : message.fileType === "image" ? "image"
                         : "raw";
      await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
    }
  }

  message.deletedForEveryone = true;
  message.text = "";
  message.fileUrl = "";
  message.fileType = "none";
  message.fileName = "";
  await message.save();

  res.json(message);
};

// @route GET /api/messages/conversations
const getConversations = async (req, res) => {
  const myId = req.user._id;
  const conversations = await Conversation.find({ participants: myId })
    .populate("participants", "fullName userId profilePic isOnline lastSeen")
    .populate("lastMessage")
    .sort({ updatedAt: -1 });

  const result = conversations.map((conv) => ({
    ...conv.toObject(),
    myUnread: conv.unreadCount.get(myId.toString()) || 0,
  }));

  res.json(result);
};

module.exports = { getMessages, sendMessage, deleteForMe, deleteForEveryone, getConversations };