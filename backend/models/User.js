const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  microsoftId: { type: String, required: false },
  name: String,
  email: { type: String, required: true, unique: true },
  password: { type: String, required: false },
  provider: { type: String, default: "microsoft" },
  role: {
    type: String,
    enum: ["student", "teacher", "club_head", "coordinator", "admin"],
    default: "student"
  },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("User", userSchema);
