const Club = require("../models/Club");
const User = require("../models/User");
const RoleRequest = require("../models/RoleRequest");

// Helper function to find or create user and update role
const findAndUpdateUserRole = async (email, role, clubName) => {
  if (!email) return null;
  
  try {
    let user = await User.findOne({ email: email.toLowerCase() });
    
    if (user) {
      // Update user's role if they don't have a higher role
      const roleHierarchy = { student: 1, coordinator: 2, club_head: 3, teacher: 4, admin: 5 };
      const currentRoleLevel = roleHierarchy[user.role] || 0;
      const newRoleLevel = roleHierarchy[role] || 0;
      
      // Only upgrade role if current role is lower
      if (newRoleLevel > currentRoleLevel) {
        user.role = role;
        await user.save();
      }
      return user;
    } else {
      // User doesn't exist - we'll note this but not create them automatically
      // The user needs to register first
      console.log(`User with email ${email} not found. They will need to register.`);
      return null;
    }
  } catch (err) {
    console.error(`Error updating user role for ${email}:`, err);
    return null;
  }
};

// Create club (teachers, club heads and admins)
exports.createClub = async (req, res) => {
  try {
    const { 
      name, 
      description, 
      category, 
      logo,
      coordinator,
      convener,
      coConvener,
      meetingDay,
      meetingTime,
      meetingLocation,
      maxMembers,
      joinType,
      clubEmail
    } = req.body;

    // Create the club with all fields
    const club = await Club.create({
      name,
      description,
      category: category || "General",
      logo: logo || "",
      coordinator: coordinator || { name: "", email: "" },
      convener: convener || { name: "", email: "" },
      coConvener: coConvener || { name: "", email: "" },
      meetingDay: meetingDay || "",
      meetingTime: meetingTime || "",
      meetingLocation: meetingLocation || "",
      maxMembers: maxMembers || 50,
      joinType: joinType || "approval",
      clubEmail: clubEmail || "",
      facultyCoordinator: req.user.id,
      createdBy: req.user.id
    });

    // Assign roles based on email addresses
    const roleAssignments = [];
    
    // Assign convener as club_head
    if (convener && convener.email) {
      const convenerUser = await findAndUpdateUserRole(convener.email, "club_head", name);
      if (convenerUser) {
        roleAssignments.push({ email: convener.email, role: "club_head", status: "assigned" });
        club.members = club.members || [];
        if (!club.members.includes(convenerUser._id)) {
          club.members.push(convenerUser._id);
        }
        console.log(`Added convener ${convenerUser.email} (${convenerUser._id}) to club members`);
      } else {
        roleAssignments.push({ email: convener.email, role: "club_head", status: "pending_registration" });
      }
    }

    // Assign co-convener as coordinator
    if (coConvener && coConvener.email) {
      const coConvenerUser = await findAndUpdateUserRole(coConvener.email, "coordinator", name);
      if (coConvenerUser) {
        roleAssignments.push({ email: coConvener.email, role: "coordinator", status: "assigned" });
        club.members = club.members || [];
        if (!club.members.includes(coConvenerUser._id)) {
          club.members.push(coConvenerUser._id);
        }
        console.log(`Added co-convener ${coConvenerUser.email} (${coConvenerUser._id}) to club members`);
      } else {
        roleAssignments.push({ email: coConvener.email, role: "coordinator", status: "pending_registration" });
      }
    }
    
    await club.save();

    res.status(201).json({
      message: "Club created successfully, pending admin approval",
      club,
      roleAssignments
    });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ message: "Club name already exists" });
    }
    res.status(500).json({ message: "Server error: " + err.message });
  }
};

// Get user by email (for validation)
exports.getUserByEmail = async (req, res) => {
  try {
    const { email } = req.params;
    
    const user = await User.findOne({ email: email.toLowerCase() }).select("-password");
    
    if (user) {
      res.json({ exists: true, user });
    } else {
      res.json({ exists: false, message: "User not found" });
    }
  } catch (err) {
    res.status(500).json({ message: "Server error: " + err.message });
  }
};

// Get teacher's clubs (clubs created by the teacher)
exports.getTeacherClubs = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    const userEmail = user?.email?.toLowerCase();
    
    // Get clubs created by the user
    let clubs = await Club.find({ createdBy: req.user.id })
      .populate("createdBy", "name email")
      .populate("facultyCoordinator", "name email")
      .populate("members", "name email role")
      .sort({ createdAt: -1 });
    
    // Also check if user is a convener in any club (for students assigned as club heads)
    if (userEmail) {
    const convenerClubs = await Club.find({
      "convener.email": userEmail,
      status: "approved"
    }).populate("createdBy", "name email")
      .populate("facultyCoordinator", "name email")
      .populate("members", "name email role");
      
      // Merge clubs, avoiding duplicates
      const existingIds = clubs.map(c => c._id.toString());
      convenerClubs.forEach(club => {
        if (!existingIds.includes(club._id.toString())) {
          clubs.push(club);
        }
      });
    }
    
    res.json(clubs);
  } catch (err) {
    res.status(500).json({ message: "Server error: " + err.message });
  }
};

// Update club
exports.updateClub = async (req, res) => {
  try {
    const { clubId } = req.params;
    const { 
      name, 
      description, 
      category, 
      logo,
      coordinator,
      convener,
      coConvener,
      meetingDay,
      meetingTime,
      meetingLocation,
      maxMembers,
      joinType,
      clubEmail
    } = req.body;

    const club = await Club.findById(clubId);

    if (!club) {
      return res.status(404).json({ message: "Club not found" });
    }

    // Check if user is the creator or admin
    if (club.createdBy.toString() !== req.user.id && req.user.role !== "admin") {
      return res.status(403).json({ message: "You can only update your own clubs" });
    }

    // Update basic fields
    if (name) club.name = name;
    if (description) club.description = description;
    if (category) club.category = category;
    if (logo !== undefined) club.logo = logo;

    // Update leadership fields
    if (coordinator) club.coordinator = coordinator;
    if (convener) club.convener = convener;
    if (coConvener) club.coConvener = coConvener;

    // Update user roles when leadership changes
    if (convener && convener.email) {
      await findAndUpdateUserRole(convener.email, "club_head", club.name);
    }
    if (coConvener && coConvener.email) {
      await findAndUpdateUserRole(coConvener.email, "coordinator", club.name);
    }

    // Update meeting details
    if (meetingDay !== undefined) club.meetingDay = meetingDay;
    if (meetingTime !== undefined) club.meetingTime = meetingTime;
    if (meetingLocation !== undefined) club.meetingLocation = meetingLocation;

    // Update membership settings
    if (maxMembers !== undefined) club.maxMembers = maxMembers;
    if (joinType) club.joinType = joinType;

    // Update contact details
    if (clubEmail !== undefined) club.clubEmail = clubEmail;

    await club.save();

    res.json({
      message: "Club updated successfully",
      club
    });
  } catch (err) {
    res.status(500).json({ message: "Server error: " + err.message });
  }
};

// Delete club
exports.deleteClub = async (req, res) => {
  try {
    const { clubId } = req.params;

    const club = await Club.findById(clubId);

    if (!club) {
      return res.status(404).json({ message: "Club not found" });
    }

    // Check if user is the creator or admin
    if (club.createdBy.toString() !== req.user.id && req.user.role !== "admin") {
      return res.status(403).json({ message: "You can only delete your own clubs" });
    }

    await Club.findByIdAndDelete(clubId);

    res.json({ message: "Club deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: "Server error: " + err.message });
  }
};

// Get single club details with members and events
exports.getClubDetails = async (req, res) => {
  try {
    const { clubId } = req.params;

    const club = await Club.findById(clubId)
      .populate("createdBy", "name email")
      .populate("facultyCoordinator", "name email")
      .populate("members", "name email");

    if (!club) {
      return res.status(404).json({ message: "Club not found" });
    }

    // Get events for this club
    const Event = require("../models/Event");
    const events = await Event.find({ club: clubId })
      .sort({ date: -1 })
      .limit(10);

    // Count upcoming events
    const now = new Date();
    const upcomingEvents = events.filter(e => new Date(e.date) > now).length;

    res.json({
      club,
      members: club.members,
      totalMembers: club.members.length,
      totalEvents: events.length,
      upcomingEvents: upcomingEvents,
      events: events
    });
  } catch (err) {
    res.status(500).json({ message: "Server error: " + err.message });
  }
};

// Remove member from club
exports.removeMember = async (req, res) => {
  try {
    const { clubId, memberId } = req.params;

    const club = await Club.findById(clubId);

    if (!club) {
      return res.status(404).json({ message: "Club not found" });
    }

    // Check if user is the creator or admin
    if (club.createdBy.toString() !== req.user.id && req.user.role !== "admin") {
      return res.status(403).json({ message: "You can only manage your own clubs" });
    }

    // Remove member from club
    club.members = club.members.filter(m => m.toString() !== memberId);
    await club.save();

    res.json({ message: "Member removed successfully" });
  } catch (err) {
    res.status(500).json({ message: "Server error: " + err.message });
  }
};

exports.getClubs = async (req, res) => {
  try {
    let query = {};

    // Admin sees all clubs (including pending, approved, rejected)
    if (req.user.role === "admin") {
      // No filter - admin sees all clubs
    }
    // Teachers see approved clubs
    else if (req.user.role === "teacher") {
      query.status = "approved";
    }
    // Club heads see approved clubs
    else if (req.user.role === "club_head") {
      query.status = "approved";
    }
    // Coordinators see clubs they're members of
    else if (req.user.role === "coordinator") {
      query.members = req.user.id;
      query.status = "approved";
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

// Get student's joined clubs
exports.getMyClubs = async (req, res) => {
  try {
    const clubs = await Club.find({ 
      members: req.user.id,
      status: "approved"
    }).populate("createdBy", "name email");

    res.json(clubs);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

// Check if user is a convener in any approved club
exports.checkConvenerStatus = async (req, res) => {
  try {
    const User = require("../models/User");
    
    // Get the current user's email
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.json({ isConvener: false });
    }

    const userEmail = user.email.toLowerCase();

    // Check if user is listed as convener in any approved club
    const clubsAsConvener = await Club.find({
      "convener.email": userEmail,
      status: "approved"
    });

    res.json({ 
      isConvener: clubsAsConvener.length > 0,
      clubs: clubsAsConvener
    });
  } catch (err) {
    console.error("Error checking convener status:", err);
    res.status(500).json({ message: "Server error" });
  }
};
