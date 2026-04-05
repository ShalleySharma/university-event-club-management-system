const router = require("express").Router();
const { isAuthenticated, authorizeRoles } = require("../middleware/authMiddleware");
const userController = require("../controllers/userController");
const User = require("../models/User");
const Club = require("../models/Club");
const RoleRequest = require("../models/RoleRequest");

router.get("/me", isAuthenticated, userController.getCurrentUser);

// Admin routes - Get all users (admin only)
router.get("/", isAuthenticated, authorizeRoles("admin"), userController.getAllUsers);

// Admin routes - Get stats (admin only) - ADDED
router.get("/stats", isAuthenticated, authorizeRoles("admin"), async (req, res) => {
  try {
    // Get user statistics
    const userStats = await User.aggregate([
      { $group: { _id: "$role", count: { $sum: 1 } } }
    ]);
    
    // Get club statistics
    const clubStats = await Club.aggregate([
      { $group: { _id: "$status", count: { $sum: 1 } } }
    ]);
    
    // Get pending role requests
    const pendingRoleRequests = await RoleRequest.countDocuments({ status: "pending" });
    
    res.json({
      userStats,
      clubStats,
      pendingRoleRequests
    });
  } catch (err) {
    res.status(500).json({ message: "Server error: " + err.message });
  }
});

// Admin routes - Get role requests (admin only) - ADDED
router.get("/role-requests", isAuthenticated, authorizeRoles("admin"), async (req, res) => {
  try {
    const requests = await RoleRequest.find({ status: "pending" })
      .populate("userId", "name email")
      .populate("clubId", "name")
      .sort({ createdAt: -1 });
    res.json(requests);
  } catch (err) {
    res.status(500).json({ message: "Server error: " + err.message });
  }
});

// Admin routes - Update role request status (admin only) - ADDED
router.patch("/role-requests/:requestId", isAuthenticated, authorizeRoles("admin"), async (req, res) => {
  try {
    const { status } = req.body;
    const request = await RoleRequest.findById(req.params.requestId);
    
    if (!request) {
      return res.status(404).json({ message: "Role request not found" });
    }
    
    request.status = status;
    request.reviewedBy = req.user.id;
    request.reviewedAt = new Date();
    await request.save();
    
    if (status === "approved") {
      await User.findByIdAndUpdate(request.userId, { role: request.requestedRole });
    }
    
    res.json({ message: `Role request ${status}`, request });
  } catch (err) {
    res.status(500).json({ message: "Server error: " + err.message });
  }
});

// Admin routes - Delete user (admin only)
router.delete("/:id", isAuthenticated, authorizeRoles("admin"), userController.deleteUser);

// Admin routes - Teacher Management
router.get("/teachers", isAuthenticated, authorizeRoles("admin"), userController.getAllTeachers);
router.get("/teachers/all", isAuthenticated, authorizeRoles("admin"), async (req, res) => {
  try {
    const teachers = await User.find({ role: "teacher" }).select("-password");
    res.json(teachers);
  } catch (err) {
    res.status(500).json({ message: "Server error: " + err.message });
  }
});

router.get("/students/all", isAuthenticated, authorizeRoles("admin"), async (req, res) => {
  try {
    const students = await User.find({ role: { $in: ["student", "club_head", "convener"] } }).select("-password");
    res.json(students);
  } catch (err) {
    res.status(500).json({ message: "Server error: " + err.message });
  }
});

router.post("/teachers", isAuthenticated, authorizeRoles("admin"), userController.createTeacher);

router.patch("/teachers/:id/activate", isAuthenticated, authorizeRoles("admin"), userController.activateTeacher);

router.patch("/teachers/:id/deactivate", isAuthenticated, authorizeRoles("admin"), userController.deactivateTeacher);

router.get("/student/dashboard", isAuthenticated, authorizeRoles("student"), userController.getStudentDashboard);

router.get("/club_head/dashboard", isAuthenticated, authorizeRoles("club_head"), userController.getClubHeadDashboard);

router.get("/coordinator/dashboard", isAuthenticated, authorizeRoles("coordinator"), userController.getCoordinatorDashboard);

router.get("/teacher/dashboard", isAuthenticated, authorizeRoles("teacher"), userController.getTeacherDashboard);

router.get("/admin/dashboard", isAuthenticated, authorizeRoles("admin"), userController.getAdminDashboard);

module.exports = router;

