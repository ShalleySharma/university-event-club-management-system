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
      
      // Fetch stats - using correct endpoint /api/stats
      const statsRes = await fetch("http://localhost:5000/api/stats", {
        headers: { Authorization: `Bearer ${token}` }
      });
      const statsData = statsRes.ok ? await statsRes.json() : { userStats: [], clubStats: [], pendingRoleRequests: 0 };

      // Fetch clubs
      const clubsRes = await fetch("http://localhost:5000/api/clubs", {
        headers: { Authorization: `Bearer ${token}` }
      });
      const clubsData = clubsRes.ok ? await clubsRes.json() : [];

      // Skip /api/users call - dashboard stats don't need it
      // const usersRes = await fetch("http://localhost:5000/api/users", {
      //   headers: { Authorization: `Bearer ${token}` }
      // });
      // const usersData = usersRes.ok ? await usersRes.json() : []; 

      // Fetch role requests - using correct endpoint /api/role-requests
      const requestsRes = await fetch("http://localhost:5000/api/role-requests", {
        headers: { Authorization: `Bearer ${token}` }
      });
      const requestsData = requestsRes.ok ? await requestsRes.json() : [];

      // Calculate stats from userStats array
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
      const response = await fetch("http://localhost:5000/api/clubs", {
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
      const response = await fetch("http://localhost:5000/api/users", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        const filteredData = data.filter((u) => u.role === role);
        setAllUsers(filteredData);
        console.log(`Loaded ${filteredData.length} ${role}s (filtered from ${data.length}) ✅`);
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
      // Fetch all events for admin
      const response = await fetch("http://localhost:5000/api/events/admin/all", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setAllEvents(data);
      }
      
      // Fetch pending events
      const pendingResponse = await fetch("http://localhost:5000/api/events/admin/pending", {
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
      const response = await fetch(`http://localhost:5000/api/events/admin/${eventId}/approve`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status })
      });
      
      if (response.ok) {
        setSuccess(`Event ${status} successfully!`);
        fetchAllEvents(); // Refresh events list
        fetchDashboardData(); // Update dashboard stats
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
      const response = await fetch(`http://localhost:5000/api/clubs/${clubId}/approve`, {
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
      const response = await fetch(`http://localhost:5000/api/clubs/${clubId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.ok) {
        setSuccess("Club deleted successfully!");
        fetchDashboardData();
        setTimeout(() => setSuccess(""), 3000);
      } else {
        setError("Failed to delete club");
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
      const response = await fetch(`http://localhost:5000/api/users/${userId}`, {
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
      const response = await fetch(`http://localhost:5000/api/role-requests/${requestId}`, {
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

  // ==================== RENDER SECTIONS ====================
  const renderDashboard = () => (
    <>
      <section className="admin-welcome-section">
        <div className="admin-welcome-content">
          <div className="admin-welcome-text">
            <h2>Welcome back, {user?.name || 'Admin'}!</h2>
            <p>Here's what's happening in your campus today.</p>
          </div>
        </div>
      </section>

      {/* Stats Cards */}
      <section className="admin-stats-grid">
        <div className="admin-stat-card">
          <div className="admin-stat-icon" style={{ background: 'linear-gradient(135deg, #667eea, #764ba2)' }}>👥</div>
          <div className="admin-stat-info">
            <h3>{dashboardStats.totalUsers}</h3>
            <p>Total Users</p>
          </div>
        </div>
        <div className="admin-stat-card">
          <div className="admin-stat-icon" style={{ background: 'linear-gradient(135deg, #f093fb, #f5576c)' }}>🏛</div>
          <div className="admin-stat-info">
            <h3>{dashboardStats.totalClubs}</h3>
            <p>Total Clubs</p>
          </div>
        </div>
        <div className="admin-stat-card">
          <div className="admin-stat-icon" style={{ background: 'linear-gradient(135deg, #4facfe, #00f2fe)' }}>⏳</div>
          <div className="admin-stat-info">
            <h3>{dashboardStats.pendingClubs}</h3>
            <p>Pending Clubs</p>
          </div>
        </div>
        <div className="admin-stat-card">
          <div className="admin-stat-icon" style={{ background: 'linear-gradient(135deg, #43e97b, #38f9d7)' }}>✅</div>
          <div className="admin-stat-info">
            <h3>{dashboardStats.activeClubs}</h3>
            <p>Active Clubs</p>
          </div>
        </div>
        <div className="admin-stat-card">
          <div className="admin-stat-icon" style={{ background: 'linear-gradient(135deg, #fa709a, #fee140)' }}>📝</div>
          <div className="admin-stat-info">
            <h3>{dashboardStats.roleRequests}</h3>
            <p>Role Requests</p>
          </div>
        </div>
      </section>

      {/* Pending Approvals */}
      {pendingClubs.length > 0 && (
        <section className="admin-pending-section">
          <div className="admin-section-header">
            <h3>Pending Club Approvals</h3>
          </div>
          <div className="admin-pending-grid">
            {pendingClubs.map(club => (
              <div key={club._id} className="admin-pending-card">
                <div className="admin-pending-info">
                  <h4>{club.name}</h4>
                  <p>{club.description}</p>
                  <span className="admin-status-badge pending">Pending</span>
                </div>
                <div className="admin-pending-actions">
                  <button className="admin-btn-approve" onClick={() => handleApproveClub(club._id, "approved")}>
                    Approve
                  </button>
                  <button className="admin-btn-reject" onClick={() => handleApproveClub(club._id, "rejected")}>
                    Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Role Requests */}
      {roleRequests.length > 0 && (
        <section className="admin-requests-section">
          <div className="admin-section-header">
            <h3>Pending Role Requests</h3>
          </div>
          <div className="admin-requests-grid">
            {roleRequests.slice(0, 5).map(request => (
              <div key={request._id} className="admin-request-card">
                <div className="admin-request-info">
                  <h4>{request.userId?.name || "Unknown"}</h4>
                  <p>{request.userId?.email}</p>
                  <span className="admin-role-badge">{request.requestedRole}</span>
                </div>
                <div className="admin-request-actions">
                  <button className="admin-btn-approve" onClick={() => handleRoleRequest(request._id, "approved")}>
                    Approve
                  </button>
                  <button className="admin-btn-reject" onClick={() => handleRoleRequest(request._id, "rejected")}>
                    Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </>
  );

  const renderClubs = () => (
    <section className="admin-clubs-section">
      <div className="admin-section-header">
        <h3>All Clubs</h3>
        <span className="admin-count">{allClubs.length} clubs</span>
      </div>

      {success && <div className="admin-success-message">{success}</div>}
      {error && <div className="admin-error-message">{error}</div>}

      {loading ? (
        <div className="admin-loading">Loading clubs...</div>
      ) : allClubs.length > 0 ? (
        <div className="admin-clubs-grid">
          {allClubs.map(club => (
            <div key={club._id} className="admin-club-card">
              <div className="admin-club-logo">
                {club.logo ? <img src={club.logo} alt={club.name} /> : <span>🏛</span>}
              </div>
              <div className="admin-club-info">
                <h4>{club.name}</h4>
                <p className="admin-club-description">{club.description}</p>
                <div className="admin-club-stats">
                  <span>{club.members?.length || 0} Members</span>
                </div>
                <span className={`admin-status-badge ${club.status}`}>{club.status}</span>
              </div>
              <div className="admin-club-actions">
                <button className="admin-btn-view" onClick={() => handleViewClub(club)}>View</button>
                {club.status === "pending" && (
                  <>
                    <button className="admin-btn-approve" onClick={() => handleApproveClub(club._id, "approved")}>Approve</button>
                    <button className="admin-btn-reject" onClick={() => handleApproveClub(club._id, "rejected")}>Reject</button>
                  </>
                )}
                <button className="admin-btn-delete" onClick={() => handleDeleteClub(club._id)}>Delete</button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="admin-empty-state">
          <p>No clubs found.</p>
        </div>
      )}
    </section>
  );

  const renderUsers = (userRole) => (
    <section className="admin-users-section">
      <div className="admin-section-header">
        <h3>{userRole === "student" ? "Students" : "Teachers"}</h3>
        <span className="admin-count">{allUsers.length} {userRole}s</span>
      </div>

      {success && <div className="admin-success-message">{success}</div>}
      {error && <div className="admin-error-message">{error}</div>}

      {loading ? (
        <div className="admin-loading">Loading users...</div>
      ) : allUsers.length > 0 ? (
        <div className="admin-users-table-container">
          <table className="admin-users-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {allUsers.map(u => (
                <tr key={u._id}>
                  <td><strong>{u.name}</strong></td>
                  <td>{u.email}</td>
                  <td><span className="admin-role-badge">{u.role}</span></td>
                  <td>
                    <button className="admin-btn-delete" onClick={() => handleDeleteUser(u._id)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="admin-empty-state">
          <p>No {userRole}s found.</p>
        </div>
      )}
    </section>
  );

  const renderEvents = () => (
    <section className="admin-events-section">
      {/* Pending Events Section */}
      {pendingEvents.length > 0 && (
        <div className="admin-pending-section">
          <div className="admin-section-header">
            <h3>⏳ Pending Event Approvals</h3>
            <span className="admin-count">{pendingEvents.length} pending</span>
          </div>
          <div className="admin-pending-grid">
            {pendingEvents.map(event => (
              <div key={event._id} className="admin-pending-card">
                <div className="admin-pending-info">
                  <h4>{event.eventName}</h4>
                  <p><strong>Club:</strong> {event.clubName}</p>
                  <p><strong>Date:</strong> {event.date}</p>
                  <p><strong>Time:</strong> {event.startTime}</p>
                  <p><strong>Teacher:</strong> {event.teacherName}</p>
                  <span className="admin-status-badge pending">{event.approvalStatus}</span>
                </div>
                <div className="admin-pending-actions">
                  <button className="admin-btn-approve" onClick={() => handleApproveEvent(event._id, "approved")}>
                    Approve
                  </button>
                  <button className="admin-btn-reject" onClick={() => handleApproveEvent(event._id, "rejected")}>
                    Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* All Events Section */}
      <div className="admin-section-header" style={{ marginTop: '20px' }}>
        <h3>📅 All Events</h3>
        <span className="admin-count">{allEvents.length} events</span>
      </div>

      {success && <div className="admin-success-message">{success}</div>}
      {error && <div className="admin-error-message">{error}</div>}

      {loading ? (
        <div className="admin-loading">Loading events...</div>
      ) : allEvents.length > 0 ? (
        <div className="admin-clubs-grid">
          {allEvents.map(event => (
            <div key={event._id} className="admin-club-card">
              <div className="admin-club-logo">
                <span>📅</span>
              </div>
              <div className="admin-club-info">
                <h4>{event.eventName}</h4>
                <p className="admin-club-description">{event.description?.substring(0, 100)}...</p>
                <div className="admin-club-stats">
                  <span>🏛 {event.clubName}</span>
                  <span>📅 {event.date}</span>
                  <span>👥 {event.registrationCount || 0} registered</span>
                </div>
                <span className={`admin-status-badge ${event.approvalStatus}`}>{event.approvalStatus}</span>
              </div>
              <div className="admin-club-actions">
                {event.approvalStatus === "pending" && (
                  <>
                    <button className="admin-btn-approve" onClick={() => handleApproveEvent(event._id, "approved")}>Approve</button>
                    <button className="admin-btn-reject" onClick={() => handleApproveEvent(event._id, "rejected")}>Reject</button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="admin-empty-state">
          <p>No events found.</p>
        </div>
      )}
    </section>
  );

  const renderProfile = () => (
    <section className="admin-profile-section">
      <div className="admin-profile-header">
        <div className="admin-profile-avatar-large">
          <img src={`https://ui-avatars.com/api/?name=${user?.name || 'Admin'}&background=2563EB&color=fff&size=150`} alt="Profile" />
        </div>
        <div className="admin-profile-info">
          <h2>{user?.name || 'Admin'}</h2>
          <p>{user?.email || 'admin@college.edu'}</p>
          <span className="admin-role-badge">Admin</span>
        </div>
      </div>
      <div className="admin-profile-details">
        <div className="admin-detail-card">
          <h4>System Stats</h4>
          <p>Total Users: {dashboardStats.totalUsers}</p>
          <p>Total Clubs: {dashboardStats.totalClubs}</p>
          <p>Active Clubs: {dashboardStats.activeClubs}</p>
        </div>
      </div>
    </section>
  );

  // ==================== MODALS ====================
  const renderClubDetailsModal = () => {
    if (!showClubDetails) return null;
    return (
      <div className="admin-modal-overlay" onClick={() => setShowClubDetails(false)}>
        <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
          <div className="admin-modal-header">
            <h3>{selectedClub?.name}</h3>
            <button className="admin-modal-close" onClick={() => setShowClubDetails(false)}>×</button>
          </div>
          <div className="admin-modal-body">
            <p><strong>Description:</strong> {selectedClub?.description}</p>
            <p><strong>Category:</strong> {selectedClub?.category || "General"}</p>
            <p><strong>Status:</strong> <span className={`admin-status-badge ${selectedClub?.status}`}>{selectedClub?.status}</span></p>
            <p><strong>Members:</strong> {selectedClub?.members?.length || 0}</p>
            <p><strong>Meeting:</strong> {selectedClub?.meetingDay} at {selectedClub?.meetingTime}</p>
            <p><strong>Location:</strong> {selectedClub?.meetingLocation}</p>
          </div>
        </div>
      </div>
    );
  };

  // ==================== MAIN RENDER ====================
  return (
    <div className="admin-dashboard">
      <aside className={`admin-sidebar ${sidebarCollapsed ? 'collapsed' : ''}`}>
        <div className="admin-sidebar-header">
          <div className="admin-logo">
            <span className="admin-logo-icon">🎓</span>
            {!sidebarCollapsed && <span className="admin-logo-text">Campus Connect</span>}
          </div>
          <button className="admin-sidebar-toggle" onClick={toggleSidebar}>
            {sidebarCollapsed ? '→' : '←'}
          </button>
        </div>

        <nav className="admin-sidebar-nav">
          <ul>
            <li className={activeSection === "dashboard" ? "active" : ""} onClick={() => setActiveSection("dashboard")}>
              <span className="admin-nav-icon">📊</span>
              {!sidebarCollapsed && <span>Dashboard</span>}
            </li>
            <li className={activeSection === "clubs" ? "active" : ""} onClick={() => setActiveSection("clubs")}>
              <span className="admin-nav-icon">🏛</span>
              {!sidebarCollapsed && <span>Clubs</span>}
            </li>
            <li className={activeSection === "students" ? "active" : ""} onClick={() => setActiveSection("students")}>
              <span className="admin-nav-icon">👨‍🎓</span>
              {!sidebarCollapsed && <span>Students</span>}
            </li>
            <li className={activeSection === "teachers" ? "active" : ""} onClick={() => setActiveSection("teachers")}>
              <span className="admin-nav-icon">👩‍🏫</span>
              {!sidebarCollapsed && <span>Teachers</span>}
            </li>
            <li className={activeSection === "events" ? "active" : ""} onClick={() => setActiveSection("events")}>
              <span className="admin-nav-icon">📅</span>
              {!sidebarCollapsed && <span>Events</span>}
            </li>
            <li className={activeSection === "profile" ? "active" : ""} onClick={() => setActiveSection("profile")}>
              <span className="admin-nav-icon">👤</span>
              {!sidebarCollapsed && <span>Profile</span>}
            </li>
            <li className="logout" onClick={handleLogout}>
              <span className="admin-nav-icon">🚪</span>
              {!sidebarCollapsed && <span>Logout</span>}
            </li>
          </ul>
        </nav>
      </aside>

      <main className="admin-main-content">
        <header className="admin-top-navbar">
          <div className="admin-navbar-left">
            <h1>
              {activeSection === "dashboard" && "Admin Dashboard"}
              {activeSection === "clubs" && "Manage Clubs"}
              {activeSection === "students" && "Students"}
              {activeSection === "teachers" && "Teachers"}
              {activeSection === "events" && "Events"}
              {activeSection === "profile" && "My Profile"}
            </h1>
          </div>
          <div className="admin-navbar-right">
            <div className="admin-notification">
              <span className="admin-notification-icon">🔔</span>
              <span className="admin-notification-badge">{pendingClubs.length + roleRequests.length}</span>
            </div>
            <div className="admin-date-time">
              <span>{new Date().toLocaleDateString()}</span>
            </div>
            <div className="admin-profile-dropdown" onClick={() => setActiveSection("profile")}>
              <img src={`https://ui-avatars.com/api/?name=${user?.name || 'Admin'}&background=2563EB&color=fff`} alt="Profile" className="admin-navbar-avatar" />
            </div>
          </div>
        </header>

        <div className="admin-content-area">
          {success && <div className="admin-success-message">{success}</div>}
          {error && <div className="admin-error-message">{error}</div>}
          
          {activeSection === "dashboard" && renderDashboard()}
          {activeSection === "clubs" && renderClubs()}
          {activeSection === "students" && renderUsers("student")}
          {activeSection === "teachers" && renderUsers("teacher")}
          {activeSection === "events" && renderEvents()}
          {activeSection === "profile" && renderProfile()}
        </div>
      </main>

      {renderClubDetailsModal()}
    </div>
  );
};

export default AdminDashboard;

