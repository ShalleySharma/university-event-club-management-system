import React, { useEffect, useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";
import "./TeacherDashboard.css";

const TeacherDashboard = ({ user }) => {
  const navigate = useNavigate();
  const { logout } = useContext(AuthContext);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activeSection, setActiveSection] = useState("myClubs");
  
  // Clubs state
  const [myClubs, setMyClubs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateClubModal, setShowCreateClubModal] = useState(false);
  const [showEditClubModal, setShowEditClubModal] = useState(false);
  const [showClubDetailsModal, setShowClubDetailsModal] = useState(false);
  const [selectedClub, setSelectedClub] = useState(null);
  const [clubDetails, setClubDetails] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [editingClub, setEditingClub] = useState(null);
  
  // Events state
  const [myEvents, setMyEvents] = useState([]);
  const [eventsLoading, setEventsLoading] = useState(true);
  const [showCreateEventModal, setShowCreateEventModal] = useState(false);
  const [showEditEventModal, setShowEditEventModal] = useState(false);
  const [showEventDetailsModal, setShowEventDetailsModal] = useState(false);
  const [showParticipantsModal, setShowParticipantsModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [eventDetails, setEventDetails] = useState(null);
  const [eventParticipants, setEventParticipants] = useState([]);
  const [editingEvent, setEditingEvent] = useState(null);
  const [eventStats, setEventStats] = useState({ totalEvents: 0, upcomingEvents: 0, pastEvents: 0, totalRegistrations: 0 });
  
  // Form state
  const [clubFormData, setClubFormData] = useState({
    name: "",
    description: "",
    category: "Technical",
    logo: ""
  });
  const [eventFormData, setEventFormData] = useState({
    eventName: "",
    clubId: "",
    date: "",
    time: "",
    location: "",
    description: "",
    maxParticipants: "",
    poster: ""
  });
  
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    fetchMyClubs();
  }, []);

  useEffect(() => {
    if (activeSection === "events") {
      fetchMyEvents();
      fetchEventStats();
    }
  }, [activeSection]);

  // ==================== CLUBS ====================
  const fetchMyClubs = async () => {
    try {
      const response = await fetch("http://localhost:5000/api/clubs/my-clubs", {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
      });
      const data = await response.json();
      setMyClubs(data);
    } catch (err) {
      console.error("Error fetching clubs:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleClubInputChange = (e) => {
    setClubFormData({ ...clubFormData, [e.target.name]: e.target.value });
  };

  const handleCreateClub = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    try {
      const response = await fetch("http://localhost:5000/api/clubs", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`
        },
        body: JSON.stringify(clubFormData)
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess("Club created successfully! Waiting for admin approval.");
        setShowCreateClubModal(false);
        setClubFormData({ name: "", description: "", category: "Technical", logo: "" });
        fetchMyClubs();
        setTimeout(() => setSuccess(""), 3000);
      } else {
        setError(data.message || "Failed to create club");
      }
    } catch (err) {
      setError("Network error. Please try again.");
    }
  };

  const handleEditClub = (club) => {
    setEditingClub(club);
    setClubFormData({
      name: club.name,
      description: club.description,
      category: club.category || "Technical",
      logo: club.logo || ""
    });
    setShowEditClubModal(true);
  };

  const handleUpdateClub = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    try {
      const response = await fetch(`http://localhost:5000/api/clubs/${editingClub._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`
        },
        body: JSON.stringify(clubFormData)
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess("Club updated successfully!");
        setShowEditClubModal(false);
        setEditingClub(null);
        setClubFormData({ name: "", description: "", category: "Technical", logo: "" });
        fetchMyClubs();
        setTimeout(() => setSuccess(""), 3000);
      } else {
        setError(data.message || "Failed to update club");
      }
    } catch (err) {
      setError("Network error. Please try again.");
    }
  };

  const handleDeleteClub = async (clubId) => {
    if (!window.confirm("Are you sure you want to delete this club?")) return;
    setError("");
    setSuccess("");

    try {
      const response = await fetch(`http://localhost:5000/api/clubs/${clubId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
      });

      const data = await response.json();
      if (response.ok) {
        setSuccess("Club deleted successfully!");
        fetchMyClubs();
        setTimeout(() => setSuccess(""), 3000);
      } else {
        setError(data.message || "Failed to delete club");
      }
    } catch (err) {
      setError("Network error. Please try again.");
    }
  };

  const handleViewClub = async (club) => {
    setSelectedClub(club);
    setShowClubDetailsModal(true);
    setDetailsLoading(true);

    try {
      const response = await fetch(`http://localhost:5000/api/clubs/${club._id}/details`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
      });
      const data = await response.json();
      if (response.ok) {
        setClubDetails(data);
      } else {
        setError(data.message || "Failed to load club details");
      }
    } catch (err) {
      setError("Network error. Please try again.");
    } finally {
      setDetailsLoading(false);
    }
  };

  const handleRemoveMember = async (memberId) => {
    if (!window.confirm("Are you sure you want to remove this member?")) return;

    try {
      const response = await fetch(
        `http://localhost:5000/api/clubs/${selectedClub._id}/members/${memberId}`,
        { method: "DELETE", headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
      );
      const data = await response.json();
      if (response.ok) {
        setSuccess("Member removed successfully!");
        handleViewClub(selectedClub);
        fetchMyClubs();
        setTimeout(() => setSuccess(""), 3000);
      } else {
        setError(data.message || "Failed to remove member");
      }
    } catch (err) {
      setError("Network error. Please try again.");
    }
  };

  // ==================== EVENTS ====================
  const fetchMyEvents = async () => {
    setEventsLoading(true);
    try {
      const response = await fetch("http://localhost:5000/api/events/my-events", {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
      });
      const data = await response.json();
      setMyEvents(data);
    } catch (err) {
      console.error("Error fetching events:", err);
    } finally {
      setEventsLoading(false);
    }
  };

  const fetchEventStats = async () => {
    try {
      const response = await fetch("http://localhost:5000/api/events/stats", {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
      });
      const data = await response.json();
      setEventStats(data);
    } catch (err) {
      console.error("Error fetching event stats:", err);
    }
  };

  const handleEventInputChange = (e) => {
    setEventFormData({ ...eventFormData, [e.target.name]: e.target.value });
  };

  const handleCreateEvent = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    try {
      const response = await fetch("http://localhost:5000/api/events", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`
        },
        body: JSON.stringify(eventFormData)
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess("Event created successfully!");
        setShowCreateEventModal(false);
        setEventFormData({ eventName: "", clubId: "", date: "", time: "", location: "", description: "", maxParticipants: "", poster: "" });
        fetchMyEvents();
        fetchEventStats();
        setTimeout(() => setSuccess(""), 3000);
      } else {
        setError(data.message || "Failed to create event");
      }
    } catch (err) {
      setError("Network error. Please try again.");
    }
  };

  const handleEditEvent = (event) => {
    setEditingEvent(event);
    setEventFormData({
      eventName: event.eventName,
      clubId: event.clubId?._id || event.clubId,
      date: event.date,
      time: event.time,
      location: event.location,
      description: event.description,
      maxParticipants: event.maxParticipants || "",
      poster: event.poster || ""
    });
    setShowEditEventModal(true);
  };

  const handleUpdateEvent = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    try {
      const response = await fetch(`http://localhost:5000/api/events/${editingEvent._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`
        },
        body: JSON.stringify(eventFormData)
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess("Event updated successfully!");
        setShowEditEventModal(false);
        setEditingEvent(null);
        setEventFormData({ eventName: "", clubId: "", date: "", time: "", location: "", description: "", maxParticipants: "", poster: "" });
        fetchMyEvents();
        fetchEventStats();
        setTimeout(() => setSuccess(""), 3000);
      } else {
        setError(data.message || "Failed to update event");
      }
    } catch (err) {
      setError("Network error. Please try again.");
    }
  };

  const handleDeleteEvent = async (eventId) => {
    if (!window.confirm("Are you sure you want to delete this event?")) return;
    setError("");
    setSuccess("");

    try {
      const response = await fetch(`http://localhost:5000/api/events/${eventId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
      });

      const data = await response.json();
      if (response.ok) {
        setSuccess("Event deleted successfully!");
        fetchMyEvents();
        fetchEventStats();
        setTimeout(() => setSuccess(""), 3000);
      } else {
        setError(data.message || "Failed to delete event");
      }
    } catch (err) {
      setError("Network error. Please try again.");
    }
  };

  const handleViewEvent = async (event) => {
    setSelectedEvent(event);
    setShowEventDetailsModal(true);

    try {
      const response = await fetch(`http://localhost:5000/api/events/${event._id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
      });
      const data = await response.json();
      if (response.ok) {
        setEventDetails(data);
      } else {
        setError(data.message || "Failed to load event details");
      }
    } catch (err) {
      setError("Network error. Please try again.");
    }
  };

  const handleViewParticipants = async (event) => {
    setSelectedEvent(event);
    setShowParticipantsModal(true);

    try {
      const response = await fetch(`http://localhost:5000/api/events/${event._id}/participants`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
      });
      const data = await response.json();
      if (response.ok) {
        setEventParticipants(data.participants);
      } else {
        setError(data.message || "Failed to load participants");
      }
    } catch (err) {
      setError("Network error. Please try again.");
    }
  };

  // ==================== RENDER SECTIONS ====================
  const toggleSidebar = () => setSidebarCollapsed(!sidebarCollapsed);

  const handleLogout = () => {
    logout();
    navigate('/');
    window.location.reload();
  };

  const renderMyClubsSection = () => (
    <section className="teacher-clubs-section">
      <div className="teacher-section-header">
        <h3>🏛 My Clubs</h3>
        <button className="teacher-btn-create" onClick={() => setShowCreateClubModal(true)}>
          + Create Club
        </button>
      </div>

      {success && <div className="teacher-success-message">{success}</div>}
      {error && <div className="teacher-error-message">{error}</div>}

      {loading ? (
        <div className="teacher-loading">Loading clubs...</div>
      ) : myClubs.length > 0 ? (
        <div className="teacher-clubs-grid">
          {myClubs.map(club => (
            <div key={club._id} className="teacher-club-card">
              <div className="teacher-club-logo">
                {club.logo ? <img src={club.logo} alt={club.name} /> : <span>🏛</span>}
              </div>
              <div className="teacher-club-info">
                <h4>{club.name}</h4>
                <p className="teacher-club-category">Category: {club.category || "General"}</p>
                <p className="teacher-club-description">{club.description}</p>
                <div className="teacher-club-stats">
                  <span>👥 {club.members?.length || 0} Members</span>
                  <span>📅 {club.eventsCount || 0} Events</span>
                </div>
                <div className="teacher-club-status">
                  <span className={`status-badge status-${club.status}`}>{club.status || "pending"}</span>
                </div>
                <div className="teacher-club-actions">
                  <button className="teacher-btn-view" onClick={() => handleViewClub(club)}>View</button>
                  <button className="teacher-btn-edit" onClick={() => handleEditClub(club)}>Edit</button>
                  <button className="teacher-btn-delete" onClick={() => handleDeleteClub(club._id)}>Delete</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="teacher-empty-state">
          <div className="teacher-empty-state-icon">🏛</div>
          <p>You haven't created any clubs yet.</p>
          <button className="teacher-btn-create" onClick={() => setShowCreateClubModal(true)}>
            + Create Your First Club
          </button>
        </div>
      )}
    </section>
  );

  const renderEventsSection = () => (
    <section className="teacher-events-section">
      <div className="teacher-section-header">
        <h3>📅 Events</h3>
        <button className="teacher-btn-create" onClick={() => setShowCreateEventModal(true)}>
          + Create Event
        </button>
      </div>

      {/* Statistics Cards */}
      <div className="teacher-stats-row">
        <div className="teacher-stat-card-mini">
          <span className="stat-icon">📊</span>
          <div className="stat-content">
            <span className="stat-number">{eventStats.totalEvents}</span>
            <span className="stat-label">Total Events</span>
          </div>
        </div>
        <div className="teacher-stat-card-mini">
          <span className="stat-icon">⏰</span>
          <div className="stat-content">
            <span className="stat-number">{eventStats.upcomingEvents}</span>
            <span className="stat-label">Upcoming</span>
          </div>
        </div>
        <div className="teacher-stat-card-mini">
          <span className="stat-icon">✅</span>
          <div className="stat-content">
            <span className="stat-number">{eventStats.pastEvents}</span>
            <span className="stat-label">Completed</span>
          </div>
        </div>
        <div className="teacher-stat-card-mini">
          <span className="stat-icon">👥</span>
          <div className="stat-content">
            <span className="stat-number">{eventStats.totalRegistrations}</span>
            <span className="stat-label">Registrations</span>
          </div>
        </div>
      </div>

      {success && <div className="teacher-success-message">{success}</div>}
      {error && <div className="teacher-error-message">{error}</div>}

      {/* Events Table */}
      {eventsLoading ? (
        <div className="teacher-loading">Loading events...</div>
      ) : myEvents.length > 0 ? (
        <div className="teacher-events-table-container">
          <table className="teacher-events-table">
            <thead>
              <tr>
                <th>Event Name</th>
                <th>Club</th>
                <th>Date</th>
                <th>Time</th>
                <th>Location</th>
                <th>Participants</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {myEvents.map(event => (
                <tr key={event._id}>
                  <td><strong>{event.eventName}</strong></td>
                  <td>{event.clubName}</td>
                  <td>{event.date}</td>
                  <td>{event.time}</td>
                  <td>{event.location}</td>
                  <td>{event.registrationCount || 0}</td>
                  <td className="actions-cell">
                    <button className="teacher-btn-view" onClick={() => handleViewEvent(event)}>View</button>
                    <button className="teacher-btn-edit" onClick={() => handleEditEvent(event)}>Edit</button>
                    <button className="teacher-btn-participants" onClick={() => handleViewParticipants(event)}>Participants</button>
                    <button className="teacher-btn-delete" onClick={() => handleDeleteEvent(event._id)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="teacher-empty-state">
          <div className="teacher-empty-state-icon">📅</div>
          <p>You haven't created any events yet.</p>
          <button className="teacher-btn-create" onClick={() => setShowCreateEventModal(true)}>
            + Create Your First Event
          </button>
        </div>
      )}
    </section>
  );

  const renderProfileSection = () => (
    <section className="teacher-profile-section">
      <div className="teacher-profile-header">
        <div className="teacher-profile-avatar-large">
          <img src={`https://ui-avatars.com/api/?name=${user?.name || 'Teacher'}&background=2563EB&color=fff&size=150`} alt="Profile" />
        </div>
        <div className="teacher-profile-info">
          <h2>{user?.name || 'Teacher'}</h2>
          <p>{user?.email || 'teacher@college.edu'}</p>
          <span className="teacher-role-badge">🎓 Teacher</span>
        </div>
      </div>
      <div className="teacher-profile-details">
        <div className="teacher-detail-card">
          <h4>📊 Stats</h4>
          <p>Clubs Created: {myClubs.length}</p>
          <p>Events Created: {eventStats.totalEvents}</p>
          <p>Total Members: {myClubs.reduce((acc, club) => acc + (club.members?.length || 0), 0)}</p>
        </div>
      </div>
    </section>
  );

  // ==================== MODALS ====================
  const renderClubDetailsModal = () => {
    if (!showClubDetailsModal) return null;
    return (
      <div className="teacher-modal-overlay" onClick={() => setShowClubDetailsModal(false)}>
        <div className="teacher-modal teacher-modal-large" onClick={(e) => e.stopPropagation()}>
          <div className="teacher-modal-header">
            <h3>🏛 Club Details</h3>
            <button className="teacher-modal-close" onClick={() => setShowClubDetailsModal(false)}>×</button>
          </div>
          {detailsLoading ? (
            <div className="teacher-loading">Loading...</div>
          ) : clubDetails ? (
            <div className="teacher-club-details">
              <div className="teacher-detail-section">
                <h4>📋 Club Information</h4>
                <div className="teacher-detail-grid">
                  <div className="teacher-detail-item">
                    <span className="teacher-detail-label">Club Name:</span>
                    <span className="teacher-detail-value">{clubDetails.club?.name}</span>
                  </div>
                  <div className="teacher-detail-item">
                    <span className="teacher-detail-label">Description:</span>
                    <span className="teacher-detail-value">{clubDetails.club?.description}</span>
                  </div>
                  <div className="teacher-detail-item">
                    <span className="teacher-detail-label">Category:</span>
                    <span className="teacher-detail-value">{clubDetails.club?.category || "General"}</span>
                  </div>
                  <div className="teacher-detail-item">
                    <span className="teacher-detail-label">Status:</span>
                    <span className={`status-badge status-${clubDetails.club?.status}`}>{clubDetails.club?.status || "pending"}</span>
                  </div>
                </div>
              </div>
              <div className="teacher-detail-section">
                <h4>📊 Statistics</h4>
                <div className="teacher-stats-cards">
                  <div className="teacher-stat-card"><span className="teacher-stat-icon">👥</span><span className="teacher-stat-number">{clubDetails.totalMembers}</span><span className="teacher-stat-label">Members</span></div>
                  <div className="teacher-stat-card"><span className="teacher-stat-icon">📅</span><span className="teacher-stat-number">{clubDetails.totalEvents}</span><span className="teacher-stat-label">Events</span></div>
                </div>
              </div>
              <div className="teacher-detail-section">
                <h4>👥 Club Members</h4>
                {clubDetails.members && clubDetails.members.length > 0 ? (
                  <table className="teacher-members-table">
                    <thead><tr><th>Name</th><th>Email</th><th>Action</th></tr></thead>
                    <tbody>
                      {clubDetails.members.map(member => (
                        <tr key={member._id}>
                          <td>{member.name || "Unknown"}</td>
                          <td>{member.email}</td>
                          <td><button className="teacher-btn-remove-member" onClick={() => handleRemoveMember(member._id)}>Remove</button></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : <p className="teacher-no-members">No members yet</p>}
              </div>
            </div>
          ) : <p>No details available</p>}
        </div>
      </div>
    );
  };

  const renderEventDetailsModal = () => {
    if (!showEventDetailsModal) return null;
    return (
      <div className="teacher-modal-overlay" onClick={() => setShowEventDetailsModal(false)}>
        <div className="teacher-modal" onClick={(e) => e.stopPropagation()}>
          <div className="teacher-modal-header">
            <h3>📅 Event Details</h3>
            <button className="teacher-modal-close" onClick={() => setShowEventDetailsModal(false)}>×</button>
          </div>
          {eventDetails ? (
            <div className="teacher-event-details">
              <div className="detail-row"><span className="detail-label">Event Name:</span><span className="detail-value">{eventDetails.event?.eventName}</span></div>
              <div className="detail-row"><span className="detail-label">Club:</span><span className="detail-value">{eventDetails.clubName}</span></div>
              <div className="detail-row"><span className="detail-label">Date:</span><span className="detail-value">{eventDetails.event?.date}</span></div>
              <div className="detail-row"><span className="detail-label">Time:</span><span className="detail-value">{eventDetails.event?.time}</span></div>
              <div className="detail-row"><span className="detail-label">Location:</span><span className="detail-value">{eventDetails.event?.location}</span></div>
              <div className="detail-row"><span className="detail-label">Description:</span><span className="detail-value">{eventDetails.event?.description}</span></div>
              <div className="detail-row"><span className="detail-label">Max Participants:</span><span className="detail-value">{eventDetails.event?.maxParticipants || "Unlimited"}</span></div>
              <div className="detail-row"><span className="detail-label">Registered:</span><span className="detail-value">{eventDetails.registrationCount} participants</span></div>
            </div>
          ) : <p>Loading...</p>}
        </div>
      </div>
    );
  };

  const renderParticipantsModal = () => {
    if (!showParticipantsModal) return null;
    return (
      <div className="teacher-modal-overlay" onClick={() => setShowParticipantsModal(false)}>
        <div className="teacher-modal" onClick={(e) => e.stopPropagation()}>
          <div className="teacher-modal-header">
            <h3>👥 Event Participants</h3>
            <button className="teacher-modal-close" onClick={() => setShowParticipantsModal(false)}>×</button>
          </div>
          <div className="teacher-participants-list">
            {eventParticipants.length > 0 ? (
              <ul>
                {eventParticipants.map((participant, index) => (
                  <li key={participant._id}>
                    <span className="participant-number">{index + 1}.</span>
                    <span className="participant-name">{participant.name}</span>
                    <span className="participant-email">{participant.email}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="no-participants">No participants registered yet.</p>
            )}
          </div>
        </div>
      </div>
    );
  };

  // ==================== MAIN RENDER ====================
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
            <li className={activeSection === "myClubs" ? "active" : ""} onClick={() => setActiveSection("myClubs")}>
              <span className="teacher-nav-icon">🏛</span>
              {!sidebarCollapsed && <span>My Clubs</span>}
            </li>
            <li className={activeSection === "events" ? "active" : ""} onClick={() => setActiveSection("events")}>
              <span className="teacher-nav-icon">📅</span>
              {!sidebarCollapsed && <span>Events</span>}
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
              {activeSection === "myClubs" && "My Clubs"}
              {activeSection === "events" && "Events"}
              {activeSection === "profile" && "My Profile"}
            </h1>
          </div>
          <div className="teacher-navbar-right">
            <div className="teacher-date-time">
              <span>{new Date().toLocaleDateString()}</span>
            </div>
            <div className="teacher-profile-dropdown" onClick={() => setActiveSection("profile")}>
              <img src={`https://ui-avatars.com/api/?name=${user?.name || 'Teacher'}&background=2563EB&color=fff`} alt="Profile" className="teacher-navbar-avatar" />
            </div>
          </div>
        </header>

        <div className="teacher-dashboard-content">
          {activeSection === "myClubs" && renderMyClubsSection()}
          {activeSection === "events" && renderEventsSection()}
          {activeSection === "profile" && renderProfileSection()}
        </div>
      </main>

      {/* Create Club Modal */}
      {showCreateClubModal && (
        <div className="teacher-modal-overlay" onClick={() => setShowCreateClubModal(false)}>
          <div className="teacher-modal" onClick={(e) => e.stopPropagation()}>
            <div className="teacher-modal-header">
              <h3>Create New Club</h3>
              <button className="teacher-modal-close" onClick={() => setShowCreateClubModal(false)}>×</button>
            </div>
            <form onSubmit={handleCreateClub}>
              <div className="teacher-form-group">
                <label>Club Name</label>
                <input type="text" name="name" value={clubFormData.name} onChange={handleClubInputChange} placeholder="e.g., AI Club" required />
              </div>
              <div className="teacher-form-group">
                <label>Description</label>
                <textarea name="description" value={clubFormData.description} onChange={handleClubInputChange} placeholder="Describe your club..." required />
              </div>
              <div className="teacher-form-group">
                <label>Category</label>
                <select name="category" value={clubFormData.category} onChange={handleClubInputChange}>
                  <option value="Technical">Technical</option>
                  <option value="Cultural">Cultural</option>
                  <option value="Sports">Sports</option>
                  <option value="Literary">Literary</option>
                  <option value="Social">Social Service</option>
                  <option value="Arts">Arts</option>
                  <option value="Science">Science</option>
                  <option value="General">General</option>
                </select>
              </div>
              <div className="teacher-form-group">
                <label>Logo URL (Optional)</label>
                <input type="text" name="logo" value={clubFormData.logo} onChange={handleClubInputChange} placeholder="https://example.com/logo.png" />
              </div>
              {error && <div className="teacher-form-error">{error}</div>}
              <button type="submit" className="teacher-btn-submit">Create Club</button>
            </form>
          </div>
        </div>
      )}

      {/* Edit Club Modal */}
      {showEditClubModal && (
        <div className="teacher-modal-overlay" onClick={() => setShowEditClubModal(false)}>
          <div className="teacher-modal" onClick={(e) => e.stopPropagation()}>
            <div className="teacher-modal-header">
              <h3>Edit Club</h3>
              <button className="teacher-modal-close" onClick={() => setShowEditClubModal(false)}>×</button>
            </div>
            <form onSubmit={handleUpdateClub}>
              <div className="teacher-form-group">
                <label>Club Name</label>
                <input type="text" name="name" value={clubFormData.name} onChange={handleClubInputChange} required />
              </div>
              <div className="teacher-form-group">
                <label>Description</label>
                <textarea name="description" value={clubFormData.description} onChange={handleClubInputChange} required />
              </div>
              <div className="teacher-form-group">
                <label>Category</label>
                <select name="category" value={clubFormData.category} onChange={handleClubInputChange}>
                  <option value="Technical">Technical</option>
                  <option value="Cultural">Cultural</option>
                  <option value="Sports">Sports</option>
                  <option value="Literary">Literary</option>
                  <option value="Social">Social Service</option>
                  <option value="Arts">Arts</option>
                  <option value="Science">Science</option>
                  <option value="General">General</option>
                </select>
              </div>
              <div className="teacher-form-group">
                <label>Logo URL</label>
                <input type="text" name="logo" value={clubFormData.logo} onChange={handleClubInputChange} placeholder="https://example.com/logo.png" />
              </div>
              {error && <div className="teacher-form-error">{error}</div>}
              <button type="submit" className="teacher-btn-submit">Update Club</button>
            </form>
          </div>
        </div>
      )}

      {/* Create Event Modal */}
      {showCreateEventModal && (
        <div className="teacher-modal-overlay" onClick={() => setShowCreateEventModal(false)}>
          <div className="teacher-modal" onClick={(e) => e.stopPropagation()}>
            <div className="teacher-modal-header">
              <h3>Create New Event</h3>
              <button className="teacher-modal-close" onClick={() => setShowCreateEventModal(false)}>×</button>
            </div>
            <form onSubmit={handleCreateEvent}>
              <div className="teacher-form-group">
                <label>Event Name</label>
                <input type="text" name="eventName" value={eventFormData.eventName} onChange={handleEventInputChange} placeholder="e.g., Hackathon 2026" required />
              </div>
              <div className="teacher-form-group">
                <label>Select Club</label>
                <select name="clubId" value={eventFormData.clubId} onChange={handleEventInputChange} required>
                  <option value="">Select a club</option>
                  {myClubs.filter(c => c.status === 'approved').map(club => (
                    <option key={club._id} value={club._id}>{club.name}</option>
                  ))}
                </select>
              </div>
              <div className="teacher-form-group">
                <label>Date</label>
                <input type="text" name="date" value={eventFormData.date} onChange={handleEventInputChange} placeholder="e.g., 20 March" required />
              </div>
              <div className="teacher-form-group">
                <label>Time</label>
                <input type="text" name="time" value={eventFormData.time} onChange={handleEventInputChange} placeholder="e.g., 10:00 AM" required />
              </div>
              <div className="teacher-form-group">
                <label>Location</label>
                <input type="text" name="location" value={eventFormData.location} onChange={handleEventInputChange} placeholder="e.g., Lab 3" required />
              </div>
              <div className="teacher-form-group">
                <label>Description</label>
                <textarea name="description" value={eventFormData.description} onChange={handleEventInputChange} placeholder="Describe your event..." required />
              </div>
              <div className="teacher-form-group">
                <label>Max Participants (Optional)</label>
                <input type="number" name="maxParticipants" value={eventFormData.maxParticipants} onChange={handleEventInputChange} placeholder="e.g., 50" />
              </div>
              <div className="teacher-form-group">
                <label>Event Poster URL (Optional)</label>
                <input type="text" name="poster" value={eventFormData.poster} onChange={handleEventInputChange} placeholder="https://example.com/poster.jpg" />
              </div>
              {error && <div className="teacher-form-error">{error}</div>}
              <button type="submit" className="teacher-btn-submit">Create Event</button>
            </form>
          </div>
        </div>
      )}

      {/* Edit Event Modal */}
      {showEditEventModal && (
        <div className="teacher-modal-overlay" onClick={() => setShowEditEventModal(false)}>
          <div className="teacher-modal" onClick={(e) => e.stopPropagation()}>
            <div className="teacher-modal-header">
              <h3>Edit Event</h3>
              <button className="teacher-modal-close" onClick={() => setShowEditEventModal(false)}>×</button>
            </div>
            <form onSubmit={handleUpdateEvent}>
              <div className="teacher-form-group">
                <label>Event Name</label>
                <input type="text" name="eventName" value={eventFormData.eventName} onChange={handleEventInputChange} required />
              </div>
              <div className="teacher-form-group">
                <label>Date</label>
                <input type="text" name="date" value={eventFormData.date} onChange={handleEventInputChange} required />
              </div>
              <div className="teacher-form-group">
                <label>Time</label>
                <input type="text" name="time" value={eventFormData.time} onChange={handleEventInputChange} required />
              </div>
              <div className="teacher-form-group">
                <label>Location</label>
                <input type="text" name="location" value={eventFormData.location} onChange={handleEventInputChange} required />
              </div>
              <div className="teacher-form-group">
                <label>Description</label>
                <textarea name="description" value={eventFormData.description} onChange={handleEventInputChange} required />
              </div>
              <div className="teacher-form-group">
                <label>Max Participants</label>
                <input type="number" name="maxParticipants" value={eventFormData.maxParticipants} onChange={handleEventInputChange} />
              </div>
              <div className="teacher-form-group">
                <label>Event Poster URL</label>
                <input type="text" name="poster" value={eventFormData.poster} onChange={handleEventInputChange} />
              </div>
              {error && <div className="teacher-form-error">{error}</div>}
              <button type="submit" className="teacher-btn-submit">Update Event</button>
            </form>
          </div>
        </div>
      )}

      {/* Render other modals */}
      {renderClubDetailsModal()}
      {renderEventDetailsModal()}
      {renderParticipantsModal()}
    </div>
  );
};

export default TeacherDashboard;

