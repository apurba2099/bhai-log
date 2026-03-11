// socket/socketManager.js — All real-time Socket.io event handling
const User = require("../models/User");
const Message = require("../models/Message");
const Conversation = require("../models/Conversation");

// Map of userId (MongoDB _id string) → socket.id for online tracking
const onlineUsers = new Map();

const initSocket = (io) => {
  io.on("connection", (socket) => {
    console.log("Socket connected:", socket.id);

    // ── EVENT: user:online ──────────────────────────────────────────────
    // Fired when a user logs in or opens the app
    socket.on("user:online", async (userId) => {
      onlineUsers.set(userId, socket.id); // Track socket for this user
      socket.userId = userId;             // Attach userId to socket for disconnect

      // Update DB online status
      await User.findByIdAndUpdate(userId, { isOnline: true });

      // Broadcast to all connected clients that this user is online
      io.emit("user:statusChange", { userId, isOnline: true });
    });

    // ── EVENT: message:send ─────────────────────────────────────────────
    // Fired after REST API saves the message — for real-time delivery
    socket.on("message:send", async ({ message, recipientId }) => {
      const recipientSocketId = onlineUsers.get(recipientId);

      if (recipientSocketId) {
        // Recipient is online — deliver immediately and mark as delivered
        io.to(recipientSocketId).emit("message:receive", message);

        // Update message status to "delivered"
        await Message.findByIdAndUpdate(message._id, { status: "delivered" });

        // Notify sender of delivery
        socket.emit("message:statusUpdate", { messageId: message._id, status: "delivered" });

        // Send unread badge update to recipient
        const conv = await Conversation.findById(message.conversationId);
        const unread = conv?.unreadCount?.get(recipientId) || 0;
        io.to(recipientSocketId).emit("notification:unread", {
          conversationId: message.conversationId,
          senderId: message.sender,
          count: unread,
        });
      }
      // If offline: stays as "sent" (single tick) until they come online
    });

    // ── EVENT: message:seen ─────────────────────────────────────────────
    // Fired when recipient opens the conversation and sees messages
    socket.on("message:seen", async ({ conversationId, senderId }) => {
      // Update all unseen messages in this conversation to "seen"
      await Message.updateMany(
        { conversationId, sender: senderId, status: { $ne: "seen" } },
        { $set: { status: "seen" } }
      );

      // Reset unread count for the viewer
      const conv = await Conversation.findById(conversationId);
      if (conv) {
        conv.unreadCount.set(socket.userId, 0);
        await conv.save();
      }

      const senderSocketId = onlineUsers.get(senderId);
      if (senderSocketId) {
        // Notify sender their messages were seen (blue ticks)
        io.to(senderSocketId).emit("message:allSeen", { conversationId });
      }
    });

    // ── EVENT: message:deleteForEveryone ────────────────────────────────
    // Fired after REST call to update UI for recipient
    socket.on("message:deleteForEveryone", ({ messageId, recipientId, conversationId }) => {
      const recipientSocketId = onlineUsers.get(recipientId);
      if (recipientSocketId) {
        io.to(recipientSocketId).emit("message:deleted", { messageId, conversationId });
      }
    });

    // ── EVENT: friend:requestSent ────────────────────────────────────────
    // Notify recipient of new friend request in real time
    socket.on("friend:requestSent", ({ toUserId, fromUser }) => {
      const toSocketId = onlineUsers.get(toUserId);
      if (toSocketId) {
        io.to(toSocketId).emit("friend:newRequest", fromUser);
      }
    });

    // ── EVENT: friend:requestAccepted ───────────────────────────────────
    // Notify sender that request was accepted
    socket.on("friend:requestAccepted", ({ toUserId, byUser }) => {
      const toSocketId = onlineUsers.get(toUserId);
      if (toSocketId) {
        io.to(toSocketId).emit("friend:accepted", byUser);
      }
    });

    // ── EVENT: account:deleted ──────────────────────────────────────────
    // Broadcast to all friends that this account no longer exists
    socket.on("account:deleted", ({ friendIds }) => {
      friendIds.forEach((friendId) => {
        const friendSocketId = onlineUsers.get(friendId);
        if (friendSocketId) {
          io.to(friendSocketId).emit("friend:accountDeleted", { userId: socket.userId });
        }
      });
    });

    // ── EVENT: disconnect ───────────────────────────────────────────────
    socket.on("disconnect", async () => {
      const userId = socket.userId;
      if (userId) {
        onlineUsers.delete(userId); // Remove from online map
        const lastSeen = new Date();
        await User.findByIdAndUpdate(userId, { isOnline: false, lastSeen }); // Update DB
        io.emit("user:statusChange", { userId, isOnline: false, lastSeen }); // Broadcast
      }
      console.log("Socket disconnected:", socket.id);
    });
  });
};

// Helper to get a user's socket ID (used externally if needed)
const getSocketId = (userId) => onlineUsers.get(userId);

module.exports = { initSocket, getSocketId };
