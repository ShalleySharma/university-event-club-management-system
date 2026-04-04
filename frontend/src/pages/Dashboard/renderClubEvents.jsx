const renderClubEvents = ({ events = [], loading = false, isStudent = false }) => (
  <section className="student-events-full-section">
    <div className="student-section-header">
      <h3>📅 My Club Events</h3>
      <span className="student-event-count">{events.length} events</span>
    </div>

    {loading ? (
      <div className="student-loading">Loading events...</div>
    ) : events.length === 0 ? (
      <div className="student-empty-state">
        <span>📅</span>
        <p>No events from your clubs yet</p>
      </div>
    ) : (
      <div className="student-events-grid-full">
        {events.map(event => (
          <div key={event._id} className="student-event-card-full">
            <div className="student-event-header">
              <span className="student-event-icon">📌</span>
              <h4>{event.eventName}</h4>
            </div>
            <div className="student-event-details">
              <p><span>🏛</span> {event.clubName}</p>
              <p><span>📅</span> {event.date}</p>
              <p><span>🕒</span> {event.startTime} - {event.endTime || event.time}</p>
              <p><span>📍</span> {event.location}</p>
              <p><span>👥</span> {event.registrationCount || 0} registered</p>
              {isStudent && event.isRegistered && (
                <span className="status-badge status-approved">✓ Registered</span>
              )}
            </div>
          </div>
        ))}
      </div>
    )}
  </section>
);

export default renderClubEvents;
