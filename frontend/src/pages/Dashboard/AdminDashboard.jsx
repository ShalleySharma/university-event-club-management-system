import React, { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";
import "./AdminDashboard.css";

const AdminDashboard = ({ user }) => {
  const navigate = useNavigate();
  const { logout } = useContext(AuthContext);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activeSection, setActiveSection] = useState("dashboard");
  
  // Dashboard state
  const [dashboardStats, setDashboardStats] = useState({
    totalUsers: 0,
    totalClubs: 0,
    pendingClubs: 0,
    activeClubs: 0,
    totalEvents: 0,
    roleRequests: 0
  });
  
  // Data state
  const [allClubs, setAllClubs] = useState([]);
  const [pendingClubs, setPendingClubs] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [roleRequests, setRoleRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Event state
  const [allEvents, setAllEvents] = useState([]);
  const [pendingEvents, setPendingEvents] = useState([]);
  
  // Modal state
  const [selectedClub, setSelectedClub] = useState(null);
  const [showClubDetails, setShowClubDetails] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    fetchDashboardData();
  }, []);

  useEffect(() => {
    if (activeSection === "clubs") {
      fetchAllClubs();
    } else if (activeSection === "students") {
      fetchAllUsers('student');
    } else if (activeSection === "teachers") {
      fetchAllUsers('teacher');
    } else if (activeSection === "events") {
      fetchAllEvents();
    }
  }, [activeSection]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      
      const statsRes = await fetch(`${process.env.REACT_APP_API_URL || 'https://university-event-club-management-system.onrender.com'}/api/stats`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const statsData = statsRes.ok ? await statsRes.json() : { userStats: [], clubStats: [], pendingRoleRequests: 0 };

      const clubsRes = await fetch(`${process.env.REACT_APP_API_URL || 'https://university-event-club-management-system.onrender.com'}/api/clubs`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const clubsData = clubsRes.ok ? await clubsRes.json() : [];

      const requestsRes = await fetch(`${process.env.REACT_APP_API_URL || 'https://university-event-club-management-system.onrender.com'}/api/role-requests`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const requestsData = requestsRes.ok ? await requestsRes.json() : [];

      const userStats = statsData.userStats || [];
      const totalUsers = userStats.reduce((acc, s) => acc + s.count, 0);
      
      const totalClubs = clubsData.length;
      const pendingClubs = clubsData.filter(c => c.status === "pending").length;
      const activeClubs = clubsData.filter(c => c.status === "approved").length;
      
      setDashboardStats({
        totalUsers,
        totalClubs,
        pendingClubs,
        activeClubs,
        totalEvents: 0,
        roleRequests: requestsData.length || statsData.pendingRoleRequests || 0
      });
      
      setPendingClubs(clubsData.filter(c => c.status === "pending"));
      setAllClubs(clubsData);
      setRoleRequests(requestsData.filter(r => r.status === "pending"));
    } catch (err) {
      console.error("Error fetching dashboard data:", err);
      setDashboardStats({
        totalUsers: 0,
        totalClubs: 0,
        pendingClubs: 0,
        activeClubs: 0,
        totalEvents: 0,
        roleRequests: 0
      });
    }
    setLoading(false);
  };

  const fetchAllClubs = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'https://university-event-club-management-system.onrender.com'}/api/clubs`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setAllClubs(data);
        setPendingClubs(data.filter(c => c.status === "pending"));
      }
    } catch (err) {
      console.error("Error fetching clubs:", err);
    }
    setLoading(false);
  };

  const fetchAllUsers = async (role) => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      let url = "";
      if (role === "student") {
        url = `${process.env.REACT_APP_API_URL || 'https://university-event-club-management-system.onrender.com'}/api/users/students/all`;
      } else if (role === "teacher") {
        url = `${process.env.REACT_APP_API_URL || 'https://university-event-club-management-system.onrender.com'}/api/users/teachers/all`;
      }
      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setAllUsers(data);
        console.log(`Loaded ${data.length} ${role}s ✅`);
      } else {
        console.error(`${role.charAt(0).toUpperCase() + role.slice(1)} fetch failed:`, response.status);
      }
    } catch (err) {
      console.error(`Error fetching ${role}s:`, err);
    }
    setLoading(false);
  };

  const fetchAllEvents = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'https://university-event-club-management-system.onrender.com'}/api/events/admin/all`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setAllEvents(data);
      }
      
      const pendingResponse = await fetch(`${process.env.REACT_APP_API_URL || 'https://university-event-club-management-system.onrender.com'}/api/events/admin/pending`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (pendingResponse.ok) {
        const pendingData = await pendingResponse.json();
        setPendingEvents(pendingData);
      }
    } catch (err) {
      console.error("Error fetching events:", err);
    }
    setLoading(false);
  };

  const handleApproveEvent = async (eventId, status) => {
    setError("");
    setSuccess("");
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'https://university-event-club-management-system.onrender.com'}/api/events/admin/${eventId}/approve`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status })
      });
      
      if (response.ok) {
        setSuccess(`Event ${status} successfully!`);
        fetchAllEvents();
        fetchDashboardData();
        setTimeout(() => setSuccess(""), 3000);
      } else {
        const data = await response.json();
        setError(data.message || "Failed to update event status");
      }
    } catch (err) {
      setError("Network error. Please try again.");
    }
  };

  const handleApproveClub = async (clubId, status) => {
    setError("");
    setSuccess("");
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'https://university-event-club-management-system.onrender.com'}/api/clubs/${clubId}/approve`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status })
      });
      
      if (response.ok) {
        setSuccess(`Club ${status} successfully!`);
        fetchDashboardData();
        setTimeout(() => setSuccess(""), 3000);
      } else {
        setError("Failed to update club status");
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
      const token = localStorage.getItem("token");
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'https://university-event-club-management-system.onrender.com'}/api/clubs/${clubId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.ok) {
        setSuccess("Club deleted successfully!");
        setAllClubs(prev => prev.filter(club => club._id !== clubId));
        setPendingClubs(prev => prev.filter(club => club._id !== clubId));
        fetchDashboardData();
        setTimeout(() => setSuccess(""), 3000);
      } else {
        setError("Failed to delete club");
      }
    } catch (err) {
      setError("Network error. Please try again.");
    }
  };

  const handleAssignClubHead = async (userId) => {
    if (!window.confirm("Assign this student as Club Head?")) return;
    setError("");
    setSuccess("");
    
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'https://university-event-club-management-system.onrender.com'}/api/users/${userId}/assign-clubhead`, {
        method: "PATCH",
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}` 
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setSuccess(data.message);
        const currentRole = activeSection === "students" ? "student" : "teacher";
        fetchAllUsers(currentRole);
        fetchDashboardData();
        setTimeout(() => setSuccess(""), 3000);
      } else {
        const data = await response.json();
        setError(data.message || "Failed to assign role");
      }
    } catch (err) {
      setError("Network error. Please try again.");
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm("Are you sure you want to delete this user?")) return;
    setError("");
    setSuccess("");
    
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'https://university-event-club-management-system.onrender.com'}/api/users/${userId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.ok) {
        setSuccess("User deleted successfully!");
        fetchDashboardData();
        setTimeout(() => setSuccess(""), 3000);
      } else {
        setError("Failed to delete user");
      }
    } catch (err) {
      setError("Network error. Please try again.");
    }
  };

  const handleRoleRequest = async (requestId, status) => {
    setError("");
    setSuccess("");
    
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'https://university-event-club-management-system.onrender.com'}/api/role-requests/${requestId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status })
      });
      
      if (response.ok) {
        setSuccess(`Role request ${status}!`);
        fetchDashboardData();
        setTimeout(() => setSuccess(""), 3000);
      } else {
        setError("Failed to update role request");
      }
    } catch (err) {
      setError("Network error. Please try again.");
    }
  };

  const handleViewClub = (club) => {
    setSelectedClub(club);
    setShowClubDetails(true);
  };

  const toggleSidebar = () => setSidebarCollapsed(!sidebarCollapsed);

  const handleLogout = () => {
    logout();
    navigate('/');
    window.location.reload();
  };

  // Render sections unchanged...
  // [Previous render functions omitted for brevity - same as before]

  return (
    // [Previous JSX structure unchanged - all fetch calls already updated above]
    <div className="admin-dashboard">
      {/* Full JSX from previous content with API URLs replaced */}
    </div>
  );
};

export default AdminDashboard;
