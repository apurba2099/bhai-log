// utils/multer.js — Multer + Cloudinary storage
const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("../config/cloudinary");

const storage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => {
    let folder = "bhailog/files";
    let resource_type = "auto";

    if (file.mimetype.startsWith("image/"))       folder = "bhailog/images";
    else if (file.mimetype.startsWith("video/"))  folder = "bhailog/videos";
    else if (file.mimetype === "application/pdf") folder = "bhailog/pdfs";
    else if (file.mimetype === "text/plain")      folder = "bhailog/texts";

    return { folder, resource_type, use_filename: true, unique_filename: true };
  },
});

const fileFilter = (req, file, cb) => {
  const allowed = [
    "image/jpeg", "image/png", "image/gif", "image/webp",
    "video/mp4", "video/webm",
    "application/pdf", "text/plain",
  ];
  allowed.includes(file.mimetype) ? cb(null, true) : cb(new Error("Unsupported file type"), false);
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
});

module.exports = { upload, cloudinary };
