require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const passport = require("passport");
const session = require("express-session");
const cors = require("cors");

require("./config/passport");

const app = express();

app.use(cors({
  origin: "http://localhost:3000",
  credentials: true
}));

app.use(session({
  secret: "campusconnectsecret",
  resave: false,
  saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());

mongoose.connect("mongodb://127.0.0.1:27017/campus-connect")
  .then(() => console.log("MongoDB Connected"));

app.use("/auth", require("./routes/auth"));
app.use("/api", require("./routes/user"));

app.listen(5000, () => {
  console.log("Server running on http://localhost:5000");
});
