// middleware/authMiddleware.js — Verifies JWT on protected routes
const jwt = require("jsonwebtoken");
const User = require("../models/User");

const protect = async (req, res, next) => {
  let token;

  // Check Authorization header for Bearer token
  if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
    try {
      token = req.headers.authorization.split(" ")[1]; // Extract token after "Bearer"
      const decoded = jwt.verify(token, process.env.JWT_SECRET); // Verify with secret
      req.user = await User.findById(decoded.id).select("-password -petName"); // Attach user to request
      next(); // Proceed to route handler
    } catch (error) {
      return res.status(401).json({ message: "Not authorized, token failed" });
    }
  }

  if (!token) {
    return res.status(401).json({ message: "Not authorized, no token" });
  }
};

module.exports = { protect };
