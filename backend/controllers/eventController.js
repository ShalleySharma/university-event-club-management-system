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

    const { eventName, clubId, date, time, location, description, maxParticipants, poster } = req.body;

    // Verify club exists and user is the creator
    const club = await Club.findById(clubId);
    if (!club) {
      return res.status(404).json({ message: "Club not found" });
    }

    if (club.createdBy.toString() !== user.id) {
      return res.status(403).json({ message: "You can only create events for your own clubs" });
    }

    const event = await Event.create({
      eventName,
      clubId,
      createdBy: user.id,
      date,
      time,
      location,
      description,
      maxParticipants: maxParticipants || 0,
      poster: poster || ""
    });

    res.status(201).json({ message: "Event created successfully", event });
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

    // Get registrations
    const registrations = await Registration.find({ eventId })
      .populate("studentId", "name email");

    res.json({
      event,
      clubName: event.clubId?.name || "Unknown Club",
      registrations: registrations.map(r => r.studentId).filter(Boolean),
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

    const { eventName, date, time, location, description, maxParticipants, poster } = req.body;

    event.eventName = eventName || event.eventName;
    event.date = date || event.date;
    event.time = time || event.time;
    event.location = location || event.location;
    event.description = description || event.description;
    event.maxParticipants = maxParticipants !== undefined ? maxParticipants : event.maxParticipants;
    event.poster = poster || event.poster;

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

// Get event participants
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
        _id: r.studentId._id,
        name: r.studentId.name,
        email: r.studentId.email,
        registeredAt: r.registeredAt
      }))
    });
  } catch (error) {
    console.error("Get Participants Error:", error);
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

    res.json({
      totalEvents,
      upcomingEvents,
      pastEvents,
      totalRegistrations
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

    // Get events from approved clubs
    const events = await Event.find({ clubId: { $in: clubIds } })
      .populate("clubId", "name")
      .sort({ date: 1 });

    // Get user's registrations
    const myRegistrations = await Registration.find({ studentId: user.id });
    const registeredEventIds = myRegistrations.map(r => r.eventId.toString());

    // Add registration status to each event
    const eventsWithStatus = await Promise.all(
      events.map(async (event) => {
        const registrationCount = await Registration.countDocuments({ eventId: event._id });
        return {
          ...event.toObject(),
          clubName: event.clubId?.name || "Unknown Club",
          registrationCount,
          isRegistered: registeredEventIds.includes(event._id.toString())
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

    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: "Event not found" });
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

    await Registration.create({
      studentId: user.id,
      eventId
    });

    res.json({ message: "Successfully registered for the event!" });
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
        time: r.eventId.time,
        location: r.eventId.location,
        description: r.eventId.description,
        registeredAt: r.registeredAt
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
      clubId: { $in: clubIds }
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
        time: e.time,
        location: e.location
      }))
    });
  } catch (error) {
    console.error("Get Student Stats Error:", error);
    res.status(500).json({ message: error.message });
  }
};

