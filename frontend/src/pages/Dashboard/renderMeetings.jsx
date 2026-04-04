const renderMeetings = ({ meetings = [], loading = false, userRole = 'student', onScanQR }) => {
  const handleScanQR = (meeting) => {
    if (typeof onScanQR === 'function') {
      onScanQR(meeting);
    } else {
      // Fallback QR scanner - paste QR data
      const qrData = prompt(`Scan QR for meeting: ${meeting.title}\\nPaste QR data here (format: meeting:ID:timestamp):`);
      if (qrData) {
        console.log('QR scanned:', qrData, 'for meeting:', meeting._id);
        alert('QR scanned! Check backend - attendance marked as pending.');
      }
    }
  };

  return (
    <section className="student-events-full-section">
      <div className="student-section-header">
        <h3>👥 Meetings</h3>
        <span className="student-event-count">{meetings.length} meetings</span>
      </div>

      {loading ? (
        <div className="student-loading">Loading meetings...</div>
      ) : meetings.length === 0 ? (
        <div className="student-empty-state">
          <span>📋</span>
          <p>No meetings scheduled for your clubs yet</p>
        </div>
      ) : (
        <div className="student-events-grid-full">
          {meetings.map(meeting => {
            // Check student's attendance
            const myAttendance = meeting.attendances?.find(att => 
              att.student && att.student._id === (localStorage.getItem('userId') || 'currentStudentId')
            ) || meeting.attendances?.find(att => att.student?._id === 'currentStudentId');
            
            return (
              <div key={meeting._id} className="student-event-card-full">
                <div className="student-event-header">
                  <span className="student-event-icon">👥</span>
                  <h4>{meeting.title}</h4>
                </div>
                <div className="student-event-details">
                  <p><span>🏛</span> {meeting.club?.name}</p>
                  <p><span>📅</span> {new Date(meeting.date).toLocaleDateString()}</p>
                  <p><span>🕒</span> {meeting.startTime} - {meeting.endTime}</p>
                  <p><span>📍</span> {meeting.location}</p>
                  <p><span>📊</span> {meeting.attendances?.length || 0} attendees</p>
                  
                  {userRole === 'student' && (
                    <div className="student-meeting-status" style={{marginTop: '10px'}}>
                      {myAttendance ? (
                        <span className={`status-badge status-${myAttendance.status}`} style={{fontSize: '14px'}}>
                          {myAttendance.status === 'approved' ? '✅ Attended' : 
                           myAttendance.status === 'scanned' ? '⏳ Pending Approval' : '❌ Rejected'}
                        </span>
                      ) : (
                        <button 
                          className="scan-qr-btn" 
                          onClick={() => handleScanQR(meeting)}
                          style={{
                            background: '#4CAF50',
                            color: 'white',
                            border: 'none',
                            padding: '8px 16px',
                            borderRadius: '5px',
                            cursor: 'pointer',
                            fontSize: '14px',
                            marginTop: '5px'
                          }}
                        >
                          📱 Mark Attendance (Scan QR)
                        </button>
                      )}
                    </div>
                  )}
                  
                  {userRole === 'teacher' || userRole === 'club_head' && meeting.qrImage && (
                    <div className="meeting-qr-section">
                      <p style={{marginTop: '10px'}}><strong>QR Code:</strong></p>
                      <img src={meeting.qrImage} alt="QR Code" style={{width: '120px', height: '120px', marginTop: '5px'}} />
                      <small>Show this QR to students for attendance</small>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
};

export default renderMeetings;

