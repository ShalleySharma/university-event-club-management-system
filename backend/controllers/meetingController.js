const Meeting = require('../models/Meeting');
const MeetingAttendance = require('../models/MeetingAttendance');
const QRCode = require('qrcode');
const User = require('../models/User');
const Club = require('../models/Club');
const mongoose = require('mongoose');

// Get user's meetings (teacher, club_head, student, coordinator)
const getMyMeetings = async (req, res) => {
  try {
    const user = req.user || {};
    const role = user.role || 'unknown';
    const id = user.id || user._id;
    const email = (user.email || '').trim();
    let query = { status: { $ne: 'cancelled' } };
    console.log(`User: role=${role}, id=${id}, email='${email}'`);

    // Teachers see meetings for clubs they created
    if (role === 'teacher') {
      const clubs = await Club.find({ createdBy: id });
      const clubIds = clubs.map(c => c._id);
      console.log(`Teacher ${id} - Found ${clubIds.length} clubs`);
      query.club = { $in: clubIds };
    } 
    // Club heads see meetings for their clubs (created, member, or convener)
    else if (role === 'club_head') {
      // Clubs they created
      const createdClubs = await Club.find({ createdBy: id });
      // Clubs they're members of (approved)
      const memberClubs = await Club.find({ 
        members: id,
        status: 'approved'
      });
      // Clubs where they're convener (case-insensitive email match)
      const convenerQuery = email ? { 'convener.email': { $regex: new RegExp(`^${email.trim()}$`, 'i') } } : {};
      const convenerClubs = await Club.find({
        ...convenerQuery,
        status: 'approved'
      });
      console.log(`ClubHead ${email} - Found ${convenerClubs.length} convener clubs`);
      
      const allClubs = [...createdClubs, ...memberClubs, ...convenerClubs];
      const uniqueClubIds = [...new Set(allClubs.map(c => c._id))];
      console.log(`ClubHead ${email} - Total unique clubs: ${uniqueClubIds.length} (created:${createdClubs.length}, member:${memberClubs.length}, convener:${convenerClubs.length})`);
      query.club = { $in: uniqueClubIds };
    }
    // Students see meetings for clubs they're members of
    else if (role === 'student') {
      const clubs = await Club.find({ 
        members: id,
        status: 'approved'
      });
      const clubIds = clubs.map(c => c._id);
      query.club = { $in: clubIds };
    }
    // Coordinators see meetings for clubs they're members of
    else if (role === 'coordinator') {
      const clubs = await Club.find({ 
        members: id,
        status: 'approved'
      });
      const clubIds = clubs.map(c => c._id);
      query.club = { $in: clubIds };
    }

    const meetings = await Meeting.find(query)
      .populate('club', 'name')
      .populate('createdBy', 'name email')
      .populate('attendances', 'student status')
      .sort({ date: -1 });

    res.json(meetings);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Create meeting
const createMeeting = async (req, res) => {
  try {
    const meeting = new Meeting({
      ...req.body,
      createdBy: req.user.id
    });
    
    await meeting.save();
    
    // Generate QR code data AFTER save (ID exists)
    const qrData = `meeting:${meeting._id}:${Date.now()}`;
    meeting.qrCode = qrData;
    const qrUrl = await QRCode.toDataURL(qrData);
    meeting.qrImage = qrUrl;
    await meeting.save();

    const populatedMeeting = await Meeting.findById(meeting._id)
      .populate('club', 'name')
      .populate('createdBy', 'name email');

    res.status(201).json(populatedMeeting);
  } catch (err) {
    console.error('Create meeting error:', err);
    res.status(500).json({ message: err.message });
  }
};

// DELETE meeting (teacher)
const deleteMeeting = async (req, res) => {
  try {
    const { id } = req.params;
    const meeting = await Meeting.findById(id);
    
    if (!meeting) {
      return res.status(404).json({ message: 'Meeting not found' });
    }
    
    // Check authorization - teacher owns the meeting via club
    const clubs = await Club.find({ createdBy: req.user.id });
    const clubIds = clubs.map(c => c._id.toString());
    
    if (!clubIds.includes(meeting.club.toString())) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    
    // Delete meeting + cascade attendances
    await MeetingAttendance.deleteMany({ meeting: id });
    await Meeting.findByIdAndDelete(id);
    
    res.json({ message: 'Meeting deleted successfully' });
  } catch (err) {
    console.error('Delete meeting error:', err);
    res.status(500).json({ message: err.message });
  }
};

// Mark tentative attendance (student scans QR)
const markTentativeAttendance = async (req, res) => {
  try {
    const { qrData } = req.body; // From QR scan
    const parts = qrData.split(':');
    if (parts[0] !== 'meeting') {
      return res.status(400).json({ message: 'Invalid QR code' });
    }

    const meetingId = parts[1];
    const meeting = await Meeting.findById(meetingId);
    if (!meeting) {
      return res.status(404).json({ message: 'Meeting not found' });
    }

    // Check if already attended
    const existing = await MeetingAttendance.findOne({
      meeting: meetingId,
      student: req.user.id
    });
    if (existing) {
      return res.status(400).json({ message: 'Already marked attendance' });
    }

    const attendance = new MeetingAttendance({
      meeting: meetingId,
      student: req.user.id,
      status: 'scanned',
      scannedBy: req.user.id, // Coordinator who showed QR
      scanTime: new Date()
    });

    await attendance.save();
    meeting.attendances.push(attendance._id);
    await meeting.save();

    res.json({ message: 'Attendance marked successfully (pending approval)', attendance });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Coordinator approves attendance
const approveAttendance = async (req, res) => {
  try {
    const { attendanceId } = req.params;
    const attendance = await MeetingAttendance.findById(attendanceId).populate('meeting');
    
    if (!attendance) {
      return res.status(404).json({ message: 'Attendance not found' });
    }

    // Only coordinator can approve (check club membership/role)
    if (attendance.status !== 'scanned') {
      return res.status(400).json({ message: 'Attendance already processed' });
    }

    attendance.status = 'approved';
    attendance.approvedBy = req.user.id;
    attendance.approveTime = new Date();
    await attendance.save();

    res.json({ message: 'Attendance approved', attendance });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Reject attendance
const rejectAttendance = async (req, res) => {
  try {
    const { attendanceId } = req.params;
    const attendance = await MeetingAttendance.findById(attendanceId);
    
    if (!attendance || attendance.status !== 'scanned') {
      return res.status(400).json({ message: 'Cannot reject' });
    }

    attendance.status = 'rejected';
    attendance.approvedBy = req.user.id;
    attendance.approveTime = new Date();
    await attendance.save();

    res.json({ message: 'Attendance rejected', attendance });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get attendance stats for meeting
const getMeetingAttendanceStats = async (req, res) => {
  try {
    const { meetingId } = req.params;
    const stats = await MeetingAttendance.aggregate([
      { $match: { meeting: mongoose.Types.ObjectId(meetingId) } },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 }
        }
      }
    ]);

    res.json(stats);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = {
  getMyMeetings,
  createMeeting,
  deleteMeeting,
  markTentativeAttendance,
  approveAttendance,
  rejectAttendance,
  getMeetingAttendanceStats
};
