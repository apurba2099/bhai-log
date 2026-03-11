// routes/messageRoutes.js
const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const upload = require("../utils/multer");
const {
  getMessages, sendMessage, deleteForMe, deleteForEveryone, getConversations,
} = require("../controllers/messageController");

router.get("/conversations", protect, getConversations);            // All conversations list
router.get("/:friendId", protect, getMessages);                    // Chat messages
router.post("/:friendId", protect, upload.single("file"), sendMessage); // Send message
router.delete("/:messageId/delete-for-me", protect, deleteForMe);
router.delete("/:messageId/delete-for-everyone", protect, deleteForEveryone);

module.exports = router;
