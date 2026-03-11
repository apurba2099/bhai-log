// models/Conversation.js — Tracks chat threads between two users
const mongoose = require("mongoose");

const conversationSchema = new mongoose.Schema(
  {
    participants: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }], // Exactly 2 users (or 1 for self-chat)
    lastMessage: { type: mongoose.Schema.Types.ObjectId, ref: "Message" }, // For preview in chat list
    unreadCount: {
      // Tracks unread messages per user
      type: Map,
      of: Number,
      default: {},
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Conversation", conversationSchema);
