import React, { useEffect, useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";
import "./TeacherDashboard.css";

const TeacherDashboard = ({ user }) => {
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
    recentActivities: []
  });
  const [recentClubs, setRecentClubs] = useState([]);
  const [recentEvents, setRecentEvents] = useState([]);
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
    const [showCreateMeetingModal, setShowCreateMeetingModal] = useState(false);
    const [meetings, setMeetings] = useState([]);
  const [showEditEventModal, setShowEditEventModal] = useState(false);
  const [showEventDetailsModal, setShowEventDetailsModal] = useState(false);
  const [showParticipantsModal, setShowParticipantsModal] = useState(false);
  const [showPaymentVerifyModal, setShowPaymentVerifyModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [eventDetails, setEventDetails] = useState(null);
  const [eventParticipants, setEventParticipants] = useState([]);
  const [editingEvent, setEditingEvent] = useState(null);
  const [eventStats, setEventStats] = useState({ totalEvents: 0, upcomingEvents: 0, pastEvents: 0, totalRegistrations: 0, pendingPayments: 0 });
  const [pendingPayments, setPendingPayments] = useState([]);
  // Meeting form state
  const [meetingFormData, setMeetingFormData] = useState({
    title: "",
    club: "",
    description: "",
    date: "",
    startTime: "",
    endTime: "",
    location: ""
  });
  
  // Form state
  const [clubFormData, setClubFormData] = useState({
    name: "",
    description: "",
    category: "Technical",
    logo: "",
    // Coordinator (auto-filled from logged-in user)
    coordinatorName: "",
    coordinatorEmail: "",
    // Convener
    convenerName: "",
    convenerEmail: "",
    // Co-convener
    coConvenerName: "",
    coConvenerEmail: "",
    // Meeting details
    meetingDay: "",
    meetingTime: "",
    meetingLocation: "",
    // Membership settings
    maxMembers: 50,
    joinType: "approval",
    // Contact
    clubEmail: ""
  });
  const [eventFormData, setEventFormData] = useState({
    eventName: "",
    clubId: "",
    description: "",
    poster: "",
    date: "",
    startTime: "",
    endTime: "",
    eventMode: "offline",
    location: "",
    meetingLink: "",
    eventType: "free",
    registrationFee: 0,
    upiId: "",
    qrCode: "",
    maxParticipants: "",
    registrationDeadline: ""
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
    } else if (activeSection === "meetings") {
      fetchMeetings();
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

    // Format the data for backend
    const clubData = {
      name: clubFormData.name,
      description: clubFormData.description,
      category: clubFormData.category,
      logo: clubFormData.logo,
      coordinator: {
        name: clubFormData.coordinatorName || user?.name || "",
        email: clubFormData.coordinatorEmail || user?.email || ""
      },
      convener: {
        name: clubFormData.convenerName,
        email: clubFormData.convenerEmail
      },
      coConvener: {
        name: clubFormData.coConvenerName,
        email: clubFormData.coConvenerEmail
      },
      meetingDay: clubFormData.meetingDay,
      meetingTime: clubFormData.meetingTime,
      meetingLocation: clubFormData.meetingLocation,
      maxMembers: clubFormData.maxMembers,
      joinType: clubFormData.joinType,
      clubEmail: clubFormData.clubEmail
    };

    try {
      const response = await fetch("http://localhost:5000/api/clubs", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`
        },
        body: JSON.stringify(clubData)
      });

      const data = await response.json();

      if (response.ok) {
        // Show role assignment info if any
        let successMsg = "Club created successfully! Waiting for admin approval.";
        if (data.roleAssignments && data.roleAssignments.length > 0) {
          const pendingReg = data.roleAssignments.filter(r => r.status === "pending_registration");
          if (pendingReg.length > 0) {
            successMsg += ` Note: ${pendingReg.map(r => r.email).join(", ")} need to register first to get their roles.`;
          }
        }
        setSuccess(successMsg);
        setShowCreateClubModal(false);
        resetClubFormData();
        fetchMyClubs();
        setTimeout(() => setSuccess(""), 5000);
      } else {
        setError(data.message || "Failed to create club");
      }
    } catch (err) {
      setError("Network error. Please try again.");
    }
  };

  const resetClubFormData = () => {
    setClubFormData({
      name: "",
      description: "",
      category: "Technical",
      logo: "",
      coordinatorName: "",
      coordinatorEmail: "",
      convenerName: "",
      convenerEmail: "",
      coConvenerName: "",
      coConvenerEmail: "",
      meetingDay: "",
      meetingTime: "",
      meetingLocation: "",
      maxMembers: 50,
      joinType: "approval",
      clubEmail: ""
    });
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
        // Optimistic UI update - filter out deleted club
        setMyClubs(prevClubs => prevClubs.filter(club => club._id !== clubId));
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
        setEventFormData({ eventName: "", clubId: "", description: "", poster: "", date: "", startTime: "", endTime: "", eventMode: "offline", location: "", meetingLink: "", eventType: "free", registrationFee: 0, upiId: "", qrCode: "", maxParticipants: "", registrationDeadline: "" });
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

  const handleVerifyPayment = async (registrationId, status) => {
    setError("");
    setSuccess("");
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`http://localhost:5000/api/events/${selectedEvent._id}/participants/${registrationId}/verify`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status })
      });
      
      if (response.ok) {
        setSuccess(`Payment ${status} successfully!`);
        // Refresh participants
        handleViewParticipants(selectedEvent);
        fetchEventStats();
        setTimeout(() => setSuccess(""), 3000);
      } else {
        const data = await response.json();
        setError(data.message || "Failed to verify payment");
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
                  <span>👨‍🎓 {(club.members?.filter(m => m.role === 'student').length || 0)} Students</span>
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
                <th>Approval</th>
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
                  <td><span className={`status-badge status-${event.approvalStatus || 'pending'}`}>{event.approvalStatus || 'Pending'}</span></td>
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

  const handleMeetingInputChange = (e) => {
    setMeetingFormData({ ...meetingFormData, [e.target.name]: e.target.value });
  };

  const handleCreateMeeting = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    try {
      const token = localStorage.getItem("token");
      const response = await fetch("http://localhost:5000/api/meetings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(meetingFormData)
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess("Meeting created successfully with QR code!");
        setShowCreateMeetingModal(false);
        setMeetingFormData({
          title: "",
          club: "",
          description: "",
          date: "",
          startTime: "",
          endTime: "",
          location: ""
        });
        fetchMeetings();
        setTimeout(() => setSuccess(""), 5000);
      } else {
        setError(data.message || "Failed to create meeting");
      }
    } catch (err) {
      setError("Network error. Please try again.");
    }
  };

  const fetchMeetings = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("http://localhost:5000/api/meetings/my-meetings", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setMeetings(data);
      }
    } catch (err) {
      console.error("Error fetching meetings:", err);
    }
  };

  const renderMeetingsSection = () => (
    <section className="teacher-meetings-section">
      <div className="teacher-section-header">
        <h3>👥 Meetings</h3>
        <button className="teacher-btn-create" onClick={() => setShowCreateMeetingModal(true)}>
          + Create Meeting
        </button>
      </div>
      {success && <div className="teacher-success-message">{success}</div>}
      {error && <div className="teacher-error-message">{error}</div>}
      
      {meetings.length > 0 ? (
        <div className="teacher-events-table-container">
          <table className="teacher-events-table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Club</th>
                <th>Date</th>
                <th>Time</th>
                <th>Location</th>
                <th>Attendance</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {meetings.map(meeting => (
                <tr key={meeting._id}>
                  <td><strong>{meeting.title}</strong></td>
                  <td>{meeting.club?.name || 'N/A'}</td>
                  <td>{new Date(meeting.date).toLocaleDateString()}</td>
                  <td>{meeting.startTime} - {meeting.endTime}</td>
                  <td>{meeting.location}</td>
                  <td>{meeting.attendances?.length || 0}</td>
                  <td><span className={`status-badge status-${meeting.status || 'scheduled'}`}>{meeting.status || 'Scheduled'}</span></td>
                  <td style={{ whiteSpace: 'nowrap' }}>
                    {meeting.qrImage ? (
                      <>
                        <img src={meeting.qrImage} alt="QR" style={{width: '32px', height: '32px', marginRight: '5px', cursor: 'pointer', verticalAlign: 'middle'}} 
                             title="Click to enlarge"
                             onClick={() => {
                               const modal = document.createElement('div');
                               modal.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.8);display:flex;align-items:center;justify-content:center;z-index:9999';
                               modal.innerHTML = `<div style="background:white;padding:20px;border-radius:10px;text-align:center;max-width:90%;max-height:90%;overflow:auto;">
                                   <h3>${meeting.title} QR Code</h3>
                                   <img src="${meeting.qrImage}" style="width:300px;height:300px;border:1px solid #ddd;" />
                                   <br/><button onclick="this.parentElement.parentElement.remove()" style="margin-top:10px;padding:8px 16px;background:#2563eb;color:white;border:none;border-radius:4px;cursor:pointer;">Close</button>
                                 </div>`;
                               document.body.appendChild(modal);
                             }} />
                        <button className="teacher-btn-view-small" style={{padding: '4px 8px', fontSize: '12px', verticalAlign: 'middle'}}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const link = document.createElement('a');
                                  link.href = meeting.qrImage;
                                  link.download = `QR-${meeting.title.replace(/[^a-z0-9]/gi, '_')}.png`;
                                  document.body.appendChild(link);
                                  link.click();
                                  document.body.removeChild(link);
                                }}>Download</button>
                      </>
                    ) : (
                      <span style={{color: '#999', fontSize: '12px'}}>No QR</span>
                    )}
                    <button className="teacher-btn-delete" style={{padding: '4px 8px', fontSize: '12px', marginLeft: '5px', verticalAlign: 'middle'}}
                            onClick={() => {
                              if(window.confirm('Delete this meeting?')) {
                                fetch(`http://localhost:5000/api/meetings/${meeting._id}`, {
                                  method: 'DELETE',
                                  headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
                                }).then(res => res.json()).then(data => {
                                  if(data.message) window.alert('Meeting deleted');
                                  fetchMeetings();
                                }).catch(err => console.error('Delete error:', err));
                              }
                            }}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="teacher-empty-state">
          <div className="teacher-empty-state-icon">👥</div>
          <p>No meetings scheduled yet.</p>
          <button className="teacher-btn-create" onClick={() => setShowCreateMeetingModal(true)}>
            Create First Meeting
          </button>
        </div>
      )}
    </section>
  );

  const renderCreateMeetingModal = () => {
    if (!showCreateMeetingModal) return null;
    return (
      <div className="teacher-modal-overlay" onClick={() => setShowCreateMeetingModal(false)}>
        <div className="teacher-modal teacher-modal-large" onClick={(e) => e.stopPropagation()}>
          <div className="teacher-modal-header">
            <h3>👥 Create New Meeting</h3>
            <button className="teacher-modal-close" onClick={() => setShowCreateMeetingModal(false)}>×</button>
          </div>
          <form onSubmit={handleCreateMeeting}>
            <div className="form-section-title">📋 Meeting Details</div>
            <div className="teacher-form-group">
              <label>Select Club *</label>
              <select name="club" value={meetingFormData.club} onChange={handleMeetingInputChange} required>
                <option value="">Select club</option>
                {myClubs.map(club => (
                  <option key={club._id} value={club._id}>{club.name}</option>
                ))}
              </select>
            </div>
            <div className="teacher-form-group">
              <label>Meeting Title *</label>
              <input type="text" name="title" value={meetingFormData.title} onChange={handleMeetingInputChange} placeholder="e.g., Weekly Club Meeting" required />
            </div>
            <div className="teacher-form-group">
              <label>Description</label>
              <textarea name="description" value={meetingFormData.description} onChange={handleMeetingInputChange} placeholder="Meeting agenda..." />
            </div>
            <div className="form-row">
              <div className="teacher-form-group">
                <label>Date *</label>
                <input type="date" name="date" value={meetingFormData.date} onChange={handleMeetingInputChange} required />
              </div>
              <div className="teacher-form-group">
                <label>Start Time *</label>
                <input type="time" name="startTime" value={meetingFormData.startTime} onChange={handleMeetingInputChange} required />
              </div>
            </div>
            <div className="form-row">
              <div className="teacher-form-group">
                <label>End Time</label>
                <input type="time" name="endTime" value={meetingFormData.endTime} onChange={handleMeetingInputChange} />
              </div>
            </div>
            <div className="teacher-form-group">
              <label>Location *</label>
              <input type="text" name="location" value={meetingFormData.location} onChange={handleMeetingInputChange} placeholder="e.g., Seminar Hall A-101" required />
            </div>
            {error && <div className="teacher-form-error">{error}</div>}
            <button type="submit" className="teacher-btn-submit">Create Meeting & Generate QR</button>
          </form>
        </div>
      </div>
    );
  };

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
                    <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Action</th></tr></thead>
                    <tbody>
                      {clubDetails.members.map(member => (
                        <tr key={member._id}>
                          <td>{member.name || "Unknown"}</td>
                          <td>{member.email}</td>
                          <td><span className={`status-badge status-${member.role || 'unknown'}`}>{member.role || 'Unknown'}</span></td>
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
    
    // Check if this event is paid
    const isPaidEvent = selectedEvent?.eventType === "paid" || (eventDetails?.event?.eventType === "paid");
    
    return (
      <div className="teacher-modal-overlay" onClick={() => setShowParticipantsModal(false)}>
        <div className="teacher-modal teacher-modal-large" onClick={(e) => e.stopPropagation()}>
          <div className="teacher-modal-header">
            <h3>👥 Event Participants</h3>
            <button className="teacher-modal-close" onClick={() => setShowParticipantsModal(false)}>×</button>
          </div>
          {success && <div className="teacher-success-message" style={{ margin: '10px' }}>{success}</div>}
          {error && <div className="teacher-error-message" style={{ margin: '10px' }}>{error}</div>}
          <div className="teacher-participants-list">
            {eventParticipants.length > 0 ? (
              <table className="teacher-members-table" style={{ width: '100%' }}>
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Name</th>
                    <th>Email</th>
                    {isPaidEvent && <th>Payment Status</th>}
                    {isPaidEvent && <th>Transaction ID</th>}
                    {isPaidEvent && <th>Actions</th>}
                  </tr>
                </thead>
                <tbody>
                  {eventParticipants.map((participant, index) => (
                    <tr key={participant._id}>
                      <td>{index + 1}</td>
                      <td>{participant.name}</td>
                      <td>{participant.email}</td>
                      {isPaidEvent && (
                        <>
                          <td>
                            <span className={`status-badge status-${participant.paymentStatus || 'pending'}`}>
                              {participant.paymentStatus || 'pending'}
                            </span>
                          </td>
                          <td>{participant.transactionId || '-'}</td>
                          <td>
                            {participant.paymentStatus === "pending" && (
                              <>
                                <button 
                                  className="teacher-btn-approve" 
                                  style={{ marginRight: '5px', padding: '5px 10px', fontSize: '12px' }}
                                  onClick={() => handleVerifyPayment(participant._id, "approved")}
                                >
                                  Approve
                                </button>
                                <button 
                                  className="teacher-btn-reject" 
                                  style={{ padding: '5px 10px', fontSize: '12px' }}
                                  onClick={() => handleVerifyPayment(participant._id, "rejected")}
                                >
                                  Reject
                                </button>
                              </>
                            )}
                            {participant.paymentStatus === "approved" && <span style={{ color: 'green' }}>✓ Verified</span>}
                            {participant.paymentStatus === "rejected" && <span style={{ color: 'red' }}>✗ Rejected</span>}
                          </td>
                        </>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
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
              {activeSection === "dashboard" && "Teacher Dashboard"}
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
          {activeSection === "dashboard" && (
            <section className="teacher-dashboard-section">
              {/* Welcome Banner */}
              <div className="teacher-welcome-banner">
                <div className="teacher-welcome-content">
                  <div className="teacher-welcome-text">
                    <h2>👋 Welcome back, {user?.name || 'Teacher'}!</h2>
                    <p>Here's an overview of your club and event activities.</p>
                  </div>
                  <div className="teacher-welcome-illustration">
                    <span className="teacher-illustration-icon">🎓</span>
                  </div>
                </div>
              </div>

              {/* Stats Cards */}
              <div className="teacher-stats-grid">
                <div className="teacher-stat-card">
                  <div className="teacher-stat-icon" style={{ background: 'linear-gradient(135deg, #667eea, #764ba2)' }}>🏛</div>
                  <div className="teacher-stat-info">
                    <h3>{myClubs.length}</h3>
                    <p>Total Clubs</p>
                  </div>
                </div>
                <div className="teacher-stat-card">
                  <div className="teacher-stat-icon" style={{ background: 'linear-gradient(135deg, #f093fb, #f5576c)' }}>📅</div>
                  <div className="teacher-stat-info">
                    <h3>{eventStats.totalEvents || 0}</h3>
                    <p>Total Events</p>
                  </div>
                </div>
                <div className="teacher-stat-card">
                  <div className="teacher-stat-icon" style={{ background: 'linear-gradient(135deg, #4facfe, #00f2fe)' }}>👥</div>
                  <div className="teacher-stat-info">
                    <h3>{myClubs.reduce((acc, club) => acc + (club.members?.filter(m => m.role === 'student').length || 0), 0)}</h3>
                    <p>Total Students</p>
                  </div>
                </div>
                <div className="teacher-stat-card">
                  <div className="teacher-stat-icon" style={{ background: 'linear-gradient(135deg, #43e97b, #38f9d7)' }}>✅</div>
                  <div className="teacher-stat-info">
                    <h3>{eventStats.upcomingEvents || 0}</h3>
                    <p>Upcoming Events</p>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="teacher-quick-actions">
                <h3>⚡ Quick Actions</h3>
                <div className="teacher-action-buttons">
                  <button className="teacher-action-btn" onClick={() => setShowCreateClubModal(true)}>
                    <span>🏛</span> Create New Club
                  </button>
                  <button className="teacher-action-btn" onClick={() => { setActiveSection("events"); }}>
                    <span>📅</span> Manage Events
                  </button>
                  <button className="teacher-action-btn" onClick={() => { setActiveSection("myClubs"); }}>
                    <span>👥</span> View Members
                  </button>
                </div>
              </div>

              {/* Recent Activity */}
              <div className="teacher-recent-section">
                <h3>📋 Recent Clubs</h3>
                {myClubs.length > 0 ? (
                  <div className="teacher-recent-grid">
                    {myClubs.slice(0, 3).map(club => (
                      <div key={club._id} className="teacher-recent-card">
                        <div className="teacher-recent-icon">🏛</div>
                        <div className="teacher-recent-info">
                          <h4>{club.name}</h4>
                          <p>{club.category || "General"}</p>
                          <span className={`status-badge status-${club.status}`}>{club.status || "pending"}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="teacher-empty-recent">
                    <p>No clubs created yet. Create your first club to get started!</p>
                  </div>
                )}
              </div>
            </section>
          )}
          {activeSection === "myClubs" && renderMyClubsSection()}
        {activeSection === "events" && renderEventsSection()}
        {activeSection === "meetings" && renderMeetingsSection()}
        {activeSection === "profile" && renderProfileSection()}
        </div>
      </main>

      {/* Create Club Modal */}
      {showCreateClubModal && (
        <div className="teacher-modal-overlay" onClick={() => setShowCreateClubModal(false)}>
          <div className="teacher-modal teacher-modal-large" onClick={(e) => e.stopPropagation()}>
            <div className="teacher-modal-header">
              <h3>Create New Club</h3>
              <button className="teacher-modal-close" onClick={() => setShowCreateClubModal(false)}>×</button>
            </div>
            <form onSubmit={handleCreateClub}>
              {/* Basic Club Information */}
              <div className="form-section-title">📋 Basic Club Information</div>
              <div className="teacher-form-group">
                <label>Club Name *</label>
                <input type="text" name="name" value={clubFormData.name} onChange={handleClubInputChange} placeholder="e.g., AI Club" required />
              </div>
              <div className="teacher-form-group">
                <label>Category *</label>
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
                <label>Description *</label>
                <textarea name="description" value={clubFormData.description} onChange={handleClubInputChange} placeholder="Describe your club..." required />
              </div>
              <div className="teacher-form-group">
                <label>Club Logo URL (Optional)</label>
                <input type="text" name="logo" value={clubFormData.logo} onChange={handleClubInputChange} placeholder="https://example.com/logo.png" />
              </div>

              {/* Leadership Assignment */}
              <div className="form-section-title">👥 Leadership Assignment</div>
              
              {/* Teacher Coordinator - Auto-filled */}
              <div className="teacher-form-group">
                <label>Teacher Coordinator</label>
                <div className="form-row">
                  <input type="text" name="coordinatorName" value={clubFormData.coordinatorName || user?.name || ""} onChange={handleClubInputChange} placeholder="Coordinator Name" />
                  <input type="email" name="coordinatorEmail" value={clubFormData.coordinatorEmail || user?.email || ""} onChange={handleClubInputChange} placeholder="Coordinator Email" />
                </div>
                <small className="form-hint">Auto-filled from your account</small>
              </div>

              {/* Convener */}
              <div className="teacher-form-group">
                <label>Convener (Student Leader)</label>
                <div className="form-row">
                  <input type="text" name="convenerName" value={clubFormData.convenerName} onChange={handleClubInputChange} placeholder="Convener Name" />
                  <input type="email" name="convenerEmail" value={clubFormData.convenerEmail} onChange={handleClubInputChange} placeholder="Convener Email" />
                </div>
              </div>

              {/* Co-Convener */}
              <div className="teacher-form-group">
                <label>Co-Convener</label>
                <div className="form-row">
                  <input type="text" name="coConvenerName" value={clubFormData.coConvenerName} onChange={handleClubInputChange} placeholder="Co-Convener Name" />
                  <input type="email" name="coConvenerEmail" value={clubFormData.coConvenerEmail} onChange={handleClubInputChange} placeholder="Co-Convener Email" />
                </div>
              </div>

              {/* Meeting Details */}
              <div className="form-section-title">📅 Meeting Details</div>
              <div className="teacher-form-group">
                <label>Meeting Day</label>
                <select name="meetingDay" value={clubFormData.meetingDay} onChange={handleClubInputChange}>
                  <option value="">Select Day</option>
                  <option value="Monday">Monday</option>
                  <option value="Tuesday">Tuesday</option>
                  <option value="Wednesday">Wednesday</option>
                  <option value="Thursday">Thursday</option>
                  <option value="Friday">Friday</option>
                  <option value="Saturday">Saturday</option>
                  <option value="Sunday">Sunday</option>
                </select>
              </div>
              <div className="teacher-form-group">
                <label>Meeting Time</label>
                <input type="text" name="meetingTime" value={clubFormData.meetingTime} onChange={handleClubInputChange} placeholder="e.g., 4:00 PM" />
              </div>
              <div className="teacher-form-group">
                <label>Meeting Location</label>
                <input type="text" name="meetingLocation" value={clubFormData.meetingLocation} onChange={handleClubInputChange} placeholder="e.g., Seminar Hall" />
              </div>

              {/* Membership Settings */}
              <div className="form-section-title">⚙️ Membership Settings</div>
              <div className="teacher-form-group">
                <label>Maximum Members</label>
                <input type="number" name="maxMembers" value={clubFormData.maxMembers} onChange={handleClubInputChange} placeholder="e.g., 50" min="1" />
              </div>
              <div className="teacher-form-group">
                <label>Join Type</label>
                <div className="radio-group">
                  <label className="radio-label">
                    <input type="radio" name="joinType" value="open" checked={clubFormData.joinType === "open"} onChange={handleClubInputChange} />
                    Open Join (Anyone can join)
                  </label>
                  <label className="radio-label">
                    <input type="radio" name="joinType" value="approval" checked={clubFormData.joinType === "approval"} onChange={handleClubInputChange} />
                    Approval Required (Admin approves requests)
                  </label>
                </div>
              </div>

              {/* Contact Details */}
              <div className="form-section-title">📧 Contact Details</div>
              <div className="teacher-form-group">
                <label>Club Email</label>
                <input type="email" name="clubEmail" value={clubFormData.clubEmail} onChange={handleClubInputChange} placeholder="e.g., aiclub@college.com" />
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
          <div className="teacher-modal teacher-modal-large" onClick={(e) => e.stopPropagation()}>
            <div className="teacher-modal-header">
              <h3>Create New Event</h3>
              <button className="teacher-modal-close" onClick={() => setShowCreateEventModal(false)}>×</button>
            </div>
            <form onSubmit={handleCreateEvent}>
              {/* Basic Info */}
              <div className="form-section-title">📋 Event Information</div>
              <div className="teacher-form-group">
                <label>Event Name *</label>
                <input type="text" name="eventName" value={eventFormData.eventName} onChange={handleEventInputChange} placeholder="e.g., Hackathon 2026" required />
              </div>
              <div className="teacher-form-group">
                <label>Select Club *</label>
                <select name="clubId" value={eventFormData.clubId} onChange={handleEventInputChange} required>
                  <option value="">Select a club</option>
                  {myClubs.filter(c => c.status === 'approved').map(club => (
                    <option key={club._id} value={club._id}>{club.name}</option>
                  ))}
                </select>
              </div>
              <div className="teacher-form-group">
                <label>Description *</label>
                <textarea name="description" value={eventFormData.description} onChange={handleEventInputChange} placeholder="Describe your event..." required />
              </div>
              <div className="teacher-form-group">
                <label>Event Poster URL (Optional)</label>
                <input type="text" name="poster" value={eventFormData.poster} onChange={handleEventInputChange} placeholder="https://example.com/poster.jpg" />
              </div>

              {/* Schedule */}
              <div className="form-section-title">📅 Schedule Details</div>
              <div className="teacher-form-group">
                <label>Date *</label>
                <input type="text" name="date" value={eventFormData.date} onChange={handleEventInputChange} placeholder="e.g., 20 March 2026" required />
              </div>
              <div className="form-row">
                <div className="teacher-form-group">
                  <label>Start Time *</label>
                  <input type="text" name="startTime" value={eventFormData.startTime} onChange={handleEventInputChange} placeholder="e.g., 10:00 AM" required />
                </div>
                <div className="teacher-form-group">
                  <label>End Time</label>
                  <input type="text" name="endTime" value={eventFormData.endTime} onChange={handleEventInputChange} placeholder="e.g., 5:00 PM" />
                </div>
              </div>

              {/* Event Mode */}
              <div className="form-section-title">🌐 Event Mode</div>
              <div className="teacher-form-group">
                <label>Event Mode</label>
                <div className="radio-group">
                  <label className="radio-label">
                    <input type="radio" name="eventMode" value="offline" checked={eventFormData.eventMode === "offline"} onChange={handleEventInputChange} />
                    Offline (In-person)
                  </label>
                  <label className="radio-label">
                    <input type="radio" name="eventMode" value="online" checked={eventFormData.eventMode === "online"} onChange={handleEventInputChange} />
                    Online
                  </label>
                </div>
              </div>
              {eventFormData.eventMode === "offline" ? (
                <div className="teacher-form-group">
                  <label>Location</label>
                  <input type="text" name="location" value={eventFormData.location} onChange={handleEventInputChange} placeholder="e.g., Seminar Hall, Lab 3" />
                </div>
              ) : (
                <div className="teacher-form-group">
                  <label>Meeting Link</label>
                  <input type="text" name="meetingLink" value={eventFormData.meetingLink} onChange={handleEventInputChange} placeholder="https://meet.google.com/..." />
                </div>
              )}

              {/* Fee Details */}
              <div className="form-section-title">💰 Registration Fee</div>
              <div className="teacher-form-group">
                <label>Event Type</label>
                <div className="radio-group">
                  <label className="radio-label">
                    <input type="radio" name="eventType" value="free" checked={eventFormData.eventType === "free"} onChange={handleEventInputChange} />
                    Free Event
                  </label>
                  <label className="radio-label">
                    <input type="radio" name="eventType" value="paid" checked={eventFormData.eventType === "paid"} onChange={handleEventInputChange} />
                    Paid Event
                  </label>
                </div>
              </div>
              {eventFormData.eventType === "paid" && (
                <>
                  <div className="teacher-form-group">
                    <label>Registration Fee (₹)</label>
                    <input type="number" name="registrationFee" value={eventFormData.registrationFee} onChange={handleEventInputChange} placeholder="e.g., 100" min="0" />
                  </div>
                  <div className="teacher-form-group">
                    <label>UPI ID</label>
                    <input type="text" name="upiId" value={eventFormData.upiId} onChange={handleEventInputChange} placeholder="e.g., college@sbi" />
                  </div>
                  <div className="teacher-form-group">
                    <label>QR Code URL</label>
                    <input type="text" name="qrCode" value={eventFormData.qrCode} onChange={handleEventInputChange} placeholder="https://example.com/qrcode.jpg" />
                  </div>
                </>
              )}

              {/* Participation */}
              <div className="form-section-title">👥 Participation</div>
              <div className="teacher-form-group">
                <label>Max Participants (0 = unlimited)</label>
                <input type="number" name="maxParticipants" value={eventFormData.maxParticipants} onChange={handleEventInputChange} placeholder="e.g., 50" min="0" />
              </div>
              <div className="teacher-form-group">
                <label>Registration Deadline</label>
                <input type="text" name="registrationDeadline" value={eventFormData.registrationDeadline} onChange={handleEventInputChange} placeholder="e.g., 18 March 2026" />
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
      {renderCreateMeetingModal()}
    </div>
  );
};

export default TeacherDashboard;

