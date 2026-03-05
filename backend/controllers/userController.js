const User = require("../models/User");

exports.getCurrentUser = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

exports.getStudentDashboard = async (req, res) => {
  try {
    const User = require("../models/User");
    const Club = require("../models/Club");

    // Get user's joined clubs
    const joinedClubs = await Club.find({
      members: req.user.id,
      status: "approved"
    }).select("name description");

    // Mock data for student dashboard
    const dashboardData = {
      message: "Welcome to Student Dashboard",
      role: "student",
      features: [
        "View clubs",
        "Join clubs",
        "Request coordinator role",
        "View upcoming events",
        "Register for events"
      ],
      joinedClubs,
      upcomingEvents: [
        { id: 1, name: "Tech Fest 2024", date: "2024-03-15" },
        { id: 2, name: "Cultural Night", date: "2024-03-20" }
      ]
    };
    res.json(dashboardData);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

exports.getClubHeadDashboard = async (req, res) => {
  try {
    const Club = require("../models/Club");
    const RoleRequest = require("../models/RoleRequest");

    // Get clubs created by this club head
    const myClubs = await Club.find({ createdBy: req.user.id });

    // Get pending role requests for my clubs
    const clubIds = myClubs.map(club => club._id);
    const pendingRequests = await RoleRequest.find({
      clubId: { $in: clubIds },
      status: "pending"
    }).populate("userId", "name email").populate("clubId", "name");

    const dashboardData = {
      message: "Welcome to Club Head Dashboard",
      role: "club_head",
      features: [
        "Create clubs",
        "Approve clubs (pending admin approval)",
        "Review role requests",
        "Manage club members",
        "Create events"
      ],
      myClubs,
      pendingRequests: pendingRequests.length,
      recentRequests: pendingRequests.slice(0, 5)
    };
    res.json(dashboardData);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

exports.getCoordinatorDashboard = async (req, res) => {
  try {
    const Club = require("../models/Club");

    // Get clubs where user is coordinator
    const myClubs = await Club.find({
      members: req.user.id,
      status: "approved"
    }).select("name description");

    const dashboardData = {
      message: "Welcome to Coordinator Dashboard",
      role: "coordinator",
      features: [
        "Manage club activities",
        "Organize events",
        "Recruit new members",
        "Coordinate with club head",
        "View club analytics"
      ],
      myClubs,
      upcomingTasks: [
        "Plan next meeting",
        "Organize recruitment drive",
        "Coordinate with faculty"
      ]
    };
    res.json(dashboardData);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

exports.getTeacherDashboard = async (req, res) => {
  try {
    const Club = require("../models/Club");

    // Get clubs where teacher is involved (as faculty advisor or something)
    const clubs = await Club.find({ status: "approved" }).select("name description");

    const dashboardData = {
      message: "Welcome to Teacher Dashboard",
      role: "teacher",
      features: [
        "View all clubs",
        "Approve club activities",
        "Mentor students",
        "Oversee events",
        "Provide guidance"
      ],
      clubs,
      upcomingEvents: [
        { id: 1, name: "Faculty Meeting", date: "2024-03-10" },
        { id: 2, name: "Club Review Session", date: "2024-03-25" }
      ]
    };
    res.json(dashboardData);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select("-password");
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    await user.remove();
    res.json({ message: "User deleted" });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

exports.getAdminDashboard = async (req, res) => {
  try {
    const Club = require("../models/Club");
    const User = require("../models/User");
    const RoleRequest = require("../models/RoleRequest");

    // Get pending clubs
    const pendingClubs = await Club.find({ status: "pending" });

    // Get all role requests
    const allRequests = await RoleRequest.find({ status: "pending" });

    // Get user statistics
    const userStats = await User.aggregate([
      { $group: { _id: "$role", count: { $sum: 1 } } }
    ]);

    const dashboardData = {
      message: "Welcome to Admin Dashboard",
      role: "admin",
      features: [
        "Approve club creation requests",
        "Assign club head roles",
        "Review all role requests",
        "View system analytics",
        "Manage system settings"
      ],
      pendingClubs: pendingClubs.length,
      pendingRequests: allRequests.length,
      userStats,
      recentClubs: pendingClubs.slice(0, 5)
    };
    res.json(dashboardData);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};
