const Club = require("../models/Club");
const User = require("../models/User");
const RoleRequest = require("../models/RoleRequest");

exports.createClub = async (req, res) => {
  try {
    const { name, description } = req.body;

    const club = await Club.create({
      name,
      description,
      createdBy: req.user.id
    });

    res.status(201).json({
      message: "Club created successfully, pending admin approval",
      club
    });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ message: "Club name already exists" });
    }
    res.status(500).json({ message: "Server error" });
  }
};

exports.getClubs = async (req, res) => {
  try {
    let query = {};

    // Admin sees all clubs
    if (req.user.role === "admin") {
      // No filter
    }
    // Club heads see approved clubs
    else if (req.user.role === "club_head") {
      query.status = "approved";
    }
    // Coordinators see clubs they're members of
    else if (req.user.role === "coordinator") {
      query.members = req.user.id;
    }
    // Students see approved clubs
    else {
      query.status = "approved";
    }

    const clubs = await Club.find(query).populate("createdBy", "name email");
    res.json(clubs);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

exports.approveClub = async (req, res) => {
  try {
    const { clubId } = req.params;
    const { status } = req.body; // "approved" or "rejected"

    const club = await Club.findByIdAndUpdate(
      clubId,
      { status },
      { new: true }
    );

    if (!club) {
      return res.status(404).json({ message: "Club not found" });
    }

    res.json({
      message: `Club ${status}`,
      club
    });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

exports.joinClub = async (req, res) => {
  try {
    const { clubId } = req.params;

    const club = await Club.findById(clubId);
    if (!club) {
      return res.status(404).json({ message: "Club not found" });
    }

    if (club.status !== "approved") {
      return res.status(400).json({ message: "Club is not approved yet" });
    }

    if (club.members.includes(req.user.id)) {
      return res.status(400).json({ message: "Already a member" });
    }

    club.members.push(req.user.id);
    await club.save();

    res.json({ message: "Joined club successfully" });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

exports.requestRole = async (req, res) => {
  try {
    const { clubId, requestedRole } = req.body;

    // Check if user is member of the club
    const club = await Club.findById(clubId);
    if (!club || !club.members.includes(req.user.id)) {
      return res.status(400).json({ message: "You must be a club member to request a role" });
    }

    // Check if there's already a pending request
    const existingRequest = await RoleRequest.findOne({
      userId: req.user.id,
      clubId,
      status: "pending"
    });

    if (existingRequest) {
      return res.status(400).json({ message: "You already have a pending role request" });
    }

    const roleRequest = await RoleRequest.create({
      userId: req.user.id,
      clubId,
      requestedRole
    });

    res.status(201).json({
      message: "Role request submitted successfully",
      roleRequest
    });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

exports.getRoleRequests = async (req, res) => {
  try {
    let query = {};

    if (req.user.role === "club_head") {
      // Club heads see requests for clubs they created
      const clubs = await Club.find({ createdBy: req.user.id });
      const clubIds = clubs.map(club => club._id);
      query.clubId = { $in: clubIds };
    } else if (req.user.role === "admin") {
      // Admin sees all requests
    } else {
      return res.status(403).json({ message: "Access denied" });
    }

    const requests = await RoleRequest.find(query)
      .populate("userId", "name email")
      .populate("clubId", "name")
      .populate("reviewedBy", "name");

    res.json(requests);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

exports.reviewRoleRequest = async (req, res) => {
  try {
    const { requestId } = req.params;
    const { status } = req.body; // "approved" or "rejected"

    const request = await RoleRequest.findById(requestId);
    if (!request) {
      return res.status(404).json({ message: "Request not found" });
    }

    // Check permissions
    if (req.user.role === "club_head") {
      const club = await Club.findById(request.clubId);
      if (club.createdBy.toString() !== req.user.id) {
        return res.status(403).json({ message: "You can only review requests for your clubs" });
      }
    }

    request.status = status;
    request.reviewedBy = req.user.id;
    request.reviewedAt = new Date();
    await request.save();

    if (status === "approved") {
      // Update user role
      await User.findByIdAndUpdate(request.userId, { role: request.requestedRole });
    }

    res.json({
      message: `Role request ${status}`,
      request
    });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};
