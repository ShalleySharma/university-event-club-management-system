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

app.use(express.json());

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

// Microsoft OAuth callback route
app.get("/auth/microsoft/callback",
  passport.authenticate("microsoft", { failureRedirect: "http://localhost:3000?error=auth_failed" }),
  async (req, res) => {
    try {
      const user = req.user;
      const token = jwt.sign(
        { id: user._id, role: user.role },
        process.env.JWT_SECRET || "your-secret-key",
        { expiresIn: "1d" }
      );

      // Redirect to frontend with token
      res.redirect(`http://localhost:3000/auth/success?token=${token}&role=${user.role}`);
    } catch (err) {
      console.error("Callback error:", err);
      res.redirect("http://localhost:3000?error=auth_failed");
    }
  }
);

app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api", require("./routes/userRoutes"));
app.use("/api/clubs", require("./routes/clubRoutes"));

app.listen(5000, () => {
  console.log("Server running on http://localhost:5000");
});
