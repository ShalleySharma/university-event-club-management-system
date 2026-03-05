const router = require("express").Router();
const { isAuthenticated, authorizeRoles } = require("../middleware/authMiddleware");
const userController = require("../controllers/userController");

router.get("/me", isAuthenticated, userController.getCurrentUser);

// Admin routes - Get all users (admin only)
router.get("/", isAuthenticated, authorizeRoles("admin"), userController.getAllUsers);

// Admin routes - Delete user (admin only)
router.delete("/:id", isAuthenticated, authorizeRoles("admin"), userController.deleteUser);

router.get("/student/dashboard", isAuthenticated, authorizeRoles("student"), userController.getStudentDashboard);

router.get("/club_head/dashboard", isAuthenticated, authorizeRoles("club_head"), userController.getClubHeadDashboard);

router.get("/coordinator/dashboard", isAuthenticated, authorizeRoles("coordinator"), userController.getCoordinatorDashboard);

router.get("/teacher/dashboard", isAuthenticated, authorizeRoles("teacher"), userController.getTeacherDashboard);

router.get("/admin/dashboard", isAuthenticated, authorizeRoles("admin"), userController.getAdminDashboard);

module.exports = router;

