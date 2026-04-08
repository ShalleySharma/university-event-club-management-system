import React, { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";
import "./ClubHeadDashboard.css";
import fetchMeetings from './fetchMeetings';

const apiBase = process.env.REACT_APP_API_URL || 'https://university-event-club-management-system.onrender.com';

const ClubHeadConvenerDashboard = ({ user }) => {
  const navigate = useNavigate();
  const { logout } = useContext(AuthContext);
  
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activeSection, setActiveSection] = useState("dashboard");
  
  // All state hooks - unconditional
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

  // Role check - no hooks
  if (!user || (!user.role || (user.role !== 'club_head' && user.role !== 'convener'))) {
    return (
      <div style={{padding: '20px', textAlign: 'center', color: '#666'}}>
        <h2>Access Denied</h2>
        <p>You need "club_head" or "convener" role to access this dashboard.</p>
      </div>
    );
  }

  // Fetch data on section change
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
      fetchMeetings(setMeetings, setMeetingsLoading);
    } else if (activeSection === "requests") {
      fetchRoleRequests();
    }
  }, [activeSection]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      
      const clubsResponse = await fetch(`${apiBase}/api/clubs/my-clubs`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const requestsResponse = await fetch(`${apiBase}/api/clubs/role-requests`, {
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
      const response = await fetch(`${apiBase}/api/clubs/my-clubs`, {
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

  const fetchAllEvents = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${apiBase}/api/events/club-head-events`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        console.log('ClubHead events loaded:', data.length);
        setAllEvents(data);
      } else {
        console.error('ClubHead events fetch failed:', response.status, await response.text());
      }
    } catch (err) {
      console.error("Error fetching events:", err);
    }
    setLoading(false);
  };

  const fetchMeetings = async (setMeetings, setMeetingsLoading) => {
    setMeetingsLoading(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${apiBase}/api/meetings/my-meetings`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setMeetings(data);
      } else {
        console.error('Meetings fetch failed:', response.status, response.statusText, await response.text());
      }
    } catch (err) {
      console.error("Error fetching meetings:", err);
    }
    setMeetingsLoading(false);
  };

  const fetchRoleRequests = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${apiBase}/api/clubs/role-requests`, {
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
      const response = await fetch(`${apiBase}/api/clubs/role-requests/${requestId}/review`, {
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
      const response = await fetch(`${apiBase}/api/events`, {
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
        fetchAllEvents();
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
    setSelectedClub(club._id);
    setShowClubDetails(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${apiBase}/api/clubs/${club._id}/details`, {
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

  const isValidUrl = (string) => {
    try {
      const url = new URL(string);
      return url.protocol === "http:" || url.protocol === "https:";
    } catch (_) {
      return false;
    }
  };

  const renderClubLogo = (club) => {
    const logo = club.logo;
    if (logo && isValidUrl(logo)) {
      return <img src={logo} alt={club.name} className="club-logo-img" onError={(e) => { 
        e.target.style.display = 'none'; 
        e.target.nextSibling.style.display = 'flex'; 
      }} />;
    }
    return <span className="club-logo-emoji">{getClubLogo(club.name)}</span>;
  };

  return (
    <div className="student-dashboard">
      <h1>Club Head / Convener Dashboard</h1>
      <p>Dashboard functionality to be completed.</p>
    </div>
  );
};

export default ClubHeadConvenerDashboard;
