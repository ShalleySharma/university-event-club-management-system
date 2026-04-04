const mongoose = require("mongoose");

const meetingAttendanceSchema = new mongoose.Schema({
  meeting: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Meeting",
    required: true
  },
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  status: {
    type: String,
    enum: ["pending", "scanned", "approved", "rejected"],
    default: "pending"
  },
  scannedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User" // Coordinator #1 who scanned/shown QR
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User" // Coordinator #2 who approved
  },
  scanTime: {
    type: Date
  },
  approveTime: {
    type: Date
  }
}, { timestamps: true });

module.exports = mongoose.model("MeetingAttendance", meetingAttendanceSchema);

