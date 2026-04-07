import React, { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";
import "./ProfessionalDarkDashboard.css";
import fetchMeetings from './fetchMeetings';

const ClubHeadDashboard = ({ user }) => {
  // All hooks called unconditionally FIRST - no early returns before hooks
  const navigate = useNavigate();
  const { logout } = useContext(AuthContext);
  
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activeSection, setActiveSection] = useState("dashboard");
  
  const [myClubs, setMyClubs] = useState([]);
  const [allEvents, setAllEvents] = useState([]);
  const [meetings, setMeetings] = useState([]);
  const [meetingsLoading, setMeetingsLoading] = useState(false);
  const [roleRequests, setRoleRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  
  const [showClubDetails, setShowClubDetails] = useState(false);
  const [selectedClub, setSelectedClub] = useState(null);
  const [clubDetails, setClubDetails] = useState(null);
  const [showCreateEvent, setShowCreateEvent] = useState(false);
  const [newEvent, setNewEvent] = useState({
    eventName: "",
    description: "",
    date: "",
    time: "",
    location: "",
    maxParticipants: ""
  });

  // useEffect - unconditional, top level
  useEffect(() => {
    if (activeSection === "dashboard") {
      fetchDashboardData();
    } else if (activeSection === "clubs") {
      fetchMyClubs();
    } else if (activeSection === "events") {
      fetchAllEvents();
      fetchMyClubs();
      console.log('ClubHead Events tab loaded');
    } else if (activeSection === "meetings") {
      fetchMeetingsFunc();
    } else if (activeSection === "requests") {
      fetchRoleRequests();
    }
  }, [activeSection]);

  // Access check - AFTER ALL HOOKS
  const hasAccess = user && (user.role === 'club_head' || user.role === 'convener');
  if (!hasAccess) {
    return (
      <div className="access-denied" style={{padding: '40px 20px', textAlign: 'center', color: 'var(--text-muted)'}}>
        <h2>Access Denied</h2>
        <p>You need "club_head" or "convener" role.</p>
        <button onClick={() => navigate('/')} className="btn-primary">
          Go Home
        </button>
      </div>
    );
  }

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const clubsResponse = await fetch(`${process.env.REACT_APP_API_URL || 'https://university-event-club-management-system.onrender.com'}/api/clubs/my-clubs`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const requestsResponse = await fetch(`${process.env.REACT_APP_API_URL || 'https://university-event-club-management-system.onrender.com'}/api/clubs/role-requests`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (clubsResponse.ok) setMyClubs(await clubsResponse.json());
      if (requestsResponse.ok) {
        const data = await requestsResponse.json();
        setRoleRequests(data.filter(r => r.status === "pending"));
      }
    } catch (err) {
      console.error("Dashboard error:", err);
    }
    setLoading(false);
  };

  const fetchMyClubs = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'https://university-event-club-management-system.onrender.com'}/api/clubs/my-clubs`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) setMyClubs(await response.json());
    } catch (err) {
      console.error("My clubs error:", err);
    }
    setLoading(false);
  };

  const fetchAllEvents = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'https://university-event-club-management-system.onrender.com'}/api/events/club-head-events`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        console.log('ClubHead events:', data.length);
        setAllEvents(data);
      }
    } catch (err) {
      console.error("Events error:", err);
    }
    setLoading(false);
  };

  const fetchMeetingsFunc = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'https://university-event-club-management-system.onrender.com'}/api/meetings/my-meetings`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) setMeetings(await response.json());
    } catch (err) {
      console.error("Meetings error:", err);
    }
    setLoading(false);
  };

  const fetchRoleRequests = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'https://university-event-club-management-system.onrender.com'}/api/clubs/role-requests`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) setRoleRequests(await response.json());
    } catch (err) {
      console.error("Requests error:", err);
    }
    setLoading(false);
  };

  const handleReviewRequest = async (requestId, status) => {
    setError("");
    setSuccess("");
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'https://university-event-club-management-system.onrender.com'}/api/clubs/role-requests/${requestId}/review`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status })
      });
      if (response.ok) {
        setSuccess(`Request ${status}!`);
        setRoleRequests(prev => prev.filter(req => req._id !== requestId));
        setTimeout(() => setSuccess(""), 3000);
      }
    } catch (err) {
      setError("Network error");
    }
  };

  const handleCreateEvent = async (e) => {
    e.preventDefault();
    if (!selectedClub) return setError("Select club");
    
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'https://university-event-club-management-system.onrender.com'}/api/events`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ ...newEvent, club: selectedClub })
      });
      if (response.ok) {
        setSuccess("Event created!");
        setShowCreateEvent(false);
        setNewEvent({ eventName: "", description: "", date: "", time: "", location: "", maxParticipants: "" });
        fetchAllEvents();
      } else setError("Create failed");
    } catch (err) {
      setError("Network error");
    }
  };

  const handleViewClub = async (club) => {
    setSelectedClub(club._id);
    setShowClubDetails(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'https://university-event-club-management-system.onrender.com'}/api/clubs/${club._id}/details`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) setClubDetails(await response.json());
    } catch (err) {
      console.error(err);
    }
  };

  const toggleSidebar = () => setSidebarCollapsed(!sidebarCollapsed);
  const handleLogout = () => {
    logout();
    navigate('/');
    window.location.reload();
  };

  const getClubLogo = (name) => {
    const n = name?.toLowerCase() || "";
    if (n.includes('code') || n.includes('tech')) return '💻';
    if (n.includes('robot')) return '🤖';
    if (n.includes('cultural') || n.includes('art')) return '🎭';
    if (n.includes('sport')) return '⚽';
    if (n.includes('drama')) return '🎬';
    if (n.includes('music')) return '🎵';
    if (n.includes('science')) return '🔬';
    if (n.includes('business')) return '💼';
    if (n.includes('book')) return '📚';
    return '🏛';
  };

  const isValidUrl = (string) => {
    try {
      return new URL(string).protocol.startsWith('http');
    } catch {
      return false;
    }
  };

  const renderClubLogo = (club) => {
    const logo = club.logo;
    if (logo && isValidUrl(logo)) {
      return <img src={logo} alt={club.name} className="club-logo-img" onError={(e) => e.target.style.display = 'none'} />;
    }
    return <span className="club-logo-emoji">{getClubLogo(club.name)}</span>;
  };

  // RENDER SECTIONS
  const renderDashboard = () => (
    <>
      <section className="welcome-section">
        <h2>👋 Welcome, {user.name}!</h2>
        <p>Manage clubs & requests</p>
      </section>
      <section className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">🏛</div>
          <h3>{myClubs.length}</h3>
          <p>My Clubs</p>
        </div>
        <div className="stat-card">
          <div className="stat-icon">📋</div>
          <h3>{roleRequests.filter(r => r.status === "pending").length}</h3>
          <p>Pending Requests</p>
        </div>
      </section>
    </>
  );

  const renderClubs = () => (
    <section className="clubs-section">
      {loading ? (
        <div>Loading...</div>
      ) : myClubs.length === 0 ? (
        <div>No clubs</div>
      ) : (
        myClubs.map(club => (
          <div key={club._id} className="club-card">
            {renderClubLogo(club)}
            <h4>{club.name}</h4>
            <p>{club.description}</p>
            <span className={`status ${club.status}`}>{club.status}</span>
            <button onClick={() => handleViewClub(club)}>View</button>
          </div>
        ))
      )}
    </section>
  );

  // Simplified renders for other sections
  const renderEvents = () => <section>Events Section</section>;
  const renderMeetingsSection = () => <section>Meetings Section</section>;
  const renderRequests = () => <section>Requests Section</section>;
  const renderProfile = () => <section>Profile Section</section>;

  return (
    <div className="dashboard">
      <aside className={`sidebar ${sidebarCollapsed ? 'collapsed' : ''}`}>
        <nav>
          <button onClick={() => setActiveSection("dashboard")}>Dashboard</button>
          <button onClick={() => setActiveSection("clubs")}>Clubs</button>
          <button onClick={() => setActiveSection("events")}>Events</button>
          <button onClick={() => setActiveSection("meetings")}>Meetings</button>
          <button onClick={() => setActiveSection("requests")}>Requests</button>
          <button onClick={handleLogout}>Logout</button>
        </nav>
      </aside>
      <main>
        {activeSection === "dashboard" && renderDashboard()}
        {activeSection === "clubs" && renderClubs()}
        {activeSection === "events" && renderEvents()}
        {activeSection === "meetings" && renderMeetingsSection()}
        {activeSection === "requests" && renderRequests()}
        {activeSection === "profile" && renderProfile()}
      </main>
    </div>
  );
};

export default ClubHeadDashboard;
