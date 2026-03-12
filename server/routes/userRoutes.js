// routes/userRoutes.js
const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const { upload } = require("../utils/multer");
const {
  searchUsers, getProfile, updateProfile, uploadDP, removeDP,
  sendFriendRequest, acceptFriendRequest, declineFriendRequest,
  removeFriend, getFriends, getUserById, deleteAccount,
} = require("../controllers/userController");

router.get("/search", protect, searchUsers);                    // Search by userId
router.get("/profile", protect, getProfile);                   // Own profile
router.put("/profile", protect, updateProfile);                // Update about
router.post("/upload-dp", protect, upload.single("profilePic"), uploadDP); // Upload DP
router.delete("/remove-dp", protect, removeDP);                // Remove DP
router.get("/friends", protect, getFriends);                   // Friends + requests
router.post("/friend-request/:id", protect, sendFriendRequest);
router.post("/accept-request/:id", protect, acceptFriendRequest);
router.post("/decline-request/:id", protect, declineFriendRequest);
router.delete("/remove-friend/:id", protect, removeFriend);
router.delete("/delete-account", protect, deleteAccount);
router.get("/:id", protect, getUserById);                      // Public profile

module.exports = router;
