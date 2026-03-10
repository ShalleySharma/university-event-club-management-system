const Event = require("../models/Event");
const Registration = require("../models/Registration");
const Club = require("../models/Club");
const jwt = require("jsonwebtoken");

// Helper to get user from token
const getUserFromToken = (req) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return null;
  try {
    return jwt.verify(token, process.env.JWT_SECRET || "your-secret-key");
  } catch (err) {
    return null;
  }
};

// Create a new event
exports.createEvent = async (req, res) => {
  try {
    const user = getUserFromToken(req);
    if (!user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { 
      eventName, 
      clubId, 
      description, 
      poster,
      date, 
      startTime, 
      endTime,
      eventMode,
      location,
      meetingLink,
      eventType,
      registrationFee,
      upiId,
      qrCode,
      maxParticipants, 
      registrationDeadline 
    } = req.body;

    // Verify club exists
    const club = await Club.findById(clubId);
    if (!club) {
      return res.status(404).json({ message: "Club not found" });
    }

    // Check if user is the creator OR convener OR co-convener of the club
    const isCreator = club.createdBy?.toString() === user.id;
    const isConvener = club.convener?.email && club.convener.email.toLowerCase() === user.email?.toLowerCase();
    const isCoConvener = club.coConvener?.email && club.coConvener.email.toLowerCase() === user.email?.toLowerCase();

    if (!isCreator && !isConvener && !isCoConvener) {
      return res.status(403).json({ message: "You can only create events for your own clubs" });
    }

    const event = await Event.create({
      eventName,
      clubId,
      createdBy: user.id,
      description,
      poster: poster || "",
      date,
      startTime,
      endTime: endTime || "",
      eventMode: eventMode || "offline",
      location: location || "",
      meetingLink: meetingLink || "",
      eventType: eventType || "free",
      registrationFee: registrationFee || 0,
      upiId: upiId || "",
      qrCode: qrCode || "",
      maxParticipants: maxParticipants || 0,
      registrationDeadline: registrationDeadline || "",
      approvalStatus: "pending" // Events require admin approval
    });

    res.status(201).json({ message: "Event created successfully and awaiting admin approval", event });
  } catch (error) {
    console.error("Create Event Error:", error);
    res.status(500).json({ message: error.message });
  }
};

// Get all events for teacher (created by them)
exports.getMyEvents = async (req, res) => {
  try {
    const user = getUserFromToken(req);
    if (!user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const events = await Event.find({ createdBy: user.id })
      .populate("clubId", "name")
      .sort({ createdAt: -1 });

    // Get registration counts for each event
    const eventsWithCounts = await Promise.all(
      events.map(async (event) => {
        const registrationCount = await Registration.countDocuments({ eventId: event._id });
        return {
          ...event.toObject(),
          clubName: event.clubId?.name || "Unknown Club",
          registrationCount
        };
      })
    );

    res.json(eventsWithCounts);
  } catch (error) {
    console.error("Get My Events Error:", error);
    res.status(500).json({ message: error.message });
  }
};

// Get single event details
exports.getEventDetails = async (req, res) => {
  try {
    const { eventId } = req.params;
    const user = getUserFromToken(req);
    
    const event = await Event.findById(eventId).populate("clubId", "name");
    
    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    // Get registrations with payment details
    const registrations = await Registration.find({ eventId })
      .populate("studentId", "name email");

    res.json({
      event,
      clubName: event.clubId?.name || "Unknown Club",
      registrations: registrations.map(r => ({
        _id: r._id,
        student: r.studentId,
        registeredAt: r.registeredAt,
        paymentStatus: r.paymentStatus,
        transactionId: r.transactionId,
        paymentScreenshot: r.paymentScreenshot
      })),
      registrationCount: registrations.length
    });
  } catch (error) {
    console.error("Get Event Details Error:", error);
    res.status(500).json({ message: error.message });
  }
};

// Update event
exports.updateEvent = async (req, res) => {
  try {
    const { eventId } = req.params;
    const user = getUserFromToken(req);
    
    const event = await Event.findById(eventId);
    
    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    if (event.createdBy.toString() !== user.id) {
      return res.status(403).json({ message: "You can only update your own events" });
    }

    const { 
      eventName, 
      description, 
      poster,
      date, 
      startTime, 
      endTime,
      eventMode,
      location,
      meetingLink,
      eventType,
      registrationFee,
      upiId,
      qrCode,
      maxParticipants, 
      registrationDeadline,
      status
    } = req.body;

    // Update fields
    if (eventName) event.eventName = eventName;
    if (description) event.description = description;
    if (poster !== undefined) event.poster = poster;
    if (date) event.date = date;
    if (startTime) event.startTime = startTime;
    if (endTime !== undefined) event.endTime = endTime;
    if (eventMode) event.eventMode = eventMode;
    if (location !== undefined) event.location = location;
    if (meetingLink !== undefined) event.meetingLink = meetingLink;
    if (eventType) event.eventType = eventType;
    if (registrationFee !== undefined) event.registrationFee = registrationFee;
    if (upiId !== undefined) event.upiId = upiId;
    if (qrCode !== undefined) event.qrCode = qrCode;
    if (maxParticipants !== undefined) event.maxParticipants = maxParticipants;
    if (registrationDeadline !== undefined) event.registrationDeadline = registrationDeadline;
    if (status) event.status = status;

    await event.save();

    res.json({ message: "Event updated successfully", event });
  } catch (error) {
    console.error("Update Event Error:", error);
    res.status(500).json({ message: error.message });
  }
};

// Delete event
exports.deleteEvent = async (req, res) => {
  try {
    const { eventId } = req.params;
    const user = getUserFromToken(req);
    
    const event = await Event.findById(eventId);
    
    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    if (event.createdBy.toString() !== user.id) {
      return res.status(403).json({ message: "You can only delete your own events" });
    }

    // Delete all registrations for this event
    await Registration.deleteMany({ eventId });

    // Delete the event
    await Event.findByIdAndDelete(eventId);

    res.json({ message: "Event deleted successfully" });
  } catch (error) {
    console.error("Delete Event Error:", error);
    res.status(500).json({ message: error.message });
  }
};

// Get event participants with payment details
exports.getEventParticipants = async (req, res) => {
  try {
    const { eventId } = req.params;
    const user = getUserFromToken(req);
    
    const event = await Event.findById(eventId);
    
    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    if (event.createdBy.toString() !== user.id) {
      return res.status(403).json({ message: "Access denied" });
    }

    const registrations = await Registration.find({ eventId })
      .populate("studentId", "name email")
      .sort({ registeredAt: -1 });

    res.json({
      participants: registrations.map(r => ({
        _id: r._id,
        studentId: r.studentId._id,
        name: r.studentId.name,
        email: r.studentId.email,
        registeredAt: r.registeredAt,
        paymentStatus: r.paymentStatus,
        transactionId: r.transactionId,
        paymentScreenshot: r.paymentScreenshot,
        status: r.status
      }))
    });
  } catch (error) {
    console.error("Get Participants Error:", error);
    res.status(500).json({ message: error.message });
  }
};

// Verify payment for a registration
exports.verifyPayment = async (req, res) => {
  try {
    const { registrationId } = req.params;
    const { status } = req.body; // "approved" or "rejected"
    const user = getUserFromToken(req);
    
    if (!user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const registration = await Registration.findById(registrationId)
      .populate("eventId");
    
    if (!registration) {
      return res.status(404).json({ message: "Registration not found" });
    }

    // Verify the teacher owns the event
    if (registration.eventId.createdBy.toString() !== user.id) {
      return res.status(403).json({ message: "Access denied" });
    }

    registration.paymentStatus = status;
    registration.paymentVerifiedAt = new Date();
    registration.verifiedBy = user.id;
    await registration.save();

    res.json({ 
      message: `Payment ${status} successfully`,
      registration 
    });
  } catch (error) {
    console.error("Verify Payment Error:", error);
    res.status(500).json({ message: error.message });
  }
};

// Get event statistics
exports.getEventStats = async (req, res) => {
  try {
    const user = getUserFromToken(req);
    if (!user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const events = await Event.find({ createdBy: user.id });
    const totalEvents = events.length;

    const today = new Date();
    const upcomingEvents = events.filter(e => new Date(e.date) >= today).length;
    const pastEvents = totalEvents - upcomingEvents;

    // Get total registrations
    const eventIds = events.map(e => e._id);
    const totalRegistrations = await Registration.countDocuments({ eventId: { $in: eventIds } });

    // Get pending payments count
    const pendingPayments = await Registration.countDocuments({ 
      eventId: { $in: eventIds },
      paymentStatus: "pending"
    });

    res.json({
      totalEvents,
      upcomingEvents,
      pastEvents,
      totalRegistrations,
      pendingPayments
    });
  } catch (error) {
    console.error("Get Stats Error:", error);
    res.status(500).json({ message: error.message });
  }
};

// ============================================
// STUDENT ROUTES
// ============================================

// Get all available events for students
exports.getAllEvents = async (req, res) => {
  try {
    const user = getUserFromToken(req);
    if (!user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    // Get all approved clubs
    const approvedClubs = await Club.find({ status: "approved" }).select("_id name");
    const clubIds = approvedClubs.map(c => c._id);

    // Get active AND approved events from approved clubs
    const events = await Event.find({ 
      clubId: { $in: clubIds },
      status: "active",
      approvalStatus: "approved" // Only show approved events to students
    })
      .populate("clubId", "name")
      .sort({ date: 1 });

    // Get user's registrations
    const myRegistrations = await Registration.find({ studentId: user.id });
    const registeredEventIds = myRegistrations.map(r => r.eventId.toString());

    // Add registration status to each event
    const eventsWithStatus = await Promise.all(
      events.map(async (event) => {
        const registrationCount = await Registration.countDocuments({ eventId: event._id });
        const userReg = myRegistrations.find(r => r.eventId.toString() === event._id.toString());
        
        return {
          ...event.toObject(),
          clubName: event.clubId?.name || "Unknown Club",
          registrationCount,
          isRegistered: registeredEventIds.includes(event._id.toString()),
          registrationStatus: userReg?.status || null,
          paymentStatus: userReg?.paymentStatus || null
        };
      })
    );

    res.json(eventsWithStatus);
  } catch (error) {
    console.error("Get All Events Error:", error);
    res.status(500).json({ message: error.message });
  }
};

// Register for an event
exports.registerForEvent = async (req, res) => {
  try {
    const user = getUserFromToken(req);
    if (!user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { eventId } = req.params;
    const { transactionId, paymentScreenshot } = req.body;

    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    if (event.status !== "active") {
      return res.status(400).json({ message: "Event is not active" });
    }

    // Check if already registered
    const existingRegistration = await Registration.findOne({
      studentId: user.id,
      eventId
    });

    if (existingRegistration) {
      return res.status(400).json({ message: "You are already registered for this event" });
    }

    // Check max participants
    if (event.maxParticipants > 0) {
      const currentRegistrations = await Registration.countDocuments({ eventId });
      if (currentRegistrations >= event.maxParticipants) {
        return res.status(400).json({ message: "Event is full" });
      }
    }

    // Check registration deadline
    if (event.registrationDeadline) {
      const deadline = new Date(event.registrationDeadline);
      if (new Date() > deadline) {
        return res.status(400).json({ message: "Registration deadline has passed" });
      }
    }

    // Determine payment status
    let paymentStatus = "not_required";
    if (event.eventType === "paid") {
      paymentStatus = "pending";
    }

    const registration = await Registration.create({
      studentId: user.id,
      eventId,
      paymentStatus,
      transactionId: transactionId || "",
      paymentScreenshot: paymentScreenshot || ""
    });

    const message = event.eventType === "paid" 
      ? "Registration submitted! Payment verification pending."
      : "Successfully registered for the event!";

    res.json({ message, registration });
  } catch (error) {
    console.error("Register Event Error:", error);
    res.status(500).json({ message: error.message });
  }
};

// Get student's registered events
exports.getMyRegistrations = async (req, res) => {
  try {
    const user = getUserFromToken(req);
    if (!user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const registrations = await Registration.find({ studentId: user.id })
      .populate({
        path: "eventId",
        populate: { path: "clubId", select: "name" }
      })
      .sort({ registeredAt: -1 });

    const myEvents = registrations
      .filter(r => r.eventId)
      .map(r => ({
        _id: r.eventId._id,
        eventName: r.eventId.eventName,
        clubName: r.eventId.clubId?.name || "Unknown Club",
        date: r.eventId.date,
        startTime: r.eventId.startTime,
        endTime: r.eventId.endTime,
        location: r.eventId.location,
        meetingLink: r.eventId.meetingLink,
        eventMode: r.eventId.eventMode,
        eventType: r.eventId.eventType,
        registrationFee: r.eventId.registrationFee,
        description: r.eventId.description,
        registeredAt: r.registeredAt,
        paymentStatus: r.paymentStatus,
        transactionId: r.transactionId,
        status: r.status
      }));

    res.json(myEvents);
  } catch (error) {
    console.error("Get My Registrations Error:", error);
    res.status(500).json({ message: error.message });
  }
};

// Get student dashboard stats
exports.getStudentStats = async (req, res) => {
  try {
    const user = getUserFromToken(req);
    if (!user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    // Get joined clubs count
    const clubs = await Club.find({ members: user.id, status: "approved" });
    const joinedClubs = clubs.length;

    // Get registered events count
    const registrations = await Registration.find({ studentId: user.id })
      .populate("eventId");
    
    const registeredEvents = registrations.length;

    // Get upcoming events (from joined clubs)
    const clubIds = clubs.map(c => c._id);
    const allEvents = await Event.find({ 
      clubId: { $in: clubIds },
      status: "active"
    }).sort({ date: 1 });

    const today = new Date();
    const upcomingEvents = allEvents.filter(e => new Date(e.date) >= today).slice(0, 5);

    res.json({
      joinedClubs,
      registeredEvents,
      upcomingEvents: upcomingEvents.map(e => ({
        _id: e._id,
        eventName: e.eventName,
        date: e.date,
        startTime: e.startTime,
        location: e.location
      }))
    });
  } catch (error) {
    console.error("Get Student Stats Error:", error);
    res.status(500).json({ message: error.message });
  }
};

// ============================================
// ADMIN ROUTES
// ============================================

// Get all pending events for admin approval
exports.getPendingEvents = async (req, res) => {
  try {
    const user = getUserFromToken(req);
    if (!user || user.role !== "admin") {
      return res.status(403).json({ message: "Access denied. Admin only." });
    }

    // Get all pending events
    const events = await Event.find({ approvalStatus: "pending" })
      .populate("clubId", "name")
      .populate("createdBy", "name email")
      .sort({ createdAt: -1 });

    // Get registration counts
    const eventsWithCounts = await Promise.all(
      events.map(async (event) => {
        const registrationCount = await Registration.countDocuments({ eventId: event._id });
        return {
          ...event.toObject(),
          clubName: event.clubId?.name || "Unknown Club",
          teacherName: event.createdBy?.name || "Unknown",
          teacherEmail: event.createdBy?.email || "",
          registrationCount
        };
      })
    );

    res.json(eventsWithCounts);
  } catch (error) {
    console.error("Get Pending Events Error:", error);
    res.status(500).json({ message: error.message });
  }
};

// Approve or reject an event
exports.approveEvent = async (req, res) => {
  try {
    const user = getUserFromToken(req);
    if (!user || user.role !== "admin") {
      return res.status(403).json({ message: "Access denied. Admin only." });
    }

    const { eventId } = req.params;
    const { status } = req.body; // "approved" or "rejected"

    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    event.approvalStatus = status;
    
    // If approved, also set status to active
    if (status === "approved") {
      event.status = "active";
    }
    
    await event.save();

    res.json({ 
      message: `Event ${status} successfully`,
      event 
    });
  } catch (error) {
    console.error("Approve Event Error:", error);
    res.status(500).json({ message: error.message });
  }
};

// Get all events (for admin)
exports.getAllEventsAdmin = async (req, res) => {
  try {
    const user = getUserFromToken(req);
    if (!user || user.role !== "admin") {
      return res.status(403).json({ message: "Access denied. Admin only." });
    }

    const events = await Event.find()
      .populate("clubId", "name")
      .populate("createdBy", "name email")
      .sort({ createdAt: -1 });

    // Get registration counts
    const eventsWithCounts = await Promise.all(
      events.map(async (event) => {
        const registrationCount = await Registration.countDocuments({ eventId: event._id });
        return {
          ...event.toObject(),
          clubName: event.clubId?.name || "Unknown Club",
          teacherName: event.createdBy?.name || "Unknown",
          teacherEmail: event.createdBy?.email || "",
          registrationCount
        };
      })
    );

    res.json(eventsWithCounts);
  } catch (error) {
    console.error("Get All Events Admin Error:", error);
    res.status(500).json({ message: error.message });
  }
};

