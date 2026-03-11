// server.js — Express + Socket.io entry point
require("dotenv").config();
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const path = require("path");
const fs = require("fs");

const connectDB = require("./config/db");
const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const messageRoutes = require("./routes/messageRoutes");
const errorHandler = require("./middleware/errorHandler");
const { initSocket } = require("./socket/socketManager");

connectDB();

// Ensure uploads directory exists on startup
const uploadsDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  console.log("Created uploads directory");
}

const app = express();
const httpServer = http.createServer(app);

// Socket.io — allow all origins in dev, restrict in production
const io = new Server(httpServer, {
  cors: {
    origin: process.env.NODE_ENV === "production" ? process.env.CLIENT_URL : true,
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  },
});

// CORS for REST API — allow all in dev
app.use(cors({
  origin: process.env.NODE_ENV === "production" ? process.env.CLIENT_URL : true,
  credentials: true,
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files — accessible at /uploads/filename
// e.g. http://SERVER:5000/uploads/1234-photo.jpg
app.use("/uploads", express.static(uploadsDir));

// Health check endpoint (useful for debugging)
app.get("/health", (req, res) => res.json({ status: "ok", uploads: uploadsDir }));

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/messages", messageRoutes);

app.use(errorHandler);

initSocket(io);

const PORT = process.env.PORT || 5000;
// Listen on 0.0.0.0 so it's accessible on LAN (mobile devices)
httpServer.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on http://0.0.0.0:${PORT}`);
  console.log(`Uploads served from: ${uploadsDir}`);
});
