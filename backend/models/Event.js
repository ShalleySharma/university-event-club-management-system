const mongoose = require("mongoose");

const eventSchema = new mongoose.Schema({
  eventName: { type: String, required: true },
  clubId: { type: mongoose.Schema.Types.ObjectId, ref: "Club", required: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  date: { type: String, required: true },
  time: { type: String, required: true },
  location: { type: String, required: true },
  description: { type: String, required: true },
  maxParticipants: { type: Number, default: 0 },
  poster: { type: String, default: "" },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Event", eventSchema);

