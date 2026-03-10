const router = require("express").Router();
const { isAuthenticated, authorizeRoles } = require("../middleware/authMiddleware");
const clubController = require("../controllers/clubController");

// Check if user is a convener in any approved club (must be before /:clubId routes)
router.get(
  "/check-convener",
  isAuthenticated,
  clubController.checkConvenerStatus
);

// Get clubs (role-based visibility) - must be before /:clubId routes
router.get("/", isAuthenticated, clubController.getClubs);

// Get user by email (for validation)
router.get(
  "/user-by-email/:email",
  isAuthenticated,
  clubController.getUserByEmail
);

// Get my clubs (for teachers/club heads and students who are conveners)
router.get(
  "/my-clubs",
  isAuthenticated,
  clubController.getTeacherClubs
);

// Create club (teachers, club heads and admins)
router.post(
  "/",
  isAuthenticated,
  authorizeRoles("teacher", "club_head", "admin"),
  clubController.createClub
);

// Update club
router.put(
  "/:clubId",
  isAuthenticated,
  authorizeRoles("teacher", "club_head", "admin"),
  clubController.updateClub
);

// Delete club
router.delete(
  "/:clubId",
  isAuthenticated,
  authorizeRoles("teacher", "club_head", "admin"),
  clubController.deleteClub
);

// Get single club details with members and events
router.get(
  "/:clubId/details",
  isAuthenticated,
  clubController.getClubDetails
);

// Remove member from club
router.delete(
  "/:clubId/members/:memberId",
  isAuthenticated,
  authorizeRoles("teacher", "club_head", "admin"),
  clubController.removeMember
);

// Approve/reject club (admin only)
router.patch(
  "/:clubId/approve",
  isAuthenticated,
  authorizeRoles("admin"),
  clubController.approveClub
);

// Join club (students)
router.post(
  "/:clubId/join",
  isAuthenticated,
  authorizeRoles("student"),
  clubController.joinClub
);

// Request role promotion (students/coordinators)
router.post(
  "/request-role",
  isAuthenticated,
  authorizeRoles("student", "coordinator"),
  clubController.requestRole
);

// Get role requests (club heads and admins)
router.get(
  "/role-requests",
  isAuthenticated,
  authorizeRoles("club_head", "admin"),
  clubController.getRoleRequests
);

// Review role request (club heads and admins)
router.patch(
  "/role-requests/:requestId/review",
  isAuthenticated,
  authorizeRoles("club_head", "admin"),
  clubController.reviewRoleRequest
);

// Get student's joined clubs
router.get(
  "/student/my-clubs",
  isAuthenticated,
  authorizeRoles("student"),
  clubController.getMyClubs
);

module.exports = router;
