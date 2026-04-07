require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const passport = require("passport");
const jwt = require("jsonwebtoken");
const session = require("express-session");
const bcrypt = require("bcryptjs");

// Load passport configuration (includes Microsoft Strategy)
require("./config/passport");

const app = express();

app.use(cors({
  origin: "http://localhost:3000",
  credentials: true
}));

// 🚨 BULLETPROOF DEBUG LOGGING - ALL REQUESTS
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`🚨 [${timestamp}] ${req.method} ${req.url}`);
  console.log("🔑 Auth:", req.headers.authorization?.substring(0, 50) + '...');
  console.log("📦 Body:", req.body);
  console.log("---");
  next();
});

// 🚨 SPECIFIC REGISTER ROUTE LOGGING
app.use('/api/events/:eventId/register', (req, res, next) => {
  console.log('🎯 REGISTER ROUTE HIT:', req.params.eventId);
  console.log('🎯 Full URL:', req.originalUrl);
  next();
});

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Session middleware (required for Passport)
app.use(session({
  secret: process.env.SESSION_SECRET || "your-session-secret",
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false }
}));

app.use(passport.initialize());
app.use(passport.session());

// Debug: Print tenant ID to verify env variables are loading
console.log("Tenant:", process.env.AZURE_TENANT_ID);
console.log("Client ID:", process.env.AZURE_CLIENT_ID);

mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log("MongoDB Connected"));

// Auth routes (includes /api/auth/microsoft and /api/auth/microsoft/callback)
app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api", require("./routes/userRoutes"));
app.use("/api/clubs", require("./routes/clubRoutes"));
app.use("/api/events", require("./routes/eventRoutes"));
app.use("/api/meetings", require("./routes/meetingRoutes"));

app.listen(5000, () => {
  console.log("Server running on http://localhost:5000");
});
