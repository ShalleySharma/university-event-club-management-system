const express = require('express');
const router = express.Router();
const { isAuthenticated, authorizeRoles } = require('../middleware/authMiddleware');
const meetingController = require('../controllers/meetingController');

// GET /api/meetings/my-meetings - Teacher/Coordinator gets their meetings
router.get('/my-meetings', isAuthenticated, meetingController.getMyMeetings);

// POST /api/meetings - Create meeting (teacher)
router.post('/', isAuthenticated, authorizeRoles('teacher'), meetingController.createMeeting);

// DELETE /api/meetings/:id - Teacher deletes meeting
router.delete('/:id', isAuthenticated, authorizeRoles('teacher'), meetingController.deleteMeeting);

// POST /api/meetings/attendance/mark - Student marks tentative attendance via QR
router.post('/attendance/mark', isAuthenticated, authorizeRoles('student', 'coordinator'), meetingController.markTentativeAttendance);

// PATCH /api/meetings/attendance/:attendanceId/approve - Coordinator approves
router.patch('/attendance/:attendanceId/approve', isAuthenticated, authorizeRoles('coordinator'), meetingController.approveAttendance);

// PATCH /api/meetings/attendance/:attendanceId/reject - Coordinator rejects
router.patch('/attendance/:attendanceId/reject', isAuthenticated, authorizeRoles('coordinator'), meetingController.rejectAttendance);

// GET /api/meetings/:meetingId/stats - Attendance stats
router.get('/:meetingId/stats', isAuthenticated, meetingController.getMeetingAttendanceStats);

module.exports = router;

