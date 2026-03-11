// utils/multer.js — Multer config for handling file uploads
const multer = require("multer");
const path = require("path");

// Store files in /uploads with original name + timestamp
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, "../uploads")); // Save to uploads folder
  },
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${file.originalname.replace(/\s+/g, "_")}`; // Remove spaces
    cb(null, uniqueName);
  },
});

// File type filter — allow images, videos, PDFs, text files
const fileFilter = (req, file, cb) => {
  const allowed = ["image/jpeg", "image/png", "image/gif", "image/webp",
                   "video/mp4", "video/webm",
                   "application/pdf", "text/plain"];
  if (allowed.includes(file.mimetype)) {
    cb(null, true); // Accept file
  } else {
    cb(new Error("Unsupported file type"), false); // Reject file
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max per file
});

module.exports = upload;
