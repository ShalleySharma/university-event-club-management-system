import React, { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";
import "./CoordinatorDashboard.css";

const CoordinatorDashboard = ({ user }) => {
  const navigate = useNavigate();
  const { logout } = useContext(AuthContext);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activeSection, setActiveSection] = useState("dashboard");
  const [showEventModal, setShowEventModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  
  // Sample data for demonstration
  const [dashboardData, setDashboardData] = useState({
    totalEvents: 12,
    upcomingEvents: 5,
    totalMembers: 156,
    activeEvents: 3,
    events: [
      { id: 1, name: "Web Development Workshop", date: "5 Mar 2026", venue: "Lab 3", status: "upcoming", participants: 30 },
      { id: 2, name: "Hackathon 2026", date: "10 Mar 2026", venue: "Auditorium", status: "active", participants: 120 },
      { id: 3, name: "Tech Talk: AI Basics", date: "15 Mar 2026", venue: "Seminar Hall", status: "upcoming", participants: 50 },
      { id: 4, name: "Coding Competition", date: "20 Mar 2026", venue: "Lab 1", status: "upcoming", participants: 45 },
      { id: 5, name: "Project Showcase", date: "25 Mar 2026", venue: "Gallery", status: "upcoming", participants: 80 },
      { id: 6, name: "Career Guidance Session", date: "1 Feb 2026", venue: "Conference Room", status: "completed", participants: 60 },
    ],
    members: [
      { id: 1, name: "John Smith", email: "john.smith@campus.edu", department: "Computer Science", joinedDate: "15 Jan 2026" },
      { id: 2, name: "Sarah Johnson", email: "sarah.j@campus.edu", department: "Information Technology", joinedDate: "18 Jan 2026" },
      { id: 3, name: "Mike Davis", email: "mike.davis@campus.edu", department: "Computer Science", joinedDate: "20 Jan 2026" },
      { id: 4, name: "Emily Brown", email: "emily.b@campus.edu", department: "Software Engineering", joinedDate: "22 Jan 2026" },
      { id: 5, name: "Alex Wilson", email: "alex.w@campus.edu", department: "Computer Science", joinedDate: "25 Jan 2026" },
    ],
    recentActivity: [
      { id: 1, type: "event", message: "New event 'Hackathon 2026' created", time: "2 hours ago" },
      { id: 2, type: "member", message: "5 new members joined Coding Club", time: "5 hours ago" },
      { id: 3, type: "registration", message: "20 students registered for Workshop", time: "1 day ago" },
      { id: 4, type: "event", message: "Tech Talk event updated", time: "2 days ago" },
    ]
  });

  const [newEvent, setNewEvent] = useState({
    title: "",
    description: "",
    date: "",
    time: "",
    venue: "",
    maxParticipants: ""
  });

  const toggleSidebar = () => setSidebarCollapsed(!sidebarCollapsed);

  const handleLogout = () => {
    logout();
    navigate('/');
    window.location.reload();
  };

  const handleCreateEvent = (e) => {
    e.preventDefault();
    console.log("Creating event:", newEvent);
    setShowEventModal(false);
    setNewEvent({
      title: "",
      description: "",
      date: "",
      time: "",
      venue: "",
      maxParticipants: ""
    });
  };

  const handleDeleteEvent = (eventId) => {
    console.log("Delete event:", eventId);
  };

  const handleEditEvent = (eventId) => {
    console.log("Edit event:", eventId);
  };

  // Filter members based on search
  const filteredMembers = dashboardData.members.filter(member =>
    member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    member.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    member.department.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderContent = () => {
    switch (activeSection) {
      case "dashboard":
        return <DashboardOverview data={dashboardData} />;
      case "events":
        return (
          <EventsManagement 
            events={dashboardData.events} 
            onCreateEvent={() => setShowEventModal(true)}
            onEditEvent={handleEditEvent}
            onDeleteEvent={handleDeleteEvent}
          />
        );
      case "members":
        return (
          <ClubMembers 
            members={filteredMembers}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
          />
        );
      case "overview":
        return <ClubOverview data={dashboardData} />;
      default:
        return <DashboardOverview data={dashboardData} />;
    }
  };

  return (
    <div className="coordinator-dashboard">
      {/* Sidebar */}
      <aside className={`coordinator-sidebar ${sidebarCollapsed ? 'collapsed' : ''}`}>
        <div className="coordinator-sidebar-header">
          <div className="coordinator-logo">
            <span className="coordinator-logo-icon">🎓</span>
            {!sidebarCollapsed && <span className="coordinator-logo-text">Campus Connect</span>}
          </div>
          <button className="coordinator-sidebar-toggle" onClick={toggleSidebar}>
            {sidebarCollapsed ? '→' : '←'}
          </button>
        </div>

        <nav className="coordinator-sidebar-nav">
          <ul>
            <li 
              className={activeSection === "dashboard" ? "active" : ""} 
              onClick={() => setActiveSection("dashboard")}
            >
              <span className="coordinator-nav-icon">🏠</span>
              {!sidebarCollapsed && <span>Dashboard</span>}
            </li>
            <li 
              className={activeSection === "events" ? "active" : ""} 
              onClick={() => setActiveSection("events")}
            >
              <span className="coordinator-nav-icon">📅</span>
              {!sidebarCollapsed && <span>Manage Events</span>}
            </li>
            <li 
              className={activeSection === "members" ? "active" : ""} 
              onClick={() => setActiveSection("members")}
            >
              <span className="coordinator-nav-icon">👥</span>
              {!sidebarCollapsed && <span>Club Members</span>}
            </li>
            <li 
              className={activeSection === "overview" ? "active" : ""} 
              onClick={() => setActiveSection("overview")}
            >
              <span className="coordinator-nav-icon">📊</span>
              {!sidebarCollapsed && <span>Club Overview</span>}
            </li>
            <li 
              className={activeSection === "profile" ? "active" : ""} 
              onClick={() => setActiveSection("profile")}
            >
              <span className="coordinator-nav-icon">👤</span>
              {!sidebarCollapsed && <span>Profile</span>}
            </li>
            <li className="logout" onClick={handleLogout}>
              <span className="coordinator-nav-icon">🚪</span>
              {!sidebarCollapsed && <span>Logout</span>}
            </li>
          </ul>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="coordinator-main-content">
        {/* Top Navbar */}
        <header className="coordinator-top-navbar">
          <div className="coordinator-navbar-left">
            <h1>
              {activeSection === "dashboard" && "Dashboard"}
              {activeSection === "events" && "Manage Events"}
              {activeSection === "members" && "Club Members"}
              {activeSection === "overview" && "Club Overview"}
              {activeSection === "profile" && "Profile"}
            </h1>
          </div>
          <div className="coordinator-navbar-right">
            <div className="coordinator-notification">
              <span className="coordinator-notification-icon">🔔</span>
              <span className="coordinator-notification-badge">3</span>
            </div>
            <div className="coordinator-date-time">
              <span>{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
            </div>
            <div className="coordinator-profile-dropdown">
              <img 
                src={`https://ui-avatars.com/api/?name=${user?.name || 'Coordinator'}&background=2563EB&color=fff`} 
                alt="Profile" 
                className="coordinator-navbar-avatar" 
              />
              <div className="coordinator-dropdown-menu">
                <div className="coordinator-dropdown-item">My Profile</div>
                <div className="coordinator-dropdown-item">Settings</div>
                <div className="coordinator-dropdown-item logout">Logout</div>
              </div>
            </div>
          </div>
        </header>

        {/* Dashboard Content */}
        <div className="coordinator-dashboard-content">
          {/* Welcome Section */}
          <section className="coordinator-welcome-section">
            <div className="coordinator-welcome-content">
              <div className="coordinator-welcome-text">
                <h2>👋 Welcome back, {user?.name || 'Coordinator'}!</h2>
                <p>Here's what's happening with your club today.</p>
                <span className="coordinator-role-badge">🎓 Club Coordinator</span>
              </div>
              <div className="coordinator-welcome-illustration">
                <span>📚</span>
              </div>
            </div>
          </section>

          {renderContent()}
        </div>
      </main>

      {/* Create Event Modal */}
      <div className={`coordinator-modal-overlay ${showEventModal ? 'active' : ''}`} onClick={() => setShowEventModal(false)}>
        <div className="coordinator-modal" onClick={e => e.stopPropagation()}>
          <div className="coordinator-modal-header">
            <h3>📅 Create New Event</h3>
            <button className="coordinator-modal-close" onClick={() => setShowEventModal(false)}>×</button>
          </div>
          <form onSubmit={handleCreateEvent}>
            <div className="coordinator-modal-body">
              <div className="coordinator-form-group">
                <label>Event Title *</label>
                <input 
                  type="text" 
                  placeholder="Enter event title"
                  value={newEvent.title}
                  onChange={e => setNewEvent({...newEvent, title: e.target.value})}
                  required
                />
              </div>
              <div className="coordinator-form-group">
                <label>Description *</label>
                <textarea 
                  placeholder="Enter event description"
                  value={newEvent.description}
                  onChange={e => setNewEvent({...newEvent, description: e.target.value})}
                  required
                />
              </div>
              <div className="coordinator-form-row">
                <div className="coordinator-form-group">
                  <label>Date *</label>
                  <input 
                    type="date" 
                    value={newEvent.date}
                    onChange={e => setNewEvent({...newEvent, date: e.target.value})}
                    required
                  />
                </div>
                <div className="coordinator-form-group">
                  <label>Time *</label>
                  <input 
                    type="time" 
                    value={newEvent.time}
                    onChange={e => setNewEvent({...newEvent, time: e.target.value})}
                    required
                  />
                </div>
              </div>
              <div className="coordinator-form-row">
                <div className="coordinator-form-group">
                  <label>Venue *</label>
                  <input 
                    type="text" 
                    placeholder="Enter venue"
                    value={newEvent.venue}
                    onChange={e => setNewEvent({...newEvent, venue: e.target.value})}
                    required
                  />
                </div>
                <div className="coordinator-form-group">
                  <label>Max Participants (Optional)</label>
                  <input 
                    type="number" 
                    placeholder="Enter max participants"
                    value={newEvent.maxParticipants}
                    onChange={e => setNewEvent({...newEvent, maxParticipants: e.target.value})}
                  />
                </div>
              </div>
            </div>
            <div className="coordinator-modal-footer">
              <button type="button" className="coordinator-btn coordinator-btn-secondary" onClick={() => setShowEventModal(false)}>
                Cancel
              </button>
              <button type="submit" className="coordinator-btn coordinator-btn-primary">
                Create Event
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

// Dashboard Overview Component
const DashboardOverview = ({ data }) => {
  return (
    <>
      {/* Overview Cards */}
      <section className="coordinator-overview-cards">
        <div className="coordinator-overview-card">
          <div className="coordinator-overview-icon events">📋</div>
          <div className="coordinator-overview-info">
            <h3>{data.totalEvents}</h3>
            <p>Total Events Created</p>
          </div>
        </div>
        <div className="coordinator-overview-card">
          <div className="coordinator-overview-icon upcoming">📅</div>
          <div className="coordinator-overview-info">
            <h3>{data.upcomingEvents}</h3>
            <p>Upcoming Events</p>
          </div>
        </div>
        <div className="coordinator-overview-card">
          <div className="coordinator-overview-icon members">👥</div>
          <div className="coordinator-overview-info">
            <h3>{data.totalMembers}</h3>
            <p>Total Members</p>
          </div>
        </div>
        <div className="coordinator-overview-card">
          <div className="coordinator-overview-icon active">✅</div>
          <div className="coordinator-overview-info">
            <h3>{data.activeEvents}</h3>
            <p>Active Events</p>
          </div>
        </div>
      </section>

      {/* Recent Activity */}
      <section className="coordinator-dashboard-section">
        <div className="coordinator-section-header">
          <h3>📝 Recent Activity</h3>
        </div>
        <ul className="coordinator-activity-list">
          {data.recentActivity.map(activity => (
            <li key={activity.id} className="coordinator-activity-item">
              <div className="coordinator-activity-icon">
                {activity.type === "event" && "📅"}
                {activity.type === "member" && "👤"}
                {activity.type === "registration" && "📝"}
              </div>
              <div className="coordinator-activity-content">
                <p>{activity.message}</p>
                <span>{activity.time}</span>
              </div>
            </li>
          ))}
        </ul>
      </section>
    </>
  );
};

// Events Management Component
const EventsManagement = ({ events, onCreateEvent, onEditEvent, onDeleteEvent }) => {
  return (
    <>
      <section className="coordinator-dashboard-section">
        <div className="coordinator-section-header">
          <h3>📅 Manage Events</h3>
          <button className="coordinator-btn coordinator-btn-primary" onClick={onCreateEvent}>
            ➕ Create New Event
          </button>
        </div>
        <div className="coordinator-table-container">
          <table className="coordinator-data-table">
            <thead>
              <tr>
                <th>Event Name</th>
                <th>Date</th>
                <th>Venue</th>
                <th>Participants</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {events.map(event => (
                <tr key={event.id}>
                  <td><strong>{event.name}</strong></td>
                  <td>{event.date}</td>
                  <td>{event.venue}</td>
                  <td>{event.participants}</td>
                  <td>
                    <span className={`coordinator-status-badge ${event.status}`}>
                      {event.status.charAt(0).toUpperCase() + event.status.slice(1)}
                    </span>
                  </td>
                  <td>
                    <div className="coordinator-action-buttons">
                      <button 
                        className="coordinator-btn coordinator-btn-secondary coordinator-btn-sm"
                        onClick={() => onEditEvent(event.id)}
                      >
                        ✏️ Edit
                      </button>
                      <button 
                        className="coordinator-btn coordinator-btn-danger coordinator-btn-sm"
                        onClick={() => onDeleteEvent(event.id)}
                      >
                        🗑️ Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
};

// Club Members Component
const ClubMembers = ({ members }) => {
  return (
    <>
      <section className="coordinator-dashboard-section">
        <div className="coordinator-section-header">
          <h3>👥 Club Members</h3>
          <button className="coordinator-btn coordinator-btn-secondary">
            📥 Export
          </button>
        </div>
        
        <div className="coordinator-search-bar">
          <input 
            type="text" 
            className="coordinator-search-input"
            placeholder="Search by name, email, or department..."
          />
        </div>

        <div className="coordinator-table-container">
          <table className="coordinator-data-table">
            <thead>
              <tr>
                <th>Member Name</th>
                <th>Department</th>
                <th>Email</th>
                <th>Joined Date</th>
              </tr>
            </thead>
            <tbody>
              {members.map(member => (
                <tr key={member.id}>
                  <td><strong>{member.name}</strong></td>
                  <td>{member.department}</td>
                  <td>{member.email}</td>
                  <td>{member.joinedDate}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {members.length === 0 && (
          <div className="coordinator-empty-state">
            <div className="coordinator-empty-state-icon">🔍</div>
            <p>No members found matching your search.</p>
          </div>
        )}
      </section>
    </>
  );
};

// Club Overview Component
const ClubOverview = ({ data }) => {
  return (
    <>
      <section className="coordinator-dashboard-section">
        <div className="coordinator-section-header">
          <h3>📊 Club Overview</h3>
        </div>
        
        <div className="coordinator-stats-grid">
          <div className="coordinator-stat-card">
            <h4>Total Events</h4>
            <div className="coordinator-stat-value primary">{data.totalEvents}</div>
          </div>
          <div className="coordinator-stat-card">
            <h4>Total Registrations</h4>
            <div className="coordinator-stat-value success">{data.events.reduce((acc, e) => acc + e.participants, 0)}</div>
          </div>
          <div className="coordinator-stat-card">
            <h4>Upcoming Events</h4>
            <div className="coordinator-stat-value warning">{data.upcomingEvents}</div>
          </div>
        </div>

        <h4 style={{ marginBottom: '16px', color: 'var(--coordinator-text-dark)' }}>Upcoming Events List</h4>
        <div className="coordinator-table-container">
          <table className="coordinator-data-table">
            <thead>
              <tr>
                <th>Event Name</th>
                <th>Date</th>
                <th>Venue</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {data.events.filter(e => e.status === 'upcoming').map(event => (
                <tr key={event.id}>
                  <td><strong>{event.name}</strong></td>
                  <td>{event.date}</td>
                  <td>{event.venue}</td>
                  <td>
                    <span className={`coordinator-status-badge ${event.status}`}>
                      {event.status.charAt(0).toUpperCase() + event.status.slice(1)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="coordinator-dashboard-section">
        <div className="coordinator-section-header">
          <h3>📝 Recent Activity</h3>
        </div>
        <ul className="coordinator-activity-list">
          {data.recentActivity.map(activity => (
            <li key={activity.id} className="coordinator-activity-item">
              <div className="coordinator-activity-icon">
                {activity.type === "event" && "📅"}
                {activity.type === "member" && "👤"}
                {activity.type === "registration" && "📝"}
              </div>
              <div className="coordinator-activity-content">
                <p>{activity.message}</p>
                <span>{activity.time}</span>
              </div>
            </li>
          ))}
        </ul>
      </section>
    </>
  );
};

export default CoordinatorDashboard;
