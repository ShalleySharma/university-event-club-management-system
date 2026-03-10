import React, { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";
import "./StudentDashboard.css";

const ClubHeadDashboard = ({ user }) => {
  const navigate = useNavigate();
  const { logout } = useContext(AuthContext);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activeSection, setActiveSection] = useState("dashboard");
  
  // State for data
  const [myClubs, setMyClubs] = useState([]);
  const [allClubs, setAllClubs] = useState([]);
  const [allEvents, setAllEvents] = useState([]);
  const [roleRequests, setRoleRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  
  // Modal states
  const [showClubDetails, setShowClubDetails] = useState(false);
  const [selectedClub, setSelectedClub] = useState(null);
  const [clubDetails, setClubDetails] = useState(null);
  const [showEventModal, setShowEventModal] = useState(false);
  const [showCreateEvent, setShowCreateEvent] = useState(false);
  const [newEvent, setNewEvent] = useState({
    eventName: "",
    description: "",
    date: "",
    time: "",
    location: "",
    maxParticipants: ""
  });

  // Fetch data on section change
  useEffect(() => {
    if (activeSection === "dashboard") {
      fetchDashboardData();
    } else if (activeSection === "clubs") {
      fetchMyClubs();
      fetchAllClubs();
    } else if (activeSection === "events") {
      fetchAllEvents();
      fetchMyClubs();
    } else if (activeSection === "requests") {
      fetchRoleRequests();
    }
  }, [activeSection]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      
      // Fetch my clubs
      const clubsResponse = await fetch("http://localhost:5000/api/clubs/my-clubs", {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Fetch role requests
      const requestsResponse = await fetch("http://localhost:5000/api/clubs/role-requests", {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (clubsResponse.ok) {
        const clubsData = await clubsResponse.json();
        setMyClubs(clubsData);
      }
      
      if (requestsResponse.ok) {
        const requestsData = await requestsResponse.json();
        setRoleRequests(requestsData.filter(r => r.status === "pending"));
      }
    } catch (err) {
      console.error("Error fetching dashboard data:", err);
    }
    setLoading(false);
  };

  const fetchMyClubs = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("http://localhost:5000/api/clubs/my-clubs", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setMyClubs(data);
      }
    } catch (err) {
      console.error("Error fetching my clubs:", err);
    }
    setLoading(false);
  };

  const fetchAllClubs = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("http://localhost:5000/api/clubs", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setAllClubs(data);
      }
    } catch (err) {
      console.error("Error fetching clubs:", err);
    }
  };

  const fetchAllEvents = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("http://localhost:5000/api/events/all", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setAllEvents(data);
      }
    } catch (err) {
      console.error("Error fetching events:", err);
    }
    setLoading(false);
  };

  const fetchRoleRequests = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("http://localhost:5000/api/clubs/role-requests", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setRoleRequests(data);
      }
    } catch (err) {
      console.error("Error fetching requests:", err);
    }
    setLoading(false);
  };

  const handleReviewRequest = async (requestId, status) => {
    setError("");
    setSuccess("");
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`http://localhost:5000/api/clubs/role-requests/${requestId}/review`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status })
      });

      if (response.ok) {
        setSuccess(`Request ${status} successfully!`);
        setRoleRequests(roleRequests.filter(req => req._id !== requestId));
        setTimeout(() => setSuccess(""), 3000);
      } else {
        setError("Failed to review request");
      }
    } catch (err) {
      setError("Network error. Please try again.");
    }
  };

  const handleCreateEvent = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    
    if (!selectedClub) {
      setError("Please select a club");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const response = await fetch("http://localhost:5000/api/events", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          ...newEvent,
          club: selectedClub
        })
      });

      if (response.ok) {
        setSuccess("Event created successfully!");
        setShowCreateEvent(false);
        setNewEvent({
          eventName: "",
          description: "",
          date: "",
          time: "",
          location: "",
          maxParticipants: ""
        });
        setTimeout(() => setSuccess(""), 3000);
      } else {
        const data = await response.json();
        setError(data.message || "Failed to create event");
      }
    } catch (err) {
      setError("Network error. Please try again.");
    }
  };

  const handleViewClub = async (club) => {
    setSelectedClub(club);
    setShowClubDetails(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`http://localhost:5000/api/clubs/${club._id}/details`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setClubDetails(data);
      }
    } catch (err) {
      console.error("Error fetching club details:", err);
    }
  };

  const toggleSidebar = () => setSidebarCollapsed(!sidebarCollapsed);

  const handleLogout = () => {
    logout();
    navigate('/');
    window.location.reload();
  };

  const getClubLogo = (name) => {
    const nameLower = name?.toLowerCase() || "";
    if (nameLower.includes('code') || nameLower.includes('programming') || nameLower.includes('tech') || nameLower.includes('coding')) return '💻';
    if (nameLower.includes('robot')) return '🤖';
    if (nameLower.includes('cultural') || nameLower.includes('dance') || nameLower.includes('art')) return '🎭';
    if (nameLower.includes('sport') || nameLower.includes('fitness')) return '⚽';
    if (nameLower.includes('drama') || nameLower.includes('theatre')) return '🎬';
    if (nameLower.includes('music')) return '🎵';
    if (nameLower.includes('science') || nameLower.includes('research')) return '🔬';
    if (nameLower.includes('business') || nameLower.includes('entrepreneur')) return '💼';
    if (nameLower.includes('literary') || nameLower.includes('book')) return '📚';
    return '🏛';
  };

  // Helper function to check if a string is a valid URL
  const isValidUrl = (string) => {
    try {
      const url = new URL(string);
      return url.protocol === "http:" || url.protocol === "https:";
    } catch (_) {
      return false;
    }
  };

  // Helper function to get the club logo (image or emoji fallback)
  const renderClubLogo = (club) => {
    const logo = club.logo;
    // Check if logo exists and is a valid URL
    if (logo && isValidUrl(logo)) {
      return <img src={logo} alt={club.name} className="club-logo-img" onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling && (e.target.nextSibling.style.display = 'flex'); }} />;
    }
    // Return emoji fallback
    return <span className="club-logo-emoji">{getClubLogo(club.name)}</span>;
  };

  // ==================== RENDER SECTIONS ====================
  
  const renderDashboard = () => (
    <>
      <section className="student-welcome-section">
        <div className="student-welcome-content">
          <div className="student-welcome-text">
            <h2>👋 Welcome back, {user?.name || 'Club Head'}!</h2>
            <p>Manage your clubs and review requests.</p>
          </div>
          <div className="student-welcome-illustration">
            <span className="student-illustration-icon">👑</span>
          </div>
        </div>
      </section>

      {/* Stats Cards */}
      <section className="student-quick-overview">
        <div className="student-overview-card">
          <div className="student-overview-icon">🏛</div>
          <div className="student-overview-info">
            <h3>{myClubs.length}</h3>
            <p>My Clubs</p>
          </div>
        </div>
        <div className="student-overview-card">
          <div className="student-overview-icon">📋</div>
          <div className="student-overview-info">
            <h3>{roleRequests.filter(r => r.status === "pending").length}</h3>
            <p>Pending Requests</p>
          </div>
        </div>
        <div className="student-overview-card">
          <div className="student-overview-icon">✅</div>
          <div className="student-overview-info">
            <h3>{myClubs.filter(c => c.status === "approved").length}</h3>
            <p>Approved Clubs</p>
          </div>
        </div>
        <div className="student-overview-card">
          <div className="student-overview-icon">⏳</div>
          <div className="student-overview-info">
            <h3>{myClubs.filter(c => c.status === "pending").length}</h3>
            <p>Pending Approval</p>
          </div>
        </div>
      </section>

      {/* Pending Requests Preview */}
      {roleRequests.filter(r => r.status === "pending").length > 0 && (
        <section className="student-events-section">
          <div className="student-section-header">
            <h3>📋 Pending Role Requests</h3>
            <button className="student-view-all-btn" onClick={() => setActiveSection("requests")}>View All</button>
          </div>
          <div className="student-events-grid">
            {roleRequests.filter(r => r.status === "pending").slice(0, 3).map(request => (
              <div key={request._id} className="student-event-card">
                <div className="student-event-header">
                  <span className="student-event-icon">👤</span>
                  <h4>{request.userId?.name || "Unknown"}</h4>
                </div>
                <div className="student-event-details">
                  <p><span>📛</span> {request.requestedRole}</p>
                  <p><span>🏛</span> {request.clubId?.name || "Unknown Club"}</p>
                </div>
                <div className="student-event-actions" style={{ marginTop: '10px' }}>
                  <button 
                    className="student-btn-join" 
                    onClick={() => handleReviewRequest(request._id, "approved")}
                    style={{ marginRight: '5px' }}
                  >
                    Approve
                  </button>
                  <button 
                    className="student-btn-details" 
                    onClick={() => handleReviewRequest(request._id, "rejected")}
                  >
                    Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* My Clubs Preview */}
      {myClubs.length > 0 && (
        <section className="student-clubs-full-section">
          <div className="student-section-header">
            <h3>🏛 My Clubs</h3>
            <button className="student-view-all-btn" onClick={() => setActiveSection("clubs")}>Manage</button>
          </div>
          <div className="student-clubs-grid-full">
            {myClubs.slice(0, 3).map(club => (
              <div key={club._id} className="student-club-card-full">
                <div className="student-club-logo">{renderClubLogo(club)}</div>
                <div className="student-club-info">
                  <h4>{club.name}</h4>
                  <p className="student-club-description">{club.description}</p>
                  <div className="student-club-stats">
                    <span>👥 {club.members?.length || 0} Members</span>
                    <span className={`status-badge status-${club.status}`} style={{ marginLeft: '8px' }}>
                      {club.status}
                    </span>
                  </div>
                </div>
                <div className="student-club-actions">
                  <button className="student-btn-details" onClick={() => handleViewClub(club)}>View</button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </>
  );

  const renderClubs = () => (
    <section className="student-clubs-full-section">
      <div className="student-section-header">
        <h3>🏛 My Clubs</h3>
        <span className="student-club-count">{myClubs.length} clubs</span>
      </div>
      
      {success && <div className="student-success-message">{success}</div>}
      {error && <div className="student-error-message">{error}</div>}

      {loading ? (
        <div className="student-loading">Loading clubs...</div>
      ) : myClubs.length === 0 ? (
        <div className="student-loading">No clubs created yet.</div>
      ) : (
        <div className="student-clubs-grid-full">
          {myClubs.map(club => (
            <div key={club._id} className="student-club-card-full">
              <div className="student-club-logo">{renderClubLogo(club)}</div>
              <div className="student-club-info">
                <h4>{club.name}</h4>
                <p className="student-club-description">{club.description}</p>
                <div className="student-club-stats">
                  <span>👥 {club.members?.length || 0} Members</span>
                  <span className={`status-badge status-${club.status}`} style={{ marginLeft: '8px' }}>
                    {club.status}
                  </span>
                </div>
              </div>
              <div className="student-club-actions">
                <button className="student-btn-details" onClick={() => handleViewClub(club)}>Manage</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );

  const renderEvents = () => (
    <section className="student-events-full-section">
      <div className="student-section-header">
        <h3>📅 Events</h3>
        <button 
          className="student-view-all-btn" 
          onClick={() => {
            setShowCreateEvent(true);
          }}
        >
          + Create Event
        </button>
      </div>

      {success && <div className="student-success-message">{success}</div>}
      {error && <div className="student-error-message">{error}</div>}

      {loading ? (
        <div className="student-loading">Loading events...</div>
      ) : allEvents.length === 0 ? (
        <div className="student-loading">No events yet.</div>
      ) : (
        <div className="student-events-grid-full">
          {allEvents.map(event => (
            <div key={event._id} className="student-event-card-full">
              <div className="student-event-header">
                <span className="student-event-icon">📌</span>
                <h4>{event.eventName}</h4>
              </div>
              <div className="student-event-details">
                <p><span>🏛</span> {event.clubName}</p>
                <p><span>📅</span> {event.date}</p>
                <p><span>🕒</span> {event.time}</p>
                <p><span>📍</span> {event.location}</p>
                <p><span>👥</span> {event.registrationCount || 0} registered</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );

  const renderRequests = () => (
    <section className="student-profile-section">
      <div className="student-section-header">
        <h3>📋 Role Requests</h3>
        <span className="student-club-count">{roleRequests.filter(r => r.status === "pending").length} pending</span>
      </div>

      {success && <div className="student-success-message">{success}</div>}
      {error && <div className="student-error-message">{error}</div>}

      {loading ? (
        <div className="student-loading">Loading requests...</div>
      ) : roleRequests.length === 0 ? (
        <div className="student-loading">No role requests.</div>
      ) : (
        <div className="student-events-grid-full">
          {roleRequests.map(request => (
            <div key={request._id} className="student-event-card-full">
              <div className="student-event-header">
                <span className="student-event-icon">👤</span>
                <h4>{request.userId?.name || "Unknown"}</h4>
              </div>
              <div className="student-event-details">
                <p><span>📧</span> {request.userId?.email || "N/A"}</p>
                <p><span>🎯</span> Requested: {request.requestedRole}</p>
                <p><span>🏛</span> Club: {request.clubId?.name || "Unknown"}</p>
                <p><span>📊</span> Status: {request.status}</p>
              </div>
              {request.status === "pending" && (
                <div className="student-event-actions">
                  <button 
                    className="student-btn-join" 
                    onClick={() => handleReviewRequest(request._id, "approved")}
                    style={{ marginRight: '5px' }}
                  >
                    Approve
                  </button>
                  <button 
                    className="student-btn-details" 
                    onClick={() => handleReviewRequest(request._id, "rejected")}
                  >
                    Reject
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  );

  const renderProfile = () => (
    <section className="student-profile-section">
      <div className="student-profile-header">
        <div className="student-profile-avatar-large">
          <img src={`https://ui-avatars.com/api/?name=${user?.name || 'Club Head'}&background=9C27B0&color=fff&size=150`} alt="Profile" />
        </div>
        <div className="student-profile-info">
          <h2>{user?.name || 'Club Head'}</h2>
          <p>{user?.email || 'clubhead@college.edu'}</p>
          <span className="student-role-badge" style={{ backgroundColor: "#9C27B0" }}>👑 Club Head</span>
        </div>
      </div>
      <div className="student-profile-details">
        <div className="student-detail-card">
          <h4>📊 My Stats</h4>
          <p>Total Clubs: {myClubs.length}</p>
          <p>Approved Clubs: {myClubs.filter(c => c.status === "approved").length}</p>
          <p>Pending Clubs: {myClubs.filter(c => c.status === "pending").length}</p>
          <p>Pending Requests: {roleRequests.filter(r => r.status === "pending").length}</p>
        </div>
        <div className="student-detail-card">
          <h4>🏛 My Clubs</h4>
          {myClubs.length > 0 ? (
            <ul className="student-joined-list">
              {myClubs.map(club => (
                <li key={club._id}>
                  {club.name}
                  <span className={`status-badge status-${club.status}`} style={{ marginLeft: '8px', fontSize: '12px' }}>
                    {club.status}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p>No clubs created yet</p>
          )}
        </div>
      </div>
    </section>
  );

  // ==================== MODALS ====================
  const renderClubDetailsModal = () => {
    if (!showClubDetails) return null;
    return (
      <div className="student-modal-overlay" onClick={() => setShowClubDetails(false)}>
        <div className="student-modal" onClick={(e) => e.stopPropagation()}>
          <div className="student-modal-header">
            <h3>🏛 {selectedClub?.name}</h3>
            <button className="student-modal-close" onClick={() => setShowClubDetails(false)}>×</button>
          </div>
          <div className="student-modal-body">
            <p><strong>Description:</strong> {selectedClub?.description}</p>
            <p><strong>Category:</strong> {selectedClub?.category || "General"}</p>
            <p><strong>Total Members:</strong> {clubDetails?.totalMembers || 0}</p>
            <p><strong>Total Events:</strong> {clubDetails?.totalEvents || 0}</p>
            <p><strong>Status:</strong> {selectedClub?.status}</p>
            {selectedClub?.convener?.name && (
              <p><strong>Convener:</strong> {selectedClub.convener.name}</p>
            )}
            {selectedClub?.coConvener?.name && (
              <p><strong>Co-Convener:</strong> {selectedClub.coConvener.name}</p>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderCreateEventModal = () => {
    if (!showCreateEvent) return null;
    return (
      <div className="student-modal-overlay" onClick={() => setShowCreateEvent(false)}>
        <div className="student-modal" onClick={(e) => e.stopPropagation()}>
          <div className="student-modal-header">
            <h3>📅 Create Event</h3>
            <button className="student-modal-close" onClick={() => setShowCreateEvent(false)}>×</button>
          </div>
          <div className="student-modal-body">
            <form onSubmit={handleCreateEvent}>
              <div className="form-group">
                <label>Select Club</label>
                <select 
                  value={selectedClub || ""} 
                  onChange={(e) => setSelectedClub(e.target.value)}
                  required
                >
                  <option value="">Select a club</option>
                  {myClubs.filter(c => c.status === "approved").map(club => (
                    <option key={club._id} value={club._id}>{club.name}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Event Name</label>
                <input
                  type="text"
                  value={newEvent.eventName}
                  onChange={(e) => setNewEvent({ ...newEvent, eventName: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea
                  value={newEvent.description}
                  onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Date</label>
                <input
                  type="date"
                  value={newEvent.date}
                  onChange={(e) => setNewEvent({ ...newEvent, date: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Time</label>
                <input
                  type="time"
                  value={newEvent.time}
                  onChange={(e) => setNewEvent({ ...newEvent, time: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Location</label>
                <input
                  type="text"
                  value={newEvent.location}
                  onChange={(e) => setNewEvent({ ...newEvent, location: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Max Participants (optional)</label>
                <input
                  type="number"
                  value={newEvent.maxParticipants}
                  onChange={(e) => setNewEvent({ ...newEvent, maxParticipants: e.target.value })}
                />
              </div>
              <button type="submit" className="student-btn-join">Create Event</button>
            </form>
          </div>
        </div>
      </div>
    );
  };

  // ==================== MAIN RENDER ====================
  return (
    <div className="student-dashboard">
      <aside className={`student-sidebar ${sidebarCollapsed ? 'collapsed' : ''}`}>
        <div className="student-sidebar-header">
          <div className="student-logo">
            <span className="student-logo-icon">👑</span>
            {!sidebarCollapsed && <span className="student-logo-text">Club Head</span>}
          </div>
          <button className="student-sidebar-toggle" onClick={toggleSidebar}>
            {sidebarCollapsed ? '→' : '←'}
          </button>
        </div>

        <nav className="student-sidebar-nav">
          <ul>
            <li className={activeSection === "dashboard" ? "active" : ""} onClick={() => setActiveSection("dashboard")}>
              <span className="student-nav-icon">🏠</span>
              {!sidebarCollapsed && <span>Dashboard</span>}
            </li>
            <li className={activeSection === "clubs" ? "active" : ""} onClick={() => setActiveSection("clubs")}>
              <span className="student-nav-icon">🏛</span>
              {!sidebarCollapsed && <span>My Clubs</span>}
            </li>
            <li className={activeSection === "events" ? "active" : ""} onClick={() => setActiveSection("events")}>
              <span className="student-nav-icon">📅</span>
              {!sidebarCollapsed && <span>Events</span>}
            </li>
            <li className={activeSection === "requests" ? "active" : ""} onClick={() => setActiveSection("requests")}>
              <span className="student-nav-icon">📋</span>
              {!sidebarCollapsed && <span>Requests</span>}
            </li>
            <li className={activeSection === "profile" ? "active" : ""} onClick={() => setActiveSection("profile")}>
              <span className="student-nav-icon">👤</span>
              {!sidebarCollapsed && <span>Profile</span>}
            </li>
            <li className="logout" onClick={handleLogout}>
              <span className="student-nav-icon">🚪</span>
              {!sidebarCollapsed && <span>Logout</span>}
            </li>
          </ul>
        </nav>
      </aside>

      <main className="student-main-content">
        <header className="student-top-navbar">
          <div className="student-navbar-left">
            <h1>
              {activeSection === "dashboard" && "Club Head Dashboard"}
              {activeSection === "clubs" && "My Clubs"}
              {activeSection === "events" && "Events"}
              {activeSection === "requests" && "Role Requests"}
              {activeSection === "profile" && "My Profile"}
            </h1>
          </div>
          <div className="student-navbar-right">
            <div className="student-date-time">
              <span>{new Date().toLocaleDateString()}</span>
            </div>
            <div className="student-profile-dropdown" onClick={() => setActiveSection("profile")}>
              <img src={`https://ui-avatars.com/api/?name=${user?.name || 'Club Head'}&background=9C27B0&color=fff`} alt="Profile" className="student-navbar-avatar" />
            </div>
          </div>
        </header>

        <div className="student-content-area">
          {activeSection === "dashboard" && renderDashboard()}
          {activeSection === "clubs" && renderClubs()}
          {activeSection === "events" && renderEvents()}
          {activeSection === "requests" && renderRequests()}
          {activeSection === "profile" && renderProfile()}
        </div>
      </main>

      {renderClubDetailsModal()}
      {renderCreateEventModal()}
    </div>
  );
};

export default ClubHeadDashboard;

