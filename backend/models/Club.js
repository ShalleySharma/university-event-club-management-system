const mongoose = require("mongoose");

const clubSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true
  },
  description: {
    type: String,
    required: true
  },
  category: {
    type: String,
    required: false,
    default: "General"
  },
  logo: {
    type: String,
    required: false
  },
  // Teacher Coordinator (usually the logged-in teacher)
  coordinator: {
    name: { type: String, required: false },
    email: { type: String, required: false }
  },
  // Convener (Student Leader) - will get club_head role
  convener: {
    name: { type: String, required: false },
    email: { type: String, required: false }
  },
  // Co-convener - will get coordinator role
  coConvener: {
    name: { type: String, required: false },
    email: { type: String, required: false }
  },
  // Meeting Details
  meetingDay: {
    type: String,
    required: false
  },
  meetingTime: {
    type: String,
    required: false
  },
  meetingLocation: {
    type: String,
    required: false
  },
  // Membership Settings
  maxMembers: {
    type: Number,
    required: false,
    default: 50
  },
  joinType: {
    type: String,
    enum: ["open", "approval"],
    default: "approval"
  },
  // Contact Details
  clubEmail: {
    type: String,
    required: false
  },
  facultyCoordinator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: false
  },
  eventsCount: {
    type: Number,
    default: 0
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  status: {
    type: String,
    enum: ["pending", "approved", "rejected"],
    default: "pending"
  },
  members: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  }],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model("Club", clubSchema);
