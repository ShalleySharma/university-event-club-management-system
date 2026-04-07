import React, { useEffect, useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";
import "./StudentDashboard_Light.css";
import fetchStudentMeetings from './fetchStudentMeetings';
import renderMeetings from './renderMeetings';

const StudentDashboard = ({ user }) => {
  const navigate = useNavigate();
  const { logout } = useContext(AuthContext);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activeSection, setActiveSection] = useState("dashboard");
  
  // Dashboard state
  const [dashboardStats, setDashboardStats] = useState({
    totalClubs: 0,
    totalEvents: 0,
    totalMembers: 0,
    upcomingEvents: 0,
    pendingApprovals: 0,
  });
  const [recentClubs, setRecentClubs] = useState([]);
  const [recentEvents, setRecentEvents] = useState([]);
  const [myClubs, setMyClubs] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Student-specific states
  const [allEvents, setAllEvents] = useState([]);
  const [joinedClubs, setJoinedClubs] = useState([]);
  const [clubEvents, setClubEvents] = useState([]);
  const [clubEventsLoading, setClubEventsLoading] = useState(false);
  const [meetings, setMeetings] = useState([]);
  const [meetingsLoading, setMeetingsLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  const handleJoinMeeting = (meeting) => {
    console.log('Joining meeting:', meeting._id);
    alert(`✅ Joined ${meeting.title}! Attendance recorded.`);
  };

  // Student modals
  const [showClubDetailsModal, setShowClubDetailsModal] = useState(false);
  const [selectedClub, setSelectedClub] = useState(null);
  const [clubDetails, setClubDetails] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [showEventDetailsModal, setShowEventDetailsModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);

  useEffect(() => {
    fetchJoinedClubs();
    fetchStudentClubs();
    
    if (activeSection === "dashboard") {
      fetchDashboardStats();
    } else if (activeSection === "clubs") {
      fetchAllClubs();
    } else if (activeSection === "events") {
      import('./fetchClubEvents').then(({ default: fetchClubEvents }) => {
        fetchClubEvents(setClubEvents, setClubEventsLoading);
      });
    } else if (activeSection === "meetings") {
      fetchStudentMeetings(setMeetings, setMeetingsLoading);
    }
  }, [activeSection]);

  // Student fetch functions with API_URL
  const fetchStudentClubs = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'https://university-event-club-management-system.onrender.com'}/api/clubs`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setMyClubs(data.slice(0, 5));
        setLoading(false);
      }
    } catch (err) {
      console.error("Error:", err);
    }
  };

  const fetchDashboardStats = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'https://university-event-club-management-system.onrender.com'}/api/events/student/stats`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setDashboardStats({
          totalClubs: data.joinedClubs,
          totalEvents: data.registeredEvents,
          totalMembers: data.joinedClubs * 10,
          upcomingEvents: data.upcomingEvents?.length || 0
        });
      }
    } catch (err) {
      console.error("Stats error:", err);
    }
  };

  const fetchAllClubs = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'https://university-event-club-management-system.onrender.com'}/api/clubs`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setMyClubs(data);
      }
    } catch (err) {
      console.error("Clubs error:", err);
    }
  };

  const fetchJoinedClubs = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'https://university-event-club-management-system.onrender.com'}/api/clubs/student/my-clubs`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setJoinedClubs(data);
      }
    } catch (err) {
      console.error("Joined clubs error:", err);
    }
  };

  const fetchAllEvents = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'https://university-event-club-management-system.onrender.com'}/api/events/all`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setAllEvents(data);
      }
    } catch (err) {
      console.error("All events error:", err);
    }
  };

  const fetchMeetings = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'https://university-event-club-management-system.onrender.com'}/api/meetings`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setMeetings(data);
      }
    } catch (err) {
      console.error("Meetings error:", err);
    }
  };

  // Handlers with API_URL
  const handleViewClub = async (club) => {
    setSelectedClub(club);
    setShowClubDetailsModal(true);
    setDetailsLoading(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'https://university-event-club-management-system.onrender.com'}/api/clubs/${club._id}/details`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setClubDetails(data);
      }
    } catch (err) {
      console.error("Club details error:", err);
    } finally {
      setDetailsLoading(false);
    }
  };

  const handleJoinClub = async (clubId) => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'https://university-event-club-management-system.onrender.com'}/api/clubs/${clubId}/join`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        setSuccess("Joined club successfully!");
        fetchJoinedClubs();
        fetchStudentClubs();
        setTimeout(() => setSuccess(""), 3000);
      }
    } catch (err) {
      setError("Join failed");
    }
  };

  const handleRegisterEvent = async (eventId) => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'https://university-event-club-management-system.onrender.com'}/api/events/${eventId}/register`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        setSuccess("Registered for event!");
        fetchAllEvents();
        setTimeout(() => setSuccess(""), 3000);
      }
    } catch (err) {
      setError("Registration failed");
    }
  };

  const handleViewEvent = (event) => {
    navigate(`/event/${event._id}`);
  };

  // Render functions (unchanged UI)
  const renderMyClubsSection = () => (
    <section className="teacher-clubs-section">
      {joinedClubs.length > 0 && (
        <>
          <div className="teacher-section-header">
            <h3>⭐ Joined Clubs</h3>
            <span className="teacher-club-count">{joinedClubs.length} joined</span>
          </div>
          <div className="teacher-clubs-grid">
            {joinedClubs.map(club => (
              <div key={club._id} className="teacher-club-card">
                <div className="teacher-club-logo">
                  {club.logo ? <img src={club.logo} alt={club.name} /> : <span>🏛</span>}
                </div>
                <div className="teacher-club-info">
                  <h4>{club.name}</h4>
                  <p className="teacher-club-description">{club.description}</p>
                  <div className="teacher-club-stats">
                    <span>👥 {club.members?.length || 0} members</span>
                  </div>
                  <div className="teacher-club-actions">
                    <button className="teacher-btn-view" onClick={() => handleViewClub(club)}>View</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      <div className="teacher-section-header">
        <h3>🏛 Explore Clubs</h3>
        <span className="teacher-club-count">{myClubs.length} available</span>
      </div>
      {loading ? (
        <div className="teacher-loading">Loading...</div>
      ) : myClubs.length > 0 ? (
        <div className="teacher-clubs-grid">
          {myClubs.map(club => (
            <div key={club._id} className="teacher-club-card">
              <div className="teacher-club-logo">
                {club.logo ? <img src={club.logo} alt={club.name} /> : <span>🏛</span>}
              </div>
              <div className="teacher-club-info">
                <h4>{club.name}</h4>
                <p className="teacher-club-description">{club.description}</p>
                <div className="teacher-club-stats">
                  <span>👥 {club.members?.length || 0} members</span>
                  <span>📅 Events</span>
                </div>
                <div className="teacher-club-actions">
                  <button className="teacher-btn-view" onClick={() => handleViewClub(club)}>View</button>
                  {!club.isJoined && <button className="teacher-btn-join" onClick={() => handleJoinClub(club._id)}>Join</button>}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="teacher-empty-state">
          <div className="teacher-empty-state-icon">🏛</div>
          <p>No more clubs available.</p>
        </div>
      )}
    </section>
  );

  const renderEventsSection = () => (
    <section className="teacher-events-section">
      <div className="teacher-section-header">
        <h3>📅 My Joined Clubs Events</h3>
      </div>
      <div className="teacher-stats-row">
        <div className="teacher-stat-card-mini">
          <span className="stat-icon">📊</span>
          <div className="stat-content">
            <span className="stat-number">{clubEvents.length}</span>
            <span className="stat-label">Events</span>
          </div>
        </div>
      </div>
      {clubEventsLoading ? (
        <div className="teacher-loading">Loading joined clubs events...</div>
      ) : clubEvents.length > 0 ? (
        <div className="teacher-events-grid">
          {clubEvents.map(event => (
            <div key={event._id} className="teacher-club-card">
              <div className="teacher-club-logo">
                <span>📅</span>
              </div>
              <div className="teacher-club-info">
                <h4>{event.eventName}</h4>
                <p className="teacher-club-description">{event.clubName} • {event.date} • {event.startTime}-{event.endTime || 'TBD'}</p>
                <div className="teacher-club-stats">
                  <span>📍 {event.location || 'Online'}</span>
                </div>
                <div className="teacher-club-actions">
                  <button className="teacher-btn-view" onClick={() => handleViewEvent(event)}>View</button>
                  {!event.isRegistered && (
                    <button className="teacher-btn-join" onClick={() => handleRegisterEvent(event._id)}>
                      Register
                    </button>
                  )}
                  {event.isRegistered && <span className="status-badge status-approved">✓ Registered</span>}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="teacher-empty-state">
          <div className="teacher-empty-state-icon">📅</div>
          <p>Join a club to see its events! <br/> <small>Events from your joined clubs appear here.</small></p>
        </div>
      )}
    </section>
  );

  const renderProfileSection = () => (
    <section className="teacher-profile-section">
      <div className="teacher-profile-header">
        <div className="teacher-profile-avatar-large">
          <img src={`https://ui-avatars.com/api/?name=${user?.name}&background=2563EB&color=fff&size=150`} alt="Profile" />
        </div>
        <div className="teacher-profile-info">
          <h2>{user?.name || 'Student'}</h2>
          <p>{user?.email}</p>
          <span className="teacher-role-badge">👨‍🎓 Student</span>
        </div>
      </div>
    </section>
  );

  const toggleSidebar = () => setSidebarCollapsed(!sidebarCollapsed);
  const handleLogout = () => {
    logout();
    navigate('/');
    window.location.reload();
  };

  return (
    <div className="teacher-dashboard">
      <aside className={`teacher-sidebar ${sidebarCollapsed ? 'collapsed' : ''}`}>
        <div className="teacher-sidebar-header">
          <div className="teacher-logo">
            <span className="teacher-logo-icon">🎓</span>
            {!sidebarCollapsed && <span className="teacher-logo-text">Campus Connect</span>}
          </div>
          <button className="teacher-sidebar-toggle" onClick={toggleSidebar}>
            {sidebarCollapsed ? '→' : '←'}
          </button>
        </div>
        <nav className="teacher-sidebar-nav">
          <ul>
            <li className={activeSection === "dashboard" ? "active" : ""} onClick={() => setActiveSection("dashboard")}>
              <span className="teacher-nav-icon">📊</span>
              {!sidebarCollapsed && <span>Dashboard</span>}
            </li>
            <li className={activeSection === "myClubs" ? "active" : ""} onClick={() => setActiveSection("myClubs")}>
              <span className="teacher-nav-icon">🏛</span>
              {!sidebarCollapsed && <span>My Clubs</span>}
            </li>
            <li className={activeSection === "events" ? "active" : ""} onClick={() => setActiveSection("events")}>
              <span className="teacher-nav-icon">📅</span>
              {!sidebarCollapsed && <span>Events</span>}
            </li>
            <li className={activeSection === "meetings" ? "active" : ""} onClick={() => setActiveSection("meetings")}>
              <span className="teacher-nav-icon">👥</span>
              {!sidebarCollapsed && <span>Meetings</span>}
            </li>
            <li className={activeSection === "profile" ? "active" : ""} onClick={() => setActiveSection("profile")}>
              <span className="teacher-nav-icon">👤</span>
              {!sidebarCollapsed && <span>Profile</span>}
            </li>
            <li className="logout" onClick={handleLogout}>
              <span className="teacher-nav-icon">🚪</span>
              {!sidebarCollapsed && <span>Logout</span>}
            </li>
          </ul>
        </nav>
      </aside>

      <main className="teacher-main-content">
        <header className="teacher-top-navbar">
          <div className="teacher-navbar-left">
            <h1>
              {activeSection === "dashboard" && "Student Dashboard"}
              {activeSection === "myClubs" && "My Clubs"}
              {activeSection === "events" && "Events"}
              {activeSection === "meetings" && "Meetings"}
              {activeSection === "profile" && "My Profile"}
            </h1>
          </div>
          <div className="teacher-navbar-right">
            <div className="teacher-date-time">
              <span>{new Date().toLocaleDateString()}</span>
            </div>
            <div className="teacher-profile-dropdown">
              <img src={`https://ui-avatars.com/api/?name=${user?.name}&background=2563EB&color=fff`} alt="Profile" className="teacher-navbar-avatar" />
            </div>
          </div>
        </header>

        <div className="teacher-dashboard-content">
          {success && <div className="teacher-success-message">{success}</div>}
          {error && <div className="teacher-error-message">{error}</div>}

          {activeSection === "dashboard" && (
            <section className="teacher-dashboard-section">
              <div className="teacher-welcome-banner">
                <div className="teacher-welcome-content">
                  <div className="teacher-welcome-text">
                    <h2>👋 Welcome, {user?.name}!</h2>
                    <p>Student Dashboard - Explore & Join</p>
                  </div>
                  <div className="teacher-welcome-illustration">
                    <span>👨‍🎓</span>
                  </div>
                </div>
              </div>

              <div className="teacher-stats-grid">
                <div className="teacher-stat-card">
                  <div className="teacher-stat-icon" style={{ background: 'linear-gradient(135deg, #667eea, #764ba2)' }}>🏛</div>
                  <div className="teacher-stat-info">
                    <h3>{joinedClubs.length}</h3>
                    <p>Joined Clubs</p>
                  </div>
                </div>
                <div className="teacher-stat-card">
                  <div className="teacher-stat-icon" style={{ background: 'linear-gradient(135deg, #f093fb, #f5576c)' }}>📅</div>
                  <div className="teacher-stat-info">
                    <h3>{dashboardStats.totalEvents}</h3>
                    <p>Events</p>
                  </div>
                </div>
                <div className="teacher-stat-card">
                  <div className="teacher-stat-icon" style={{ background: 'linear-gradient(135deg, #4facfe 00f2fe)' }}>⏰</div>
                  <div className="teacher-stat-info">
                    <h3>{dashboardStats.upcomingEvents}</h3>
                    <p>Upcoming</p>
                  </div>
                </div>
              </div>

              {joinedClubs.length > 0 && (
                <div className="teacher-recent-section">
                  <div className="teacher-section-header">
                    <h3>⭐ Recent Joined Clubs</h3>
                  </div>
                  <div className="teacher-clubs-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem' }}>
                    {joinedClubs.slice(0, 3).map(club => (
                      <div key={club._id} className="teacher-club-card">
                        <div className="teacher-club-logo">
                          {club.logo ? <img src={club.logo} alt={club.name} /> : <span>🏛</span>}
                        </div>
                        <div className="teacher-club-info">
                          <h4>{club.name}</h4>
                          <p>{club.description?.substring(0, 80)}...</p>
                          <button className="teacher-btn-view" onClick={() => setActiveSection("myClubs")}>View All</button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="teacher-quick-actions">
                <h3>⚡ Quick Actions</h3>
                <div className="teacher-action-buttons">
                  <button className="teacher-action-btn" onClick={() => setActiveSection("myClubs")}>
                    <span>🏛</span> Browse Clubs
                  </button>
                  <button className="teacher-action-btn" onClick={() => setActiveSection("events")}>
                    <span>📅</span> Find Events
                  </button>
                </div>
              </div>
            </section>
          )}
          {activeSection === "myClubs" && renderMyClubsSection()}
          {activeSection === "events" && renderEventsSection()}
          {activeSection === "meetings" && renderMeetings({ meetings, loading: meetingsLoading, userRole: 'student', onScanQR: handleJoinMeeting })}
          {activeSection === "profile" && renderProfileSection()}
        </div>
      </main>
    </div>
  );
};

export default StudentDashboard;
