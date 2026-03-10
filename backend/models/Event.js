const mongoose = require("mongoose");

const eventSchema = new mongoose.Schema({
  eventName: { type: String, required: true },
  clubId: { type: mongoose.Schema.Types.ObjectId, ref: "Club", required: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  
  // Basic Info
  description: { type: String, required: true },
  poster: { type: String, default: "" },
  
  // Schedule Details
  date: { type: String, required: true },
  startTime: { type: String, required: true },
  endTime: { type: String, required: false },
  
  // Event Mode
  eventMode: { 
    type: String, 
    enum: ["online", "offline"], 
    default: "offline" 
  },
  location: { type: String, required: false },
  meetingLink: { type: String, default: "" },
  
  // Fee Details
  eventType: { 
    type: String, 
    enum: ["free", "paid"], 
    default: "free" 
  },
  registrationFee: { type: Number, default: 0 },
  upiId: { type: String, default: "" },
  qrCode: { type: String, default: "" },
  
  // Participation Details
  maxParticipants: { type: Number, default: 0 },
  registrationDeadline: { type: String, default: "" },
  
  // Approval Status (NEW - for admin approval)
  approvalStatus: { 
    type: String, 
    enum: ["pending", "approved", "rejected"], 
    default: "pending" 
  },
  
  // Event Status (active, cancelled, completed)
  status: { 
    type: String, 
    enum: ["active", "cancelled", "completed"], 
    default: "active" 
  },
  
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Event", eventSchema);

