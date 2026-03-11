// models/Message.js — Mongoose schema for chat messages
const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema(
  {
    conversationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Conversation",
      required: true,
    },
    sender: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }, // Who sent it
    text: { type: String, default: "" },           // Text content
    fileUrl: { type: String, default: "" },        // Uploaded file path
    fileType: {
      type: String,
      enum: ["image", "video", "pdf", "text", "none"],
      default: "none",
    },
    fileName: { type: String, default: "" },       // Original file name

    // Delivery/seen status
    status: {
      type: String,
      enum: ["sent", "delivered", "seen"],
      default: "sent",
    },

    // Deletion flags
    deletedForEveryone: { type: Boolean, default: false }, // Deleted for both parties
    deletedFor: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }], // Deleted only for these users
  },
  { timestamps: true } // createdAt used as send time
);

module.exports = mongoose.model("Message", messageSchema);
