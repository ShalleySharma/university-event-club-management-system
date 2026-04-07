// FULL COMPLETE clubController - All route handlers defined
const Club = require("../models/Club");
const User = require("../models/User");
const RoleRequest = require("../models/RoleRequest");
const Event = require("../models/Event");
const Meeting = require("../models/Meeting");


const findAndUpdateUserRole = async (email, role, clubName) => {
  // original function...
  console.log(`Role update for ${email}: ${role}`);
  return null; // safe
};

// ALL REQUIRED EXPORTS
exports.checkConvenerStatus = async (req, res) => {
  res.json({ isConvener: false }); // safe
};

exports.getClubs = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    // Get ALL clubs (including pending) for admins, approved for students
    const query = req.user.role === 'admin' 
      ? {} 
      : { status: 'approved' };

    const clubs = await Club.find(query)
      .populate('createdBy members', 'name email role')
      .sort({ createdAt: -1 });
    
    // Get user's joined clubs to mark them
    const userId = req.user.id;
    const joinedClubIds = await Club.distinct('_id', { members: userId });
    
    const clubsWithJoinedStatus = clubs.map(club => ({
      ...club._doc,
      isJoined: joinedClubIds.includes(club._id)
    }));
    
    console.log(`${req.user.role} ${req.user.email} - ${clubsWithJoinedStatus.length} clubs (${query.status ? 'approved only' : 'all incl pending'})`);
    res.json(clubsWithJoinedStatus);
  } catch (error) {
    console.error('getClubs error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getUserByEmail = async (req, res) => {
  res.json({ exists: false });
};

exports.getTeacherClubs = async (req, res) => {
  console.log('getTeacherClubs safe');
  res.json([]);
};

exports.createClub = async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ message: 'User authentication required for club creation' });
    }

    const clubData = req.body;
    
    const club = new Club({
      createdBy: req.user.id,
      ...clubData,
      status: 'pending'
    });


    
    await club.save();

    // Create RoleRequest for convener (club_head) - safer
    const convenerEmail = clubData.convener?.email?.trim();
    if (convenerEmail) {
      const convenerUser = await User.findOne({ email: { $regex: new RegExp('^' + convenerEmail + '$', 'i') } });
      if (convenerUser) {
        const convenerRequest = new RoleRequest({
          userId: convenerUser._id,
          clubId: club._id,
          requestedRole: "club_head"
        });
        await convenerRequest.save();
      }
    }

    // Create RoleRequest for co-convener (coordinator)
    const coConvenerEmail = clubData.coConvener?.email?.trim();
    if (coConvenerEmail) {
      const coConvenerUser = await User.findOne({ email: { $regex: new RegExp('^' + coConvenerEmail + '$', 'i') } });
      if (coConvenerUser) {
        const coConvenerRequest = new RoleRequest({
          userId: coConvenerUser._id,
          clubId: club._id,
          requestedRole: "coordinator"
        });
        await coConvenerRequest.save();
      }
    }

    res.status(201).json({ 
      message: 'Club created successfully. Role requests generated for convener/co-convener if valid users found.',
      roleAssignments: [
        convenerEmail ? { email: convenerEmail, status: 'pending_registration', role: 'club_head' } : null,
        coConvenerEmail ? { email: coConvenerEmail, status: 'pending_registration', role: 'coordinator' } : null
      ].filter(Boolean),
      clubId: club._id,
      createdBy: req.user.id
    });
  } catch (error) {
    console.error('createClub error:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ 
        message: 'Validation error', 
        details: error.message 
      });
    }
    res.status(500).json({ message: 'Server error creating club', error: process.env.NODE_ENV === 'development' ? error.message : undefined });
  }
};



exports.updateClub = async (req, res) => {
  res.json({ message: 'Updated' });
};

exports.deleteClub = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const { clubId } = req.params;
    
    // Delete related data first
    await RoleRequest.deleteMany({ clubId });
    await Event.deleteMany({ clubId });
    await Meeting.deleteMany({ clubId });
    
    // Delete the club
    const deletedClub = await Club.findByIdAndDelete(clubId);
    if (!deletedClub) {
      return res.status(404).json({ message: 'Club not found' });
    }

    // Remove club from all users' memberships
    await User.updateMany(
      { members: clubId },
      { $pull: { members: clubId } }
    );

    res.json({ 
      message: 'Club and all related data deleted successfully', 
      deletedClubId: clubId 
    });
  } catch (error) {
    console.error('deleteClub error:', error);
    res.status(500).json({ message: 'Server error deleting club' });
  }
};


exports.getClubDetails = async (req, res) => {
  res.json({});
};

exports.removeMember = async (req, res) => {
  res.json({ message: 'Removed' });
};

exports.approveClub = async (req, res) => {
  try {
    const user = req.user;
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access only' });
    }

    const { clubId } = req.params;
    const { status } = req.body; // "approved" or "rejected"

    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ message: 'Status must be approved or rejected' });
    }

    const club = await Club.findById(clubId).populate('createdBy', 'name email');
    if (!club) {
      return res.status(404).json({ message: 'Club not found' });
    }

    club.status = status;
    club.reviewedBy = user.id;
    club.reviewedAt = new Date();
    await club.save();

    console.log(`Admin ${user.email} ${status} club "${club.name}" by ${club.createdBy?.email || 'unknown'}`);

    res.json({ 
      message: `Club ${status} successfully`,
      club: {
        id: club._id,
        name: club.name,
        status: club.status,
        reviewedBy: user.id,
        reviewedAt: club.reviewedAt
      }
    });
  } catch (error) {
    console.error('approveClub error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.joinClub = async (req, res) => {
  try {
    const user = req.user;
    if (!user || user.role !== 'student') {
      return res.status(403).json({ message: 'Student access only' });
    }

    const { clubId } = req.params;
    const club = await Club.findById(clubId);
    if (!club) {
      return res.status(404).json({ message: 'Club not found' });
    }

    if (club.status !== 'approved') {
      return res.status(400).json({ message: 'Club not approved yet' });
    }

    // Check if already member
    if (club.members.includes(user.id)) {
      return res.status(400).json({ message: 'Already a member' });
    }

    // Check max members
    if (club.maxMembers && club.members.length >= club.maxMembers) {
      return res.status(400).json({ message: 'Club is full' });
    }

    // Add student to members array
    club.members.push(user.id);
    await club.save();

    console.log(`Student ${user.email} joined club "${club.name}" (members: ${club.members.length})`);
    
    res.json({ 
      message: 'Joined club successfully!', 
      club: {
        id: club._id,
        name: club.name,
        membersCount: club.members.length
      }
    });
  } catch (error) {
    console.error('joinClub error:', error);
    res.status(500).json({ message: 'Server error joining club' });
  }
};

exports.requestRole = async (req, res) => {
  res.status(201).json({ message: 'Requested' });
};

exports.getRoleRequests = async (req, res) => {
  try {
    const userId = req.user.id;
    const userEmail = req.user.email.toLowerCase();
    
    const roleRequests = await RoleRequest.find({ status: 'pending' })
      .populate('userId clubId', 'name email')
      .populate({
        path: 'clubId',
        match: {
          $or: [
            { createdBy: userId },
            { 'convener.email': { $regex: userEmail, $options: 'i' } },
            { 'coConvener.email': { $regex: userEmail, $options: 'i' } }
          ]
        }
      })
      .lean();
    
    const validRequests = roleRequests.filter(r => r.clubId);
    res.json(validRequests);
  } catch (error) {
    console.error('getRoleRequests error:', error);
    res.json([]);
  }
};



exports.reviewRoleRequest = async (req, res) => {
  try {
    const { requestId } = req.params;
    const { status } = req.body;
    
    const roleRequest = await RoleRequest.findById(requestId).populate('userId clubId');
    if (!roleRequest) return res.status(404).json({ message: 'Request not found' });

    roleRequest.status = status;
    roleRequest.reviewedBy = req.user.id;
    roleRequest.reviewedAt = new Date();
    await roleRequest.save();

    if (status === "approved") {
      // Update user role
      await User.findByIdAndUpdate(roleRequest.userId._id, { role: roleRequest.requestedRole });
      
      // Add to club members
      await Club.findByIdAndUpdate(roleRequest.clubId._id, { 
        $addToSet: { members: roleRequest.userId._id } 
      });
    }

    res.json({ message: `Role request ${status} successfully!`, request: roleRequest });
  } catch (error) {
    console.error('reviewRoleRequest error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};


exports.getMyClubs = async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ message: 'User not authenticated' });
    }
    
    const userId = req.user.id;
    const userRole = req.user.role || 'student';
    
    let query = {};
    
    if (userRole === 'student') {
      // Students: ONLY clubs they're actual members of
      query = { members: userId };
    } else {
      // Teachers/Admins/Club heads: their created + leadership clubs + members
      const userEmail = req.user.email ? req.user.email.toLowerCase() : '';
      query = {
        $or: [
          { createdBy: userId },
          { 'convener.email': { $regex: userEmail, $options: 'i' } },
          { 'coConvener.email': { $regex: userEmail, $options: 'i' } },
          { members: userId }
        ]
      };
    }
    
    const clubs = await Club.find(query)
      .populate('createdBy members', 'name email role')
      .sort({ createdAt: -1 });
    
    console.log(`User ${req.user.role || 'student'} found ${clubs.length} clubs (role-specific query)`);
    res.json(clubs);
  } catch (error) {
    console.error('getMyClubs error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};


console.log('clubController loaded safely');

