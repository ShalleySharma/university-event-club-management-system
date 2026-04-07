// Club Head can approve their events
const Event = require("../models/Event");
const Club = require("../models/Club");
const Registration = require("../models/Registration");
const jwt = require("jsonwebtoken");

const getUserFromToken = (req) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return null;
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "your-secret-key");
    // Fix: Ensure id is string ObjectId format
    if (decoded.id) decoded.id = decoded.id.toString();
    return decoded;
  } catch (err) {
    console.error('getUserFromToken error:', err.message);
    return null;
  }
};

// Check if user associated with club
const isUserAssociatedWithClub = async (clubId, userId) => {
  if (!clubId || !userId) return false;
  const club = await Club.findOne({
    _id: clubId,
    $or: [
      { createdBy: userId },
      { members: userId }
    ]
  });
  return !!club;
};

const formatEvents = (events) => events.map(e => ({
  ...e,
  clubName: e.clubId?.name || 'Unknown',
  time: e.startTime || 'TBD',
  registrationCount: 0
}));

// All get functions as before...
const getClubEvents = async (req, res) => {
  try {
    const user = getUserFromToken(req);
    if (!user) return res.status(401).json({ message: "Unauthorized" });

    const userId = user.id;
    
    // Get student's joined clubs only
    const clubs = await Club.find({ members: userId }).select("_id").lean();
    const clubIds = clubs.map(c => c._id);

    if (clubIds.length === 0) {
      return res.json([]);
    }

    const events = await Event.find({
      clubId: { $in: clubIds },
      approvalStatus: "approved",
      status: "active"
    })
      .populate("clubId", "name")
      .sort({ date: 1 })
      .lean();

    // Mark registration status
    const eventsWithStatus = await Promise.all(events.map(async (event) => {
      const registration = await Registration.findOne({
        studentId: userId,
        eventId: event._id
      }).lean();
      
      return {
        ...event,
        clubName: event.clubId?.name || 'Unknown',
        isRegistered: !!registration
      };
    }));

    console.log(`Student ${user.email} - ${eventsWithStatus.length} events from ${clubIds.length} joined clubs`);
    res.json(eventsWithStatus);
  } catch (error) {
    console.error('getClubEvents error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
const getMyEvents = async (req, res) => {
  try {
    const user = getUserFromToken(req);
    if (!user) return res.status(401).json({ message: "Unauthorized" });

    const userId = user.id;
    const events = await Event.find({ createdBy: userId })
      .populate("clubId", "name")
      .lean();
    
    console.log(`Teacher ${user.email} events: ${events.length}`);
    res.json(formatEvents(events));
  } catch (error) {
    console.error('getMyEvents error:', error);
    res.json([]);
  }
};
const getClubHeadEvents = async (req, res) => {
  try {
    const user = getUserFromToken(req);
    if (!user) return res.status(401).json({ message: "Unauthorized" });

    // Find clubs associated with user (created, convener/co-convener email match, members)
    const userEmail = user.email ? user.email.toLowerCase() : '';
    const userId = user.id;
    
    const clubs = await Club.find({
      $or: [
        { createdBy: userId },
        { 'convener.email': { $regex: userEmail, $options: 'i' } },
        { 'coConvener.email': { $regex: userEmail, $options: 'i' } },
        { members: userId }
      ]
    }).select("_id");

    const clubIds = clubs.map(c => c._id);
    const events = await Event.find({
      clubId: { $in: clubIds },
      approvalStatus: "approved"
    }).populate("clubId", "name").lean();
    
    console.log(`ClubHead ${userEmail} (${userId}) events: ${events.length} from ${clubIds.length} clubs`);
    res.json(formatEvents(events));
  } catch (error) {
    console.error('getClubHeadEvents error:', error);
    res.json([]);
  }
};

// FIXED approveEvent - Club Head can approve their club's events
const approveEvent = async (req, res) => {
  try {
    const user = getUserFromToken(req);
    if (!user) return res.status(401).json({ message: "Unauthorized" });

    const { eventId } = req.params;
    const { status } = req.body;

    const event = await Event.findById(eventId).populate('clubId');
    if (!event) return res.status(404).json({ message: "Event not found" });

    // Admin always can
    if (user.role === 'admin') {
      event.approvalStatus = status;
      await event.save();
      return res.json({ message: `Admin ${status}`, event });
    }

    // Club Head can approve their club's events
    if (user.role === 'club_head') {
      const associated = await isUserAssociatedWithClub(event.clubId, user.id);
      if (associated || event.createdBy.toString() === user.id) {
        event.approvalStatus = status;
        await event.save();
        return res.json({ message: `Club Head ${status}`, event });
      }
      return res.status(403).json({ message: "Not authorized for this club" });
    }

    return res.status(403).json({ message: "Not authorized" });
  } catch (error) {
    console.error('approveEvent:', error);
    res.status(500).json({ message: "Server error" });
  }
};

// Create (minimal)
const createEvent = async (req, res) => {
  try {
    const user = getUserFromToken(req);
    if (!user) return res.status(401).json({ message: "Unauthorized" });

    const eventData = req.body;
    
    const event = new Event({
      createdBy: user.id,
      clubId: eventData.clubId,
      ...eventData,
      approvalStatus: 'pending'
    });

    await event.save();

    console.log(`Teacher ${user.email} created event "${event.eventName}" (pending)`);

    res.status(201).json({ 
      message: 'Event created pending admin approval',
      eventId: event._id,
      eventName: event.eventName
    });
  } catch (error) {
    console.error('createEvent error:', error);
    res.status(500).json({ message: 'Server error creating event' });
  }
};

const getStudentStats = async (req, res) => {
  try {
    const user = getUserFromToken(req);
    if (!user) return res.status(401).json({ message: "Unauthorized" });

    const userId = user.id;

    // Count registered events
    const registeredCount = await Registration.countDocuments({ studentId: userId });

    // Get upcoming events (next 7 days, registered or not)
    const upcoming = await Event.find({
      date: { $gte: new Date().toISOString().split('T')[0] },
      approvalStatus: "approved",
      status: "active"
    }).populate("clubId", "name").limit(5).lean();

    res.json({
      joinedClubs: 0, // Will be populated by frontend or separate endpoint
      registeredEvents: registeredCount,
      upcomingEvents: upcoming
    });
  } catch (error) {
    console.error('getStudentStats error:', error);
    res.status(500).json({ message: "Server error" });
  }
};


const getMyRegistrations = async (req, res) => {
  try {
    const user = getUserFromToken(req);
    if (!user) return res.status(401).json({ message: "Unauthorized" });

    const userId = user.id;

    const registrations = await Registration.find({ studentId: userId })
      .populate({
        path: 'eventId',
        populate: { path: 'clubId', select: 'name' }
      })
      .populate('eventId')
      .lean();

    res.json(registrations);
  } catch (error) {
    console.error('getMyRegistrations error:', error);
    res.status(500).json({ message: "Server error" });
  }
};

const getAllEvents = async (req, res) => {
  try {
    const user = getUserFromToken(req);
    if (!user) return res.status(401).json({ message: "Unauthorized" });

    const userId = user.id;

    // Get all approved active events
    const events = await Event.find({
      approvalStatus: "approved",
      status: "active"
    })
      .populate("clubId", "name")
      .sort({ date: 1 })
      .lean();

    // Add registration status for this student
    const eventsWithStatus = await Promise.all(events.map(async (event) => {
      const registration = await Registration.findOne({
        studentId: userId,
        eventId: event._id
      }).lean();
      
      return {
        ...event,
        isRegistered: !!registration
      };
    }));

    res.json(eventsWithStatus);
  } catch (error) {
    console.error('getAllEvents error:', error);
    res.status(500).json({ message: "Server error" });
  }
};

// FIXED: registerForEvent - Added validation & better error handling for 500 errors
const registerForEvent = async (req, res) => {
  console.log('🚨 *** REGISTER CONTROLLER ENTRY ***');
  console.log('🚨 req.user:', req.user);
  console.log('🚨 params:', req.params);
  try {
    // Use req.user from middleware (already verified)
    const user = req.user;
    if (!user) {
      console.error('registerForEvent: No req.user from middleware');
      return res.status(401).json({ message: "Unauthorized - No user context" });
    }
    console.log('registerForEvent user from req.user:', { id: user.id, role: user.role });

    const userId = user.id;
    if (!userId) {
      console.error('registerForEvent: No user.id from req.user');
      return res.status(500).json({ message: "Server error - Missing user ID" });
    }

    const { eventId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(eventId)) {
      console.error('registerForEvent: Invalid eventId:', eventId);
      return res.status(400).json({ message: "Invalid event ID" });
    }

    const { transactionId, paymentScreenshot } = req.body || {};

    console.log(`registerForEvent: userId=${userId}, eventId=${eventId}`);

    // Check existing registration
    const existing = await Registration.findOne({ 
      studentId: userId, 
      eventId: mongoose.Types.ObjectId(eventId) 
    });
    if (existing) {
      return res.status(400).json({ message: "Already registered for this event" });
    }

    // Verify event exists
    const event = await Event.findById(eventId);
    if (!event) {
      console.error('registerForEvent: Event not found:', eventId);
      return res.status(404).json({ message: "Event not found" });
    }

    const registration = new Registration({
      studentId: userId,
      eventId: mongoose.Types.ObjectId(eventId),
      paymentStatus: transactionId ? "pending" : "not_required",
      transactionId: transactionId || "",
      paymentScreenshot: paymentScreenshot || ""
    });

    await registration.save();

    console.log(`registerForEvent SUCCESS: userId=${userId}, eventId=${eventId}, registrationId=${registration._id}`);

    res.json({ 
      message: "Registered successfully", 
      registrationId: registration._id,
      registration,
      registrationStatus: transactionId ? "pending" : "approved",
      eventTitle: event.eventName
    });
  } catch (error) {
    console.error('registerForEvent DETAILED ERROR:', {
      eventId: req.params.eventId,
      userId: req.user?.id,
      error: error.message,
      stack: error.stack,
      name: error.name,
      code: error.code
    });
    
    let status = 500;
    let message = "Registration failed";
    
    if (error.name === 'ValidationError') {
      status = 400;
      message = `Validation error: ${Object.values(error.errors).map(e => e.message).join(', ')}`;
    } else if (error.code === 11000) {
      status = 400;
      message = 'Already registered for this event (duplicate)';
    } else if (error.name === 'CastError') {
      status = 400;
      message = 'Invalid event ID format';
    }
    
    res.status(status).json({ 
      message,
      ...(process.env.NODE_ENV === 'development' && { debug: error.message })
    });
  }

};

// Add mongoose import for ObjectId validation
const mongoose = require('mongoose');

const getPendingEvents = async (req, res) => {
  try {
    const user = getUserFromToken(req);
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ message: 'Admin only' });
    }

    const events = await Event.find({ approvalStatus: 'pending' })
      .populate('clubId', 'name')
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 })
      .lean();

    const eventsWithTeacher = events.map(event => ({
      ...event,
      teacherName: event.createdBy?.name || event.createdBy?.email || 'Unknown',
      clubName: event.clubId?.name || 'Unknown Club'
    }));

    res.json(eventsWithTeacher);
  } catch (error) {
    console.error('getPendingEvents error:', error);
    res.status(500).json({ message: 'Server error: ' + error.message });
  }
};

const getAllEventsAdmin = async (req, res) => {
  try {
    const user = getUserFromToken(req);
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ message: 'Admin only' });
    }

    const events = await Event.find({})
      .populate('clubId', 'name')
      .populate('createdBy', 'name email')
      .lean();

    // Add registration count for each event
    const eventsWithCount = await Promise.all(events.map(async (event) => {
      const registrationCount = await Registration.countDocuments({ eventId: event._id });
      return {
        ...event,
        registrationCount,
        teacherName: event.createdBy?.name || 'Unknown Teacher',
        clubName: event.clubId?.name || 'Unknown Club'
      };
    }));

    res.json(eventsWithCount.sort((a, b) => new Date(b.date) - new Date(a.date)));
  } catch (error) {
    console.error('getAllEventsAdmin error:', error);
    res.status(500).json({ message: 'Server error: ' + error.message });
  }
};

const getEventStats = async (req, res) => {
  try {
    const user = getUserFromToken(req);
    if (!user) return res.status(401).json({ message: "Unauthorized" });

    const userId = user.id;
    let match = { createdBy: userId };

    // Club heads get stats for their clubs too
    if (user.role === 'club_head') {
      const clubs = await Club.find({
        $or: [
          { createdBy: userId },
          { 'convener.email': { $regex: user.email?.toLowerCase() || '', $options: 'i' } },
          { 'coConvener.email': { $regex: user.email?.toLowerCase() || '', $options: 'i' } },
          { members: userId }
        ]
      }).select("_id");
      const clubIds = clubs.map(c => c._id);
      match.$or = [{ createdBy: userId }, { clubId: { $in: clubIds } }];
    }

    // First get event IDs matching criteria
    const eventDocs = await Event.find(match).select('_id').lean();
    const eventIds = eventDocs.map(doc => doc._id);

    const stats = await Event.aggregate([
      { $match: match },
      {
        $group: {
          _id: null,
          totalEvents: { $sum: 1 },
          approved: { $sum: { $cond: [{ $eq: ["$approvalStatus", "approved"] }, 1, 0] } },
          pending: { $sum: { $cond: [{ $eq: ["$approvalStatus", "pending"] }, 1, 0] } },
          upcoming: { $sum: { $cond: [{ $and: [{ $eq: ["$approvalStatus", "approved"] }, { $gte: ["$date", new Date().toISOString().split('T')[0] ] }] }, 1, 0 ] } }
        }
      }
    ]);

    const regCount = await Registration.countDocuments({ eventId: { $in: eventIds } });

    const statResult = stats[0] || {};
    res.json({
      totalEvents: statResult.totalEvents || 0,
      approvedEvents: statResult.approved || 0,
      pendingEvents: statResult.pending || 0,
      upcomingEvents: statResult.upcoming || 0,
      totalRegistrations: regCount
    });
  } catch (error) {
    console.error('getEventStats error:', error);
    res.status(500).json({ message: "Server error" });
  }
};


const getEventDetails = async (req, res) => {
  try {
    const user = getUserFromToken(req);
    if (!user) return res.status(401).json({ message: "Unauthorized" });

    const { eventId } = req.params;
    const event = await Event.findById(eventId).populate('clubId', 'name');

    if (!event) return res.status(404).json({ message: "Event not found" });

    // Check auth: creator, club member, or admin
    const isAuthorized = user.role === 'admin' || 
      event.createdBy.toString() === user.id || 
      await isUserAssociatedWithClub(event.clubId._id, user.id);

    if (!isAuthorized) return res.status(403).json({ message: "Not authorized" });

    const registrationCount = await Registration.countDocuments({ eventId });
    
    res.json({
      ...event.toObject(),
      registrationCount,
      isUpcoming: event.date >= new Date().toISOString().split('T')[0]
    });
  } catch (error) {
    console.error('getEventDetails error:', error);
    res.status(500).json({ message: "Server error" });
  }
};

const updateEvent = async (req, res) => {
  try {
    const user = getUserFromToken(req);
    if (!user) return res.status(401).json({ message: "Unauthorized" });

    const { eventId } = req.params;

    const event = await Event.findById(eventId).populate('clubId');
    if (!event) return res.status(404).json({ message: "Event not found" });

    const isAuthorized = user.role === 'admin' || 
      event.createdBy.toString() === user.id || 
      await isUserAssociatedWithClub(event.clubId._id, user.id);

    if (!isAuthorized) return res.status(403).json({ message: "Not authorized" });

    // Update allowed fields (not approvalStatus)
    const updates = req.body;
    const allowedUpdates = ['title', 'description', 'date', 'startTime', 'endTime', 'venue', 'maxRegistrations', 'fee'];
    Object.keys(updates).forEach(key => {
      if (!allowedUpdates.includes(key)) delete updates[key];
    });

    Object.assign(event, updates);
    await event.save();

    res.json({ message: "Event updated", event });
  } catch (error) {
    console.error('updateEvent error:', error);
    res.status(500).json({ message: "Server error" });
  }
};

const deleteEvent = async (req, res) => {
  try {
    const user = getUserFromToken(req);
    if (!user) return res.status(401).json({ message: "Unauthorized" });

    const { eventId } = req.params;

    const event = await Event.findById(eventId).populate('clubId');
    if (!event) return res.status(404).json({ message: "Event not found" });

    const isAuthorized = user.role === 'admin' || 
      event.createdBy.toString() === user.id || 
      await isUserAssociatedWithClub(event.clubId._id, user.id);

    if (!isAuthorized) return res.status(403).json({ message: "Not authorized" });

    await Event.findByIdAndDelete(eventId);

    res.json({ message: "Event deleted" });
  } catch (error) {
    console.error('deleteEvent error:', error);
    res.status(500).json({ message: "Server error" });
  }
};

const getEventParticipants = async (req, res) => {
  try {
    const user = getUserFromToken(req);
    if (!user) return res.status(401).json({ message: "Unauthorized" });

    const { eventId } = req.params;

    const event = await Event.findById(eventId).populate('clubId');
    if (!event) return res.status(404).json({ message: "Event not found" });

    const isAuthorized = user.role === 'admin' || 
      event.createdBy.toString() === user.id || 
      await isUserAssociatedWithClub(event.clubId._id, user.id);

    if (!isAuthorized) return res.status(403).json({ message: "Not authorized" });

    const registrations = await Registration.find({ eventId })
      .populate('studentId', 'name email rollNumber')
      .lean();

    res.json(registrations);
  } catch (error) {
    console.error('getEventParticipants error:', error);
    res.status(500).json({ message: "Server error" });
  }
};

const verifyPayment = async (req, res) => {
  try {
    const user = getUserFromToken(req);
    if (!user) return res.status(401).json({ message: "Unauthorized" });

    const { eventId, registrationId } = req.params;
    const { paymentStatus } = req.body;

    const registration = await Registration.findById(registrationId).populate({
      path: 'eventId',
      populate: { path: 'clubId', select: 'name' }
    });

    if (!registration || registration.eventId._id.toString() !== eventId) {
      return res.status(404).json({ message: "Registration not found" });
    }

    const event = registration.eventId;
    const isAuthorized = user.role === 'admin' || 
      event.createdBy.toString() === user.id || 
      await isUserAssociatedWithClub(event.clubId._id, user.id);

    if (!isAuthorized) return res.status(403).json({ message: "Not authorized" });

    registration.paymentStatus = paymentStatus || 'verified';
    await registration.save();

    res.json({ message: `Payment ${paymentStatus || 'verified'}`, registration });
  } catch (error) {
    console.error('verifyPayment error:', error);
    res.status(500).json({ message: "Server error" });
  }
};



module.exports = {
  getClubEvents, 
  getMyEvents, 
  getClubHeadEvents, 
  createEvent, 
  approveEvent,
  getEventStats,
  getEventDetails,
  updateEvent,
  deleteEvent,
  getEventParticipants,
  verifyPayment,
  getAllEvents, 
  registerForEvent, 
  getMyRegistrations, 
  getStudentStats, 
  getPendingEvents,
  getAllEventsAdmin
};



