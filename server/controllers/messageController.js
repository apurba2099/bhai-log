// controllers/messageController.js — Send, fetch, delete messages
const Message = require("../models/Message");
const Conversation = require("../models/Conversation");
const mongoose = require("mongoose");
const fs = require("fs");
const path = require("path");

// Helper: find or create a conversation between two users
const getOrCreateConversation = async (userA, userB) => {
  // Self-chat: both participants are the same user
  const participants = userA.toString() === userB.toString()
    ? [userA]
    : [userA, userB];

  let conv = await Conversation.findOne({ participants: { $all: participants, $size: participants.length } });
  if (!conv) conv = await Conversation.create({ participants }); // Create if not exists
  return conv;
};

// @route GET /api/messages/:friendId — Get messages in a conversation
const getMessages = async (req, res) => {
  const { friendId } = req.params;
  const myId = req.user._id;

  const isSelf = friendId === myId.toString(); // Check if self-chat (Locker)
  const participants = isSelf ? [myId] : [myId, new mongoose.Types.ObjectId(friendId)];

  const conv = await Conversation.findOne({
    participants: { $all: participants, $size: participants.length },
  });

  if (!conv) return res.json([]); // No conversation yet

  // Fetch messages, exclude those deleted for this user
  const messages = await Message.find({
    conversationId: conv._id,
    deletedFor: { $nin: [myId] }, // Not in deletedFor array for current user
  }).sort({ createdAt: 1 }); // Chronological order

  // Mark unread messages as seen
  await Message.updateMany(
    { conversationId: conv._id, sender: { $ne: myId }, status: { $ne: "seen" } },
    { $set: { status: "seen" } }
  );

  // Reset unread count for this user
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

  // Determine file details if file was uploaded
  let fileUrl = "", fileType = "none", fileName = "";
  if (req.file) {
    fileUrl = `uploads/${req.file.filename}`;
    fileName = req.file.originalname;
    const mime = req.file.mimetype;
    if (mime.startsWith("image/")) fileType = "image";
    else if (mime.startsWith("video/")) fileType = "video";
    else if (mime === "application/pdf") fileType = "pdf";
    else if (mime === "text/plain") fileType = "text";
  }

  const message = await Message.create({
    conversationId: conv._id,
    sender: myId,
    text: text || "",
    fileUrl,
    fileType,
    fileName,
    status: "sent", // Initial status
  });

  // Update last message reference on conversation
  conv.lastMessage = message._id;

  // Increment unread count for the recipient
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

  // Add current user to deletedFor array
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

  // Only sender can delete for everyone
  if (message.sender.toString() !== req.user._id.toString())
    return res.status(403).json({ message: "Not authorized" });

  // Permanently delete the file from disk if one exists
  if (message.fileUrl) {
    const filePath = path.join(__dirname, "../", message.fileUrl);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath); // Remove from uploads/
  }

  message.deletedForEveryone = true; // Mark globally deleted
  message.text = "";
  message.fileUrl = "";   // Clear path from DB
  message.fileType = "none";
  message.fileName = "";
  await message.save();

  res.json(message);
};

// @route GET /api/messages/conversations — List all conversations for sidebar
const getConversations = async (req, res) => {
  const myId = req.user._id;

  const conversations = await Conversation.find({ participants: myId })
    .populate("participants", "fullName userId profilePic isOnline lastSeen")
    .populate("lastMessage")
    .sort({ updatedAt: -1 }); // Most recent first

  // Attach unread count for current user to each conversation
  const result = conversations.map((conv) => ({
    ...conv.toObject(),
    myUnread: conv.unreadCount.get(myId.toString()) || 0,
  }));

  res.json(result);
};

module.exports = { getMessages, sendMessage, deleteForMe, deleteForEveryone, getConversations };
