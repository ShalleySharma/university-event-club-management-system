import React from 'react';

const RenderMeetings = ({ meetings = [], loading = false, userRole = 'student' }) => {
  const openAttendanceModal = (meeting) => {
    const confirmed = window.confirm(`📱 Mark attendance for "${meeting.title}"?\n\nThis will record your attendance for this meeting.`);
    if (confirmed) {
      const token = localStorage.getItem('token');
      fetch(`http://localhost:5000/api/meetings/${meeting._id}/attend`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({})  // Backend /attend ignores qrData
      })
        .then(res => {
          if (!res.ok) {
            return res.text().then(text => {
              throw new Error(`HTTP ${res.status}: ${text.substring(0, 100)}`);
            });
          }
          return res.json();
        })
        .then(data => {
          alert(data.message || '✅ Attendance marked successfully!');
          // Optional: refresh meetings list via props callback
        })
        .catch(err => {
          console.error('Attendance error:', err);
          alert(`❌ Error: ${err.message}`);
        });
    }
  };

  return (
    <section className="teacher-meetings-section">
      <div className="teacher-section-header">
        <h3>👥 Meetings</h3>
        <span className="teacher-club-count">{meetings.length} meetings</span>
      </div>

      {loading ? (
        <div className="teacher-loading">Loading meetings...</div>
      ) : meetings.length === 0 ? (
        <div className="teacher-empty-state">
          <div className="teacher-empty-state-icon">👥</div>
          <p>No meetings available</p>
        </div>
      ) : (
        <div className="teacher-events-table-container">
          <table className="teacher-events-table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Club</th>
                <th>Date</th>
                <th>Time</th>
                <th>Location</th>
                <th>Attendees</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {meetings.map(meeting => {
                const myAttendance = meeting.attendances?.find(att => 
                  att.student && att.student._id === (localStorage.getItem('userId') || 'currentStudentId')
                ) || meeting.attendances?.find(att => att.student?._id === 'currentStudentId');
                
                return (
                  <tr key={meeting._id}>
                    <td><strong>{meeting.title}</strong></td>
                    <td>{meeting.club?.name || 'N/A'}</td>
                    <td>{new Date(meeting.date).toLocaleDateString()}</td>
                    <td>{meeting.startTime} - {meeting.endTime}</td>
                    <td>{meeting.location}</td>
                    <td>{meeting.attendances?.length || 0}</td>
                    <td><span className={`status-badge status-${meeting.status || 'scheduled'}`}>{meeting.status || 'Scheduled'}</span></td>
                    <td>
                      {userRole === 'student' ? (
                        myAttendance ? (
                          <span className={`status-badge status-${myAttendance.status}`}>
                            {myAttendance.status === 'approved' ? '✅ Attended' : 
                             myAttendance.status === 'scanned' ? '⏳ Pending' : '❌ Rejected'}
                          </span>
                        ) : (
                          <button 
                            className="teacher-btn-join teacher-btn-small" 
                            onClick={() => openAttendanceModal(meeting)}
                          >
                            📱 Mark Attendance
                          </button>
                        )
                      ) : (
                        meeting.qrImage ? (
                          <img src={meeting.qrImage} alt="QR" style={{width: '24px', height: '24px', verticalAlign: 'middle', cursor: 'pointer'}} 
                               title="QR Code - Show on projector" />
                        ) : 'No QR'
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
};

export default RenderMeetings;

