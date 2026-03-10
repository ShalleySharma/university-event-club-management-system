const mongoose = require("mongoose");

const registrationSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  eventId: { type: mongoose.Schema.Types.ObjectId, ref: "Event", required: true },
  registeredAt: { type: Date, default: Date.now },
  
  // Payment Details
  paymentStatus: { 
    type: String, 
    enum: ["pending", "approved", "rejected", "not_required"], 
    default: "not_required" 
  },
  transactionId: { type: String, default: "" },
  paymentScreenshot: { type: String, default: "" },
  paymentVerifiedAt: { type: Date },
  verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  
  // Registration Status
  status: { 
    type: String, 
    enum: ["registered", "cancelled"], 
    default: "registered" 
  }
});

// Prevent duplicate registrations
registrationSchema.index({ studentId: 1, eventId: 1 }, { unique: true });

module.exports = mongoose.model("Registration", registrationSchema);

