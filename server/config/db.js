// config/db.js — MongoDB connection using Mongoose

const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 5000, // timeout after 5 seconds
    });

    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error("DB Connection Error:", error.message);

    // Retry connection after 5 seconds instead of crashing server
    setTimeout(connectDB, 5000);
  }
};

// Mongo runtime error listener
mongoose.connection.on("error", (err) => {
  console.error("MongoDB runtime error:", err.message);
});

module.exports = connectDB;