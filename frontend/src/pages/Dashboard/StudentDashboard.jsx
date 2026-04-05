import React, { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";
import "./ProfessionalDarkDashboard.css";
import renderMeetings from './renderMeetings';
import fetchMeetings from './fetchMeetings';
import RenderClubEvents from './renderClubEvents';
import fetchClubEvents from './fetchClubEvents';

const StudentDashboard = ({ user }) => {
  const navigate = useNavigate();
  const { logout } = useContext(AuthContext);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activeSection, setActiveSection] = useState("dashboard");
  
  // State for data
  const [stats, setStats] = useState({ joinedClubs: 0, registeredEvents: 0, upcomingEvents: [] });
  const [allClubs, setAllClubs] = useState([]);
  const [joinedClubs, setJoinedClubs] = useState([]);
  const [myClubs, setMyClubs] = useState([]); // Clubs created by this user
  const [badges, setBadges] = useState([]); // Badges based on roles (convener, co-convener)
  const [allEvents, setAllEvents] = useState([]);
  const [clubEvents, setClubEvents] = useState([]);
  const [clubEventsLoading, setClubEventsLoading] = useState(false);
  const [registeredEvents, setRegisteredEvents] = useState([]);
  const [meetings, setMeetings] = useState([]); 
  const [meetingsLoading, setMeetingsLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  
  // Modal states
  const [showClubDetails, setShowClubDetails] = useState(false);
  const [selectedClub, setSelectedClub] = useState(null);
  const [clubDetails, setClubDetails] = useState(null);
  const [showEventDetails, setShowEventDetails] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentEvent, setPaymentEvent] = useState(null);
  const [paymentForm, setPaymentForm] = useState({
    transactionId: "",
    paymentScreenshot: ""
  });
  const [submittingPayment, setSubmittingPayment] = useState(false);

  // Fetch data on section change
  useEffect(() => {
    // Always fetch my clubs to check if user is a club head
    fetchMyCreatedClubs();
    
    if (activeSection === "dashboard") {
      fetchDashboardStats();
    } else if (activeSection === "clubs") {
      fetchAllClubs();
      fetchJoinedClubs();
    } else if (activeSection === "events") {
      fetchAllEvents();
      fetchRegisteredEvents();
      fetchJoinedClubs().then(() => {
        if (joinedClubs.length > 0) {
          const clubIds = joinedClubs.map(c => c._id);
          fetchClubEvents(setClubEvents, setClubEventsLoading, clubIds);
        }
      });
    } else if (activeSection === "meetings") {
      fetchMeetings(setMeetings, setMeetingsLoading);
    }
  }, [activeSection]);

  const fetchDashboardStats = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("http://localhost:5000/api/events/student/stats", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (err) {
      console.error("Error fetching stats:", err);
    }
    setLoading(false);
  };

  const fetchAllClubs = async () => {
    setLoading(true);
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
    setLoading(false);
  };

const fetchJoinedClubs = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("http://localhost:5000/api/clubs/student/my-clubs", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setJoinedClubs(data);
      }
    } catch (err) {
      console.error("Error fetching joined clubs:", err);
    }
  };

  // Fetch clubs created by this user (for club head badge) and check convener/co-convener roles
  const fetchMyCreatedClubs = async () => {
    try {
      const token = localStorage.getItem("token");
      const userEmail = user?.email?.toLowerCase();
      
      // Fetch clubs created by this user
      const myClubsResponse = await fetch("http://localhost:5000/api/clubs/my-clubs", {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Fetch all clubs to check for convener/co-convener roles
      const allClubsResponse = await fetch("http://localhost:5000/api/clubs", {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (myClubsResponse.ok) {
        const myClubsData = await myClubsResponse.json();
        setMyClubs(myClubsData);
      }
      
      if (allClubsResponse.ok) {
        const allClubsData = await allClubsResponse.json();
        
        // Check if user is convener or co-convener in any club
        const newBadges = [];
        
        // Check for Convener role
        const convenerClubs = allClubsData.filter(club => 
          club.convener && club.convener.email && 
          club.convener.email.toLowerCase() === userEmail
        );
        
        // Check for Co-Convener role
        const coConvenerClubs = allClubsData.filter(club => 
          club.coConvener && club.coConvener.email && 
          club.coConvener.email.toLowerCase() === userEmail
        );
        
        // Add badges based on roles
        if (convenerClubs.length > 0) {
          newBadges.push({ type: 'convener', label: '🎯 Convener', clubs: convenerClubs.map(c => c.name) });
        }
        
        if (coConvenerClubs.length > 0) {
          newBadges.push({ type: 'co_convener', label: '⭐ Co-Convener', clubs: coConvenerClubs.map(c => c.name) });
        }
        
        setBadges(newBadges);
      }
    } catch (err) {
      console.error("Error fetching my clubs:", err);
    }
  };

  // Check if user is a club head (database role + created clubs)
  const isClubHead = user?.role === 'club_head' || (myClubs && myClubs.length > 0);
  
  // Get badge info for display
  const getConvenerBadge = () => badges.find(b => b.type === 'convener');
  const getCoConvenerBadge = () => badges.find(b => b.type === 'co_convener');

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

  const fetchRegisteredEvents = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("http://localhost:5000/api/events/student/registrations", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setRegisteredEvents(data);
      }
    } catch (err) {
      console.error("Error fetching registered events:", err);
    }
  };

  const handleJoinClub = async (clubId) => {
    setError("");
    setSuccess("");
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`http://localhost:5000/api/clubs/${clubId}/join`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      if (response.ok) {
        setSuccess("Successfully joined the club!");
        fetchJoinedClubs();
        fetchAllClubs();
        fetchDashboardStats(); // Refresh dashboard stats
        setTimeout(() => setSuccess(""), 3000);
      } else {
        setError(data.message || "Failed to join club");
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

  const handleRegisterEvent = async (eventId) => {
    setError("");
    setSuccess("");
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`http://localhost:5000/api/events/${eventId}/register`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      if (response.ok) {
        // Check if it's a paid event that needs payment
        if (data.registration && data.registration.paymentStatus === "pending") {
          // Find the event to get payment details
          const event = allEvents.find(e => e._id === eventId);
          setPaymentEvent(event);
          setShowPaymentModal(true);
          setSuccess("Registered! Please complete payment.");
        } else {
          setSuccess("Successfully registered for the event!");
        }
        fetchAllEvents();
        fetchRegisteredEvents();
        fetchDashboardStats(); // Refresh dashboard stats
        setTimeout(() => setSuccess(""), 3000);
      } else {
        setError(data.message || "Failed to register");
      }
    } catch (err) {
      setError("Network error. Please try again.");
    }
  };

  const handleScanQR = async (meeting) => {
    try {
      // Get QR data from clipboard or prompt (real app uses camera scanner)
      const qrData = prompt(`Scan QR for ${meeting.title}\\nPaste QR data here:`, `meeting:${meeting._id}:${Date.now()}`);
      if (!qrData) return;

      const token = localStorage.getItem("token");
      const response = await fetch("http://localhost:5000/api/meetings/attendance/mark", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({ qrData })
      });

      if (response.ok) {
        alert("Attendance marked! Waiting for approval.");
        fetchMeetings(setMeetings, setMeetingsLoading);
      } else {
        const data = await response.json();
        alert("Error: " + data.message);
      }
    } catch (err) {
      alert("Network error");
    }
  };

  const handlePaymentSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSubmittingPayment(true);
    
    try {
      const token = localStorage.getItem("token");
      // Find the registration for this event
      const regResponse = await fetch("http://localhost:5000/api/events/student/registrations", {
        headers: { Authorization: `Bearer ${token}` }
      });
      const registrations = await regResponse.json();
      const registration = registrations.find(r => r._id === paymentEvent?._id || r.eventName === paymentEvent?.eventName);
      
      if (registration) {
        // Update the registration with payment details
        const response = await fetch(`http://localhost:5000/api/events/${paymentEvent._id}/register`, {
          method: "POST",
          headers: { 
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}` 
          },
          body: JSON.stringify({
            transactionId: paymentForm.transactionId,
            paymentScreenshot: paymentForm.paymentScreenshot
          })
        });
        
        if (response.ok) {
          setSuccess("Payment submitted successfully! Waiting for verification.");
          setShowPaymentModal(false);
          setPaymentForm({ transactionId: "", paymentScreenshot: "" });
          fetchAllEvents();
          fetchRegisteredEvents();
          setTimeout(() => setSuccess(""), 3000);
        } else {
          const data = await response.json();
          setError(data.message || "Failed to submit payment");
        }
      }
    } catch (err) {
      setError("Network error. Please try again.");
    }
    setSubmittingPayment(false);
  };

  const handleViewEvent = (event) => {
    setSelectedEvent(event);
    setShowEventDetails(true);
  };

  const isClubJoined = (clubId) => {
    return joinedClubs.some(c => c._id === clubId);
  };

  const isEventRegistered = (eventId) => {
    return allEvents.some(e => e._id === eventId && e.isRegistered);
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

  const toggleSidebar = () => setSidebarCollapsed(!sidebarCollapsed);

  const handleLogout = () => {
    logout();
    navigate('/');
    window.location.reload();
  };

  // Generate a badge based on clubs joined
  const getBadge = (clubsCount) => {
    if (clubsCount >= 5) return { badge: "🥇 Gold Member", color: "#FFD700" };
    if (clubsCount >= 3) return { badge: "🥈 Silver Member", color: "#C0C0C0" };
    return { badge: "🥉 Bronze Member", color: "#CD7F32" };
  };

  const badge = getBadge(stats.joinedClubs);

  // ==================== RENDER SECTIONS ====================
  
  const renderDashboard = () => (
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

      {/* Stats Cards */}
      <section className="student-quick-overview">
        <div className="student-overview-card">
          <div className="student-overview-icon">🏛</div>
          <div className="student-overview-info">
            <h3>{stats.joinedClubs}</h3>
            <p>Joined Clubs</p>
          </div>
        </div>
        <div className="student-overview-card">
          <div className="student-overview-icon">📅</div>
          <div className="student-overview-info">
            <h3>{stats.registeredEvents}</h3>
            <p>Registered Events</p>
          </div>
        </div>
        <div className="student-overview-card">
          <div className="student-overview-icon">✅</div>
          <div className="student-overview-info">
            <h3>{stats.upcomingEvents?.length || 0}</h3>
            <p>Upcoming Events</p>
          </div>
        </div>
        <div className="student-overview-card">
          <div className="student-overview-icon">🎯</div>
          <div className="student-overview-info">
            <h3>{allEvents.filter(e => e.isRegistered).length}</h3>
            <p>My Events</p>
          </div>
        </div>
      </section>

      {/* Upcoming Events */}
      {stats.upcomingEvents && stats.upcomingEvents.length > 0 && (
        <section className="student-events-section">
          <div className="student-section-header">
            <h3>📅 Upcoming Events</h3>
            <button className="student-view-all-btn" onClick={() => setActiveSection("events")}>View All</button>
          </div>
          <div className="student-events-grid">
            {stats.upcomingEvents.slice(0, 3).map(event => (
              <div key={event._id} className="student-event-card">
                <div className="student-event-header">
                  <span className="student-event-icon">📌</span>
                  <h4>{event.eventName}</h4>
                </div>
                <div className="student-event-details">
                  <p><span>📅</span> {event.date}</p>
                  <p><span>🕒</span> {event.time}</p>
                  <p><span>📍</span> {event.location}</p>
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
        <h3>🏛 Explore Clubs</h3>
        <span className="student-club-count">{allClubs.length} clubs available</span>
      </div>
      
      {success && <div className="student-success-message">{success}</div>}
      {error && <div className="student-error-message">{error}</div>}

      {loading ? (
        <div className="student-loading">Loading clubs...</div>
      ) : (
        <div className="student-clubs-grid-full">
          {allClubs.map(club => (
            <div key={club._id} className="student-club-card-full">
              <div className="student-club-logo">{renderClubLogo(club)}</div>
              <div className="student-club-info">
                <h4>{club.name}</h4>
                <p className="student-club-description">{club.description}</p>
                <div className="student-club-stats">
                  <span>👥 {club.members?.length || 0} Members</span>
                </div>
              </div>
              <div className="student-club-actions">
                <button className="student-btn-details" onClick={() => handleViewClub(club)}>View</button>
                {isClubJoined(club._id) ? (
                  <button className="student-btn-joined" disabled>✓ Joined</button>
                ) : (
                  <button className="student-btn-join" onClick={() => handleJoinClub(club._id)}>Join Club</button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );

  const renderEvents = () => (
    <>
      <section className="student-events-full-section">
        <div className="student-section-header">
          <h3>📅 All Events</h3>
          <span className="student-event-count">{allEvents.length} events available</span>
        </div>
        {loading ? (
          <div className="student-loading">Loading events...</div>
        ) : (
          <div className="student-events-grid-full">
            {allEvents.slice(0, 6).map(event => (
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
                <div className="student-event-actions">
                  <button className="student-btn-details" onClick={() => handleViewEvent(event)}>View</button>
                  {event.isRegistered ? (
                    <button className="student-btn-joined" disabled>✓ Registered</button>
                  ) : (
                    <button className="student-btn-join" onClick={() => handleRegisterEvent(event._id)}>Register</button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

{joinedClubs.length > 0 && (
        <RenderClubEvents events={clubEvents} loading={clubEventsLoading} isStudent={true} />
      )}
    </>
  );

  const renderProfile = () => (
    <section className="student-profile-section">
      <div className="student-profile-header">
        <div className="student-profile-avatar-large">
          <img src={`https://ui-avatars.com/api/?name=${user?.name || 'Student'}&background=2563EB&color=fff&size=150`} alt="Profile" />
        </div>
        <div className="student-profile-info">
          <h2>{user?.name || 'Student'}</h2>
          <p>{user?.email || 'student@college.edu'}</p>
          
          {/* Show role badges based on teacher assignments */}
          {user?.role === 'club_head' && <span className="student-role-badge" style={{ backgroundColor: "#9C27B0" }}>👑 Club Head</span>}
          {getConvenerBadge() && <span className="student-role-badge" style={{ backgroundColor: "#FF5722" }}>🎯 Convener</span>}
          {getCoConvenerBadge() && <span className="student-role-badge" style={{ backgroundColor: "#00BCD4" }}>⭐ Co-Convener</span>}
          <span className="student-role-badge" style={{ backgroundColor: badge.color }}>{badge.badge}</span>
        </div>
      </div>
      <div className="student-profile-details">
        <div className="student-detail-card">
          <h4>📊 My Stats</h4>
          <p>Joined Clubs: {stats.joinedClubs}</p>
          <p>Registered Events: {stats.registeredEvents}</p>
          {isClubHead && <p>Created Clubs: {myClubs.length}</p>}
          {getConvenerBadge() && <p>Convener of: {getConvenerBadge().clubs.join(", ")}</p>}
          {getCoConvenerBadge() && <p>Co-Convener of: {getCoConvenerBadge().clubs.join(", ")}</p>}
        </div>
        <div className="student-detail-card">
          <h4>🎯 Joined Clubs</h4>
          {joinedClubs.length > 0 ? (
            <ul className="student-joined-list">
              {joinedClubs.map(club => (
                <li key={club._id}>{club.name}</li>
              ))}
            </ul>
          ) : (
            <p>No clubs joined yet</p>
          )}
        </div>
        {/* Show created clubs section if user is a club head */}
        {isClubHead && myClubs.length > 0 && (
          <div className="student-detail-card">
            <h4>🏛 My Created Clubs</h4>
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
          </div>
        )}
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
            <div className="student-modal-actions">
              {isClubJoined(selectedClub?._id) ? (
                <button className="student-btn-joined" disabled>✓ You're a Member</button>
              ) : (
                <button className="student-btn-join" onClick={() => { handleJoinClub(selectedClub?._id); setShowClubDetails(false); }}>
                  Join Club
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderEventDetailsModal = () => {
    if (!showEventDetails) return null;
    return (
      <div className="student-modal-overlay" onClick={() => setShowEventDetails(false)}>
        <div className="student-modal" onClick={(e) => e.stopPropagation()}>
          <div className="student-modal-header">
            <h3>📅 {selectedEvent?.eventName}</h3>
            <button className="student-modal-close" onClick={() => setShowEventDetails(false)}>×</button>
          </div>
          <div className="student-modal-body">
            <p><strong>Club:</strong> {selectedEvent?.clubName}</p>
            <p><strong>Date:</strong> {selectedEvent?.date}</p>
            <p><strong>Time:</strong> {selectedEvent?.time}</p>
            <p><strong>Location:</strong> {selectedEvent?.location}</p>
            <p><strong>Description:</strong> {selectedEvent?.description}</p>
            <p><strong>Max Participants:</strong> {selectedEvent?.maxParticipants || "Unlimited"}</p>
            <p><strong>Registered:</strong> {selectedEvent?.registrationCount || 0}</p>
            <div className="student-modal-actions">
              {selectedEvent?.isRegistered ? (
                <button className="student-btn-joined" disabled>✓ Already Registered</button>
              ) : (
                <button className="student-btn-join" onClick={() => { handleRegisterEvent(selectedEvent?._id); setShowEventDetails(false); }}>
                  Register Now
                </button>
              )}
            </div>
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
            <li className={activeSection === "clubs" ? "active" : ""} onClick={() => setActiveSection("clubs")}>
              <span className="student-nav-icon">🏛</span>
              {!sidebarCollapsed && <span>Clubs</span>}
            </li>
            <li className={activeSection === "events" ? "active" : ""} onClick={() => setActiveSection("events")}>
              <span className="student-nav-icon">📅</span>
              {!sidebarCollapsed && <span>Events</span>}
            </li>
            <li className={activeSection === "meetings" ? "active" : ""} onClick={() => setActiveSection("meetings")}>
              <span className="student-nav-icon">👥</span>
              {!sidebarCollapsed && <span>Meetings</span>}
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
              {activeSection === "events" && "Events"}
              {activeSection === "profile" && "My Profile"}
            </h1>
          </div>
          <div className="student-navbar-right">
            <div className="student-date-time">
              <span>{new Date().toLocaleDateString()}</span>
            </div>
            <div className="student-profile-dropdown" onClick={() => setActiveSection("profile")}>
              <img src={`https://ui-avatars.com/api/?name=${user?.name || 'Student'}&background=2563EB&color=fff`} alt="Profile" className="student-navbar-avatar" />
            </div>
          </div>
        </header>

        <div className="student-content-area">
          {activeSection === "dashboard" && renderDashboard()}
          {activeSection === "clubs" && renderClubs()}
          {activeSection === "events" && renderEvents()}
{activeSection === "meetings" && renderMeetings({ meetings, loading: meetingsLoading, userRole: 'student', onScanQR: handleScanQR })}
          {activeSection === "profile" && renderProfile()}
        </div>
      </main>

      {renderClubDetailsModal()}
      {renderEventDetailsModal()}
    </div>
  );
};

export default StudentDashboard;

