// routes/authRoutes.js
const express = require("express");
const router = express.Router();
const { register, login, verifySecret, resetPassword } = require("../controllers/authController");

router.post("/register", register);
router.post("/login", login);
router.post("/forgot-password", verifySecret);   // Verify userId + petName
router.post("/reset-password", resetPassword);   // Set new password

module.exports = router;
