const mongoose = require("mongoose");

const meetingSchema = new mongoose.Schema({
  club: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Club",
    required: true
  },
  title: {
    type: String,
    required: true
  },
  description: {
    type: String
  },
  date: {
    type: Date,
    required: true
  },
  startTime: String,
  endTime: String,
  location: {
    type: String,
    required: true
  },
  qrCode: String, // QR data for scanning
  qrImage: String, // Base64 QR image for frontend display
  status: {
    type: String,
    enum: ["scheduled", "ongoing", "completed", "cancelled"],
    default: "scheduled"
  },
  attendances: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "MeetingAttendance"
  }],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  }
}, { timestamps: true });

module.exports = mongoose.model("Meeting", meetingSchema);

