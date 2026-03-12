// server.js — Express + Socket.io entry point
require("dotenv").config();
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");

const connectDB = require("./config/db");
const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const messageRoutes = require("./routes/messageRoutes");
const errorHandler = require("./middleware/errorHandler");
const { initSocket } = require("./socket/socketManager");

connectDB();

const app = express();
const httpServer = http.createServer(app);

const allowedOrigin = process.env.CLIENT_URL
  ? process.env.CLIENT_URL.replace(/\/$/, "") // strip trailing slash
  : true;

const io = new Server(httpServer, {
  cors: {
    origin: allowedOrigin,
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  },
});

app.use(
  cors({
    origin: allowedOrigin,
    credentials: true,
  }),
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get("/health", (req, res) => res.json({ status: "ok" }));

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/messages", messageRoutes);

app.use(errorHandler);

initSocket(io);

const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
});
