const router = require("express").Router();
const eventController = require("../controllers/eventController");

// ============================================
// TEACHER ROUTES
// ============================================

// Create a new event
router.post("/", async (req, res) => {
  await eventController.createEvent(req, res);
});

// Get all events for teacher
router.get("/my-events", async (req, res) => {
  await eventController.getMyEvents(req, res);
});

// Get event statistics
router.get("/stats", async (req, res) => {
  await eventController.getEventStats(req, res);
});

// Get single event details
router.get("/:eventId", async (req, res) => {
  await eventController.getEventDetails(req, res);
});

// Update event
router.put("/:eventId", async (req, res) => {
  await eventController.updateEvent(req, res);
});

// Delete event
router.delete("/:eventId", async (req, res) => {
  await eventController.deleteEvent(req, res);
});

// Get event participants
router.get("/:eventId/participants", async (req, res) => {
  await eventController.getEventParticipants(req, res);
});

// ============================================
// STUDENT ROUTES
// ============================================

// Get all available events for students
router.get("/all", async (req, res) => {
  await eventController.getAllEvents(req, res);
});

// Register for an event
router.post("/:eventId/register", async (req, res) => {
  await eventController.registerForEvent(req, res);
});

// Get student's registered events
router.get("/student/registrations", async (req, res) => {
  await eventController.getMyRegistrations(req, res);
});

// Get student dashboard stats
router.get("/student/stats", async (req, res) => {
  await eventController.getStudentStats(req, res);
});

module.exports = router;

