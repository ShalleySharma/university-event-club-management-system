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

// Debug middleware to log all requests
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  console.log("Headers:", req.headers);
  if (req.body && Object.keys(req.body).length > 0) {
    console.log("Body:", req.body);
  }
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

app.listen(5000, () => {
  console.log("Server running on http://localhost:5000");
});
