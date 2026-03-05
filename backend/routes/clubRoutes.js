const router = require("express").Router();
const { isAuthenticated, authorizeRoles } = require("../middleware/authMiddleware");
const clubController = require("../controllers/clubController");

// Create club (teachers and admins)
router.post(
  "/",
  isAuthenticated,
  authorizeRoles("club_head", "admin"),
  clubController.createClub
);

// Get clubs (role-based visibility)
router.get("/", isAuthenticated, clubController.getClubs);

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

module.exports = router;
