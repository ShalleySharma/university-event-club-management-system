import React, { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";
import "./StudentDashboard.css";

const StudentDashboard = ({ user }) => {
  const navigate = useNavigate();
  const { logout } = useContext(AuthContext);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activeSection, setActiveSection] = useState("dashboard");
  const [clubs, setClubs] = useState([]);
  const [loadingClubs, setLoadingClubs] = useState(false);
  const [joinedClubs, setJoinedClubs] = useState([]);

  // Generate a logo emoji based on club name
  const getClubLogo = (name) => {
    const nameLower = name.toLowerCase();
    if (nameLower.includes('code') || nameLower.includes('programming') || nameLower.includes('tech')) return '💻';
    if (nameLower.includes('robot') || nameLower.includes('automation')) return '🤖';
    if (nameLower.includes('cultural') || nameLower.includes('dance') || nameLower.includes('art')) return '🎭';
    if (nameLower.includes('sport') || nameLower.includes('fitness') || nameLower.includes('football') || nameLower.includes('cricket')) return '⚽';
    if (nameLower.includes('drama') || nameLower.includes('theatre') || nameLower.includes('theater')) return '🎬';
    if (nameLower.includes('music') || nameLower.includes('band') || nameLower.includes('sound')) return '🎵';
    if (nameLower.includes('photo') || nameLower.includes('camera') || nameLower.includes('media')) return '📷';
    if (nameLower.includes('science') || nameLower.includes('research')) return '🔬';
    if (nameLower.includes('business') || nameLower.includes('entrepreneur')) return '💼';
    if (nameLower.includes('literary') || nameLower.includes('book') || nameLower.includes('writing')) return '📚';
    if (nameLower.includes('eco') || nameLower.includes('green') || nameLower.includes('nature')) return '🌱';
    if (nameLower.includes('social') || nameLower.includes('community')) return '🤝';
    return '🏛';
  };

  const fetchClubs = async () => {
    setLoadingClubs(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch("http://localhost:5000/api/clubs", {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      
      const clubsWithLogos = data.map(club => ({
        ...club,
        logo: club.logo || getClubLogo(club.name),
        memberCount: club.members ? club.members.length : 0
      }));
      
      setClubs(clubsWithLogos);
    } catch (error) {
      console.error("Error fetching clubs:", error);
      setClubs([
        { _id: 1, name: "Coding Club", description: "Enhancing programming skills.", logo: "💻", memberCount: 150, status: "approved" },
        { _id: 2, name: "Robotics Club", description: "Building robots and automation.", logo: "🤖", memberCount: 80, status: "approved" },
        { _id: 3, name: "Cultural Club", description: "Art, music, and dance talents.", logo: "🎭", memberCount: 120, status: "approved" },
        { _id: 4, name: "Sports Club", description: "Fitness and competitive sports.", logo: "⚽", memberCount: 200, status: "approved" },
        { _id: 5, name: "Drama Club", description: "Theatre and performances.", logo: "🎬", memberCount: 45, status: "approved" },
        { _id: 6, name: "Music Club", description: "Music compositions.", logo: "🎵", memberCount: 60, status: "approved" }
      ]);
    }
    setLoadingClubs(false);
  };

  const handleExploreClubs = () => {
    setActiveSection("clubs");
    if (clubs.length === 0) {
      fetchClubs();
    }
  };

  const handleJoinClub = async (clubId) => {
    try {
      const token = localStorage.getItem('token');
      await fetch(`http://localhost:5000/api/clubs/${clubId}/join`, {
        method: "POST",
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setJoinedClubs([...joinedClubs, clubId]);
    } catch (error) {
      console.error("Error joining club:", error);
      setJoinedClubs([...joinedClubs, clubId]);
    }
  };

  const isClubJoined = (clubId) => joinedClubs.includes(clubId);

  const dashboardData = {
    totalClubs: 8,
    eventsThisWeek: 3,
    myJoinedEvents: 5,
    upcomingEvents: [
      { id: 1, name: "Web Development Workshop", date: "5 March 2026", time: "2:00 PM", venue: "Lab 3", club: "Coding Club", joined: false },
      { id: 2, name: "Hackathon 2026", date: "10 March 2026", time: "10:00 AM", venue: "Auditorium", club: "Coding Club", joined: true },
      { id: 3, name: "Robotics Competition", date: "15 March 2026", time: "9:00 AM", venue: "Workshop Hall", club: "Robotics Club", joined: false }
    ],
    clubs: [
      { id: 1, name: "Coding Club", description: "Enhancing programming and development skills.", logo: "💻", events: 12, members: 150 },
      { id: 2, name: "Robotics Club", description: "Building robots and learning automation.", logo: "🤖", events: 8, members: 80 },
      { id: 3, name: "Cultural Club", description: "Showcasing art, music, and dance talents.", logo: "🎭", events: 15, members: 120 },
      { id: 4, name: "Sports Club", description: "Promoting fitness and competitive sports.", logo: "⚽", events: 10, members: 200 },
      { id: 5, name: "Drama Club", description: "Theatre and dramatic performances.", logo: "🎬", events: 6, members: 45 },
      { id: 6, name: "Music Club", description: "Learning and performing music compositions.", logo: "🎵", events: 9, members: 60 }
    ]
  };

  const toggleSidebar = () => setSidebarCollapsed(!sidebarCollapsed);

  const getBadge = (percentage) => {
    if (percentage >= 90) return { badge: "🥇 Gold Member", color: "#FFD700" };
    if (percentage >= 80) return { badge: "🥈 Silver Member", color: "#C0C0C0" };
    return { badge: "🥉 Bronze Member", color: "#CD7F32" };
  };

  const badge = getBadge(85);

  const handleJoinEvent = (eventId) => {
    console.log("Join event:", eventId);
  };

  const handleLogout = () => {
    logout();
    navigate('/');
    window.location.reload();
  };

  // Render Dashboard Section
  const renderDashboardSection = () => (
    <>
      <section className="student-welcome-section">
        <div className="student-welcome-content">
          <div className="student-welcome-text">
            <h2>👋 Welcome back, {user?.name || 'Student'}!</h2>
            <p>Explore clubs and join upcoming events.</p>
          </div>
          <div className="student-welcome-illustration">
            <span className="student-illustration-icon">🎓</span>
          </div>
        </div>
      </section>

      <section className="student-quick-overview">
        <div className="student-overview-card">
          <div className="student-overview-icon">🏛</div>
          <div className="student-overview-info">
            <h3>{dashboardData.totalClubs}</h3>
            <p>Total Clubs</p>
          </div>
        </div>
        <div className="student-overview-card">
          <div className="student-overview-icon">📅</div>
          <div className="student-overview-info">
            <h3>{dashboardData.eventsThisWeek}</h3>
            <p>Events This Week</p>
          </div>
        </div>
        <div className="student-overview-card">
          <div className="student-overview-icon">✅</div>
          <div className="student-overview-info">
            <h3>{dashboardData.myJoinedEvents}</h3>
            <p>My Joined Events</p>
          </div>
        </div>
        <div className="student-overview-card">
          <div className="student-overview-icon">🎯</div>
          <div className="student-overview-info">
            <h3>{dashboardData.upcomingEvents.length}</h3>
            <p>Upcoming Events</p>
          </div>
        </div>
      </section>

      <section className="student-events-section">
        <div className="student-section-header">
          <h3>📅 Upcoming Events</h3>
          <button className="student-view-all-btn" onClick={() => setActiveSection("events")}>View All</button>
        </div>
        <div className="student-events-grid">
          {dashboardData.upcomingEvents.map(event => (
            <div key={event.id} className="student-event-card">
              <div className="student-event-header">
                <span className="student-event-icon">📌</span>
                <h4>{event.name}</h4>
              </div>
              <div className="student-event-details">
                <p><span>📅</span> {event.date}</p>
                <p><span>🕒</span> {event.time}</p>
                <p><span>📍</span> {event.venue}</p>
                <p><span>🏛</span> {event.club}</p>
              </div>
              <div className="student-event-actions">
                {event.joined ? (
                  <button className="student-btn-joined" disabled>✓ Joined</button>
                ) : (
                  <>
                    <button className="student-btn-details">View Details</button>
                    <button className="student-btn-join" onClick={() => handleJoinEvent(event.id)}>Join Now</button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>
    </>
  );

  // Render Clubs Section
  const renderClubsSection = () => (
    <section className="student-clubs-full-section">
      <div className="student-section-header">
        <h3>🏛 All Clubs</h3>
        <span className="student-club-count">{clubs.length} clubs available</span>
      </div>
      {loadingClubs ? (
        <div className="student-loading">Loading clubs...</div>
      ) : (
        <div className="student-clubs-grid-full">
          {clubs.map(club => (
            <div key={club._id || club.id} className="student-club-card-full">
              <div className="student-club-logo">{club.logo || '🏛'}</div>
              <div className="student-club-info">
                <h4>{club.name}</h4>
                <p className="student-club-description">{club.description}</p>
                <div className="student-club-stats">
                  <span>📅 {club.events || 0} Events</span>
                  <span>👥 {club.members || 0} Members</span>
                </div>
              </div>
              <div className="student-club-actions">
                {isClubJoined(club._id || club.id) ? (
                  <button className="student-btn-joined" disabled>✓ Joined</button>
                ) : (
                  <button className="student-btn-join" onClick={() => handleJoinClub(club._id || club.id)}>Join Club</button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );

  // Render Events Section
  const renderEventsSection = () => (
    <section className="student-events-full-section">
      <div className="student-section-header">
        <h3>📅 My Events</h3>
        <span className="student-event-count">{dashboardData.upcomingEvents.length} upcoming events</span>
      </div>
      <div className="student-events-grid-full">
        {dashboardData.upcomingEvents.map(event => (
          <div key={event.id} className="student-event-card-full">
            <div className="student-event-header">
              <span className="student-event-icon">📌</span>
              <h4>{event.name}</h4>
            </div>
            <div className="student-event-details">
              <p><span>📅</span> {event.date}</p>
              <p><span>🕒</span> {event.time}</p>
              <p><span>📍</span> {event.venue}</p>
              <p><span>🏛</span> {event.club}</p>
            </div>
            <div className="student-event-actions">
              {event.joined ? (
                <button className="student-btn-joined" disabled>✓ Joined</button>
              ) : (
                <>
                  <button className="student-btn-details">View Details</button>
                  <button className="student-btn-join" onClick={() => handleJoinEvent(event.id)}>Join Now</button>
                </>
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  );

  // Render Profile Section
  const renderProfileSection = () => (
    <section className="student-profile-section">
      <div className="student-profile-header">
        <div className="student-profile-avatar-large">
          <img 
            src={`https://ui-avatars.com/api/?name=${user?.name || 'Student'}&background=2563EB&color=fff&size=150`} 
            alt="Profile" 
          />
        </div>
        <div className="student-profile-info">
          <h2>{user?.name || 'Student'}</h2>
          <p>{user?.email || 'student@college.edu'}</p>
          <span className="student-role-badge" style={{ backgroundColor: badge.color }}>{badge.badge}</span>
        </div>
      </div>
      <div className="student-profile-details">
        <div className="student-detail-card">
          <h4>📊 Stats</h4>
          <p>Joined Clubs: {joinedClubs.length}</p>
          <p>Events Attended: {dashboardData.myJoinedEvents}</p>
        </div>
        <div className="student-detail-card">
          <h4>⚙️ Settings</h4>
          <p>Notifications: Enabled</p>
          <p>Email Updates: Enabled</p>
        </div>
      </div>
    </section>
  );

  return (
    <div className="student-dashboard">
      <aside className={`student-sidebar ${sidebarCollapsed ? 'collapsed' : ''}`}>
        <div className="student-sidebar-header">
          <div className="student-logo">
            <span className="student-logo-icon">🎓</span>
            {!sidebarCollapsed && <span className="student-logo-text">Campus Connect</span>}
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
            <li className={activeSection === "clubs" ? "active" : ""} onClick={handleExploreClubs}>
              <span className="student-nav-icon">🏛</span>
              {!sidebarCollapsed && <span>Explore Clubs</span>}
            </li>
            <li className={activeSection === "events" ? "active" : ""} onClick={() => setActiveSection("events")}>
              <span className="student-nav-icon">📅</span>
              {!sidebarCollapsed && <span>My Events</span>}
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
              {activeSection === "dashboard" && "Student Dashboard"}
              {activeSection === "clubs" && "Explore Clubs"}
              {activeSection === "events" && "My Events"}
              {activeSection === "profile" && "My Profile"}
            </h1>
          </div>
          <div className="student-navbar-right">
            <div className="student-notification">
              <span className="student-notification-icon">🔔</span>
              <span className="student-notification-badge">3</span>
            </div>
            <div className="student-date-time">
              <span>{new Date().toLocaleDateString()}</span>
            </div>
            <div className="student-profile-dropdown" onClick={() => setActiveSection("profile")}>
              <img 
                src={`https://ui-avatars.com/api/?name=${user?.name || 'Student'}&background=2563EB&color=fff`} 
                alt="Profile" 
                className="student-navbar-avatar" 
              />
            </div>
          </div>
        </header>

        <div className="student-content-area">
          {activeSection === "dashboard" && renderDashboardSection()}
          {activeSection === "clubs" && renderClubsSection()}
          {activeSection === "events" && renderEventsSection()}
          {activeSection === "profile" && renderProfileSection()}
        </div>
      </main>
    </div>
  );
};

export default StudentDashboard;
