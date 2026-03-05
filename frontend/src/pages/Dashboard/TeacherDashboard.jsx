import React, { useEffect, useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";
import "./TeacherDashboard.css";

const TeacherDashboard = ({ user }) => {
  const navigate = useNavigate();
  const { logout } = useContext(AuthContext);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activeSection, setActiveSection] = useState("dashboard");
  const [dashboardData, setDashboardData] = useState(null);

  useEffect(() => {
    fetch("http://localhost:5000/api/teacher/dashboard", {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`
      }
    })
      .then(res => res.json())
      .then(data => setDashboardData(data))
      .catch(err => console.error("Error fetching dashboard:", err));
  }, []);

  const toggleSidebar = () => setSidebarCollapsed(!sidebarCollapsed);

  const handleLogout = () => {
    logout();
    navigate('/');
    // Force a full page reload to clear all CSS/state
    window.location.reload();
  };

  if (!dashboardData) {
    return <div className="teacher-loading">Loading...</div>;
  }

  const upcomingEvents = dashboardData.upcomingEvents || [];
  const clubs = dashboardData.clubs || [];
  const features = dashboardData.features || [];

  // Render Dashboard Section
  const renderDashboardSection = () => (
    <>
      <section className="teacher-welcome-section">
        <div className="teacher-welcome-content">
          <div className="teacher-welcome-text">
            <h2>👋 Welcome back, {user?.name || 'Teacher'}!</h2>
            <p>Manage your clubs and create events.</p>
            <span className="teacher-role-badge">🎓 Teacher</span>
          </div>
          <div className="teacher-welcome-illustration">
            <span className="teacher-illustration-icon">👩‍🏫</span>
          </div>
        </div>
      </section>

      <section className="teacher-quick-overview">
        <div className="teacher-overview-card">
          <div className="teacher-overview-icon">🏛</div>
          <div className="teacher-overview-info">
            <h3>{clubs.length}</h3>
            <p>Total Clubs</p>
          </div>
        </div>
        <div className="teacher-overview-card">
          <div className="teacher-overview-icon">📅</div>
          <div className="teacher-overview-info">
            <h3>{upcomingEvents.length}</h3>
            <p>Upcoming Events</p>
          </div>
        </div>
        <div className="teacher-overview-card">
          <div className="teacher-overview-icon">✅</div>
          <div className="teacher-overview-info">
            <h3>{dashboardData.approvedClubs || 0}</h3>
            <p>Approved Clubs</p>
          </div>
        </div>
        <div className="teacher-overview-card">
          <div className="teacher-overview-icon">👥</div>
          <div className="teacher-overview-info">
            <h3>{dashboardData.totalMembers || 0}</h3>
            <p>Total Members</p>
          </div>
        </div>
      </section>

      <section className="teacher-events-section">
        <div className="teacher-section-header">
          <h3>📅 Upcoming Events</h3>
          <button className="teacher-view-all-btn" onClick={() => setActiveSection("events")}>View All</button>
        </div>
        {upcomingEvents.length > 0 ? (
          <div className="teacher-events-grid">
            {upcomingEvents.slice(0, 3).map(event => (
              <div key={event.id || event._id} className="teacher-event-card">
                <div className="teacher-event-header">
                  <span className="teacher-event-icon">📌</span>
                  <h4>{event.name}</h4>
                </div>
                <div className="teacher-event-details">
                  <p><span>📅</span> {event.date}</p>
                  <p><span>📍</span> {event.venue}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="teacher-empty-state">
            <div className="teacher-empty-state-icon">📅</div>
            <p>No upcoming events</p>
          </div>
        )}
      </section>

      <section className="teacher-clubs-section">
        <div className="teacher-section-header">
          <h3>🏛 Your Clubs</h3>
          <button className="teacher-view-all-btn" onClick={() => setActiveSection("clubs")}>View All</button>
        </div>
        {clubs.length > 0 ? (
          <div className="teacher-clubs-grid">
            {clubs.slice(0, 3).map(club => (
              <div key={club._id || club.id} className="teacher-club-card">
                <div className="teacher-club-logo">🏛</div>
                <div className="teacher-club-info">
                  <h4>{club.name}</h4>
                  <p className="teacher-club-description">{club.description}</p>
                  <div className="teacher-club-stats">
                    <span>📅 {club.events || 0} Events</span>
                    <span>👥 {club.members || 0} Members</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="teacher-empty-state">
            <div className="teacher-empty-state-icon">🏛</div>
            <p>No clubs yet</p>
          </div>
        )}
      </section>
    </>
  );

  // Render Clubs Section
  const renderClubsSection = () => (
    <section className="teacher-clubs-full-section">
      <div className="teacher-section-header">
        <h3>🏛 All Clubs</h3>
        <span className="teacher-club-count">{clubs.length} clubs</span>
      </div>
      {clubs.length > 0 ? (
        <div className="teacher-clubs-grid-full">
          {clubs.map(club => (
            <div key={club._id || club.id} className="teacher-club-card-full">
              <div className="teacher-club-logo">🏛</div>
              <div className="teacher-club-info">
                <h4>{club.name}</h4>
                <p className="teacher-club-description">{club.description}</p>
                <div className="teacher-club-stats-full">
                  <span>📅 {club.events || 0} Events</span>
                  <span>👥 {club.members || 0} Members</span>
                  <span>Status: {club.status || 'active'}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="teacher-empty-state">
          <div className="teacher-empty-state-icon">🏛</div>
          <p>No clubs available</p>
        </div>
      )}
    </section>
  );

  // Render Events Section
  const renderEventsSection = () => (
    <section className="teacher-events-full-section">
      <div className="teacher-section-header">
        <h3>📅 All Events</h3>
        <button className="teacher-btn-create-event">+ Create Event</button>
      </div>
      {upcomingEvents.length > 0 ? (
        <div className="teacher-events-grid-full">
          {upcomingEvents.map(event => (
            <div key={event.id || event._id} className="teacher-event-card-full">
              <div className="teacher-event-header">
                <span className="teacher-event-icon">📌</span>
                <h4>{event.name}</h4>
              </div>
              <div className="teacher-event-details">
                <p><span>📅</span> {event.date}</p>
                <p><span>📍</span> {event.venue}</p>
                <p><span>🏛</span> {event.club || 'General'}</p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="teacher-empty-state">
          <div className="teacher-empty-state-icon">📅</div>
          <p>No events</p>
        </div>
      )}
    </section>
  );

  // Render Profile Section
  const renderProfileSection = () => (
    <section className="teacher-profile-section">
      <div className="teacher-profile-header">
        <div className="teacher-profile-avatar-large">
          <img 
            src={`https://ui-avatars.com/api/?name=${user?.name || 'Teacher'}&background=2563EB&color=fff&size=150`} 
            alt="Profile" 
          />
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
          <p>Clubs: {clubs.length}</p>
          <p>Events: {upcomingEvents.length}</p>
        </div>
        <div className="teacher-detail-card">
          <h4>⚙️ Settings</h4>
          <p>Notifications: Enabled</p>
          <p>Email Updates: Enabled</p>
        </div>
      </div>
    </section>
  );

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
              <span className="teacher-nav-icon">🏠</span>
              {!sidebarCollapsed && <span>Dashboard</span>}
            </li>
            <li className={activeSection === "clubs" ? "active" : ""} onClick={() => setActiveSection("clubs")}>
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
              {activeSection === "dashboard" && "Teacher Dashboard"}
              {activeSection === "clubs" && "My Clubs"}
              {activeSection === "events" && "Events"}
              {activeSection === "profile" && "My Profile"}
            </h1>
          </div>
          <div className="teacher-navbar-right">
            <div className="teacher-notification">
              <span className="teacher-notification-icon">🔔</span>
              <span className="teacher-notification-badge">3</span>
            </div>
            <div className="teacher-date-time">
              <span>{new Date().toLocaleDateString()}</span>
            </div>
            <div className="teacher-profile-dropdown" onClick={() => setActiveSection("profile")}>
              <img 
                src={`https://ui-avatars.com/api/?name=${user?.name || 'Teacher'}&background=2563EB&color=fff`} 
                alt="Profile" 
                className="teacher-navbar-avatar" 
              />
            </div>
          </div>
        </header>

        <div className="teacher-dashboard-content">
          {activeSection === "dashboard" && renderDashboardSection()}
          {activeSection === "clubs" && renderClubsSection()}
          {activeSection === "events" && renderEventsSection()}
          {activeSection === "profile" && renderProfileSection()}
        </div>
      </main>
    </div>
  );
};

export default TeacherDashboard;
