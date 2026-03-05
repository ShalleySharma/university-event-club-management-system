import React, { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";
import "./AdminDashboard.css";

const AdminDashboard = ({ user }) => {
  const navigate = useNavigate();
  const { logout } = useContext(AuthContext);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activeSection, setActiveSection] = useState("dashboard");
  const [dashboardData, setDashboardData] = useState(null);
  const [pendingClubs, setPendingClubs] = useState([]);
  const [allClubs, setAllClubs] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [roleRequests, setRoleRequests] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterRole, setFilterRole] = useState("all");
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem("token");
      
      // Fetch user stats
      const statsRes = await fetch("http://localhost:5000/api/admin/stats", {
        headers: { Authorization: `Bearer ${token}` }
      });
      const statsData = await statsRes.json();

      // Fetch pending clubs
      const clubsRes = await fetch("http://localhost:5000/api/clubs", {
        headers: { Authorization: `Bearer ${token}` }
      });
      const clubsData = await clubsRes.json();

      // Fetch users
      const usersRes = await fetch("http://localhost:5000/api/admin/users", {
        headers: { Authorization: `Bearer ${token}` }
      });
      const usersData = await usersRes.json();

      // Fetch role requests
      const requestsRes = await fetch("http://localhost:5000/api/admin/role-requests", {
        headers: { Authorization: `Bearer ${token}` }
      });
      const requestsData = await requestsRes.json();

      setDashboardData({ userStats: statsData.userStats || [] });
      setPendingClubs(clubsData.filter(c => c.status === "pending"));
      setAllClubs(clubsData);
      setAllUsers(usersData || []);
      setRoleRequests(requestsData.filter(r => r.status === "pending"));
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      // Use sample data if API fails
      setDashboardData({
        userStats: [
          { _id: "student", count: 450 },
          { _id: "teacher", count: 35 },
          { _id: "club_head", count: 12 }
        ],
        features: [
          "Manage all clubs and events",
          "Approve/reject club requests",
          "User management",
          "View analytics and reports"
        ]
      });
      setPendingClubs([
        { _id: 1, name: "Photography Club", description: "Capture beautiful moments", createdBy: { name: "John Doe", email: "john@campus.edu" } }
      ]);
      setAllClubs([
        { _id: 1, name: "Coding Club", description: "Programming enthusiasts", status: "approved", members: [1,2,3] },
        { _id: 2, name: "Robotics Club", description: "Build amazing robots", status: "approved", members: [1,2] }
      ]);
      setAllUsers([
        { _id: 1, name: "John Smith", email: "john@campus.edu", role: "student" },
        { _id: 2, name: "Dr. Sharma", email: "sharma@campus.edu", role: "teacher" }
      ]);
      setRoleRequests([]);
    }
  };

  const handleApproveClub = async (clubId, status) => {
    try {
      const token = localStorage.getItem("token");
      await fetch(`http://localhost:5000/api/clubs/${clubId}/status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status })
      });
      fetchDashboardData();
    } catch (error) {
      console.error("Error updating club:", error);
    }
  };

  const handleDeleteClub = async (clubId) => {
    try {
      const token = localStorage.getItem("token");
      await fetch(`http://localhost:5000/api/clubs/${clubId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchDashboardData();
    } catch (error) {
      console.error("Error deleting club:", error);
    }
  };

  const handleDeleteUser = async (userId) => {
    try {
      const token = localStorage.getItem("token");
      await fetch(`http://localhost:5000/api/admin/users/${userId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchDashboardData();
    } catch (error) {
      console.error("Error deleting user:", error);
    }
  };

  const handleRoleRequest = async (requestId, status) => {
    try {
      const token = localStorage.getItem("token");
      await fetch(`http://localhost:5000/api/admin/role-requests/${requestId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status })
      });
      fetchDashboardData();
    } catch (error) {
      console.error("Error updating role request:", error);
    }
  };

  const toggleSidebar = () => setSidebarCollapsed(!sidebarCollapsed);

  const handleLogout = () => {
    logout();
    navigate('/');
    window.location.reload();
  };

  // Filter users based on search and role
  const filteredUsers = allUsers.filter(u => {
    const matchesSearch = u.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         u.email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = filterRole === "all" || u.role === filterRole;
    return matchesSearch && matchesRole;
  });

  // Calculate stats
  const totalUsers = dashboardData?.userStats?.reduce((acc, s) => acc + s.count, 0) || 0;

  return (
    <div className="admin-dashboard">
      {/* Sidebar */}
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
              <span className="admin-nav-icon">🏠</span>
              {!sidebarCollapsed && <span>Dashboard</span>}
            </li>
            <li className={activeSection === "clubs" ? "active" : ""} onClick={() => setActiveSection("clubs")}>
              <span className="admin-nav-icon">🏛</span>
              {!sidebarCollapsed && <span>Manage Clubs</span>}
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
              {!sidebarCollapsed && <span>All Events</span>}
            </li>
            <li className={activeSection === "announcements" ? "active" : ""} onClick={() => setActiveSection("announcements")}>
              <span className="admin-nav-icon">📢</span>
              {!sidebarCollapsed && <span>Announcements</span>}
            </li>
            <li className={activeSection === "settings" ? "active" : ""} onClick={() => setActiveSection("settings")}>
              <span className="admin-nav-icon">⚙️</span>
              {!sidebarCollapsed && <span>System Settings</span>}
            </li>
            <li className="logout" onClick={handleLogout}>
              <span className="admin-nav-icon">🚪</span>
              {!sidebarCollapsed && <span>Logout</span>}
            </li>
          </ul>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="admin-main-content">
        {/* Top Navbar */}
        <header className="admin-top-navbar">
          <div className="admin-navbar-left">
            <h1>Admin Dashboard</h1>
          </div>
          <div className="admin-navbar-right">
            <div className="admin-notification">
              <span className="admin-notification-icon">🔔</span>
              <span className="admin-notification-badge">{pendingClubs.length + roleRequests.length}</span>
            </div>
            <div className="admin-date-time">
              <span>{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
            </div>
            <div className="admin-profile-dropdown">
              <img 
                src={`https://ui-avatars.com/api/?name=${user?.name || 'Admin'}&background=2563EB&color=fff`} 
                alt="Profile" 
                className="admin-navbar-avatar" 
              />
              <div className="admin-dropdown-menu">
                <div className="admin-dropdown-item">My Profile</div>
                <div className="admin-dropdown-item">Settings</div>
                <div className="admin-dropdown-item logout" onClick={handleLogout}>Logout</div>
              </div>
            </div>
          </div>
        </header>

        {/* Dashboard Content */}
        <div className="admin-dashboard-content">
          {/* Welcome Section */}
          <section className="admin-welcome-section">
            <div className="admin-welcome-content">
              <div className="admin-welcome-text">
                <h2>👋 Welcome back, {user?.name || 'Admin'}!</h2>
                <p>Here's what's happening in your campus today.</p>
              </div>
            </div>
          </section>

          {/* System Overview Cards */}
          <section className="admin-overview-section">
            <div className="admin-overview-card">
              <div className="admin-overview-icon">👨‍🎓</div>
              <div className="admin-overview-info">
                <h3>{totalUsers}</h3>
                <p>Total Users</p>
              </div>
            </div>
            <div className="admin-overview-card">
              <div className="admin-overview-icon">🏛</div>
              <div className="admin-overview-info">
                <h3>{allClubs.length}</h3>
                <p>Total Clubs</p>
              </div>
            </div>
            <div className="admin-overview-card">
              <div className="admin-overview-icon">⏳</div>
              <div className="admin-overview-info">
                <h3>{pendingClubs.length}</h3>
                <p>Pending Clubs</p>
              </div>
            </div>
            <div className="admin-overview-card">
              <div className="admin-overview-icon">📝</div>
              <div className="admin-overview-info">
                <h3>{roleRequests.length}</h3>
                <p>Role Requests</p>
              </div>
            </div>
            <div className="admin-overview-card highlight">
              <div className="admin-overview-icon">✅</div>
              <div className="admin-overview-info">
                <h3>{allClubs.filter(c => c.status === "approved").length}</h3>
                <p>Active Clubs</p>
              </div>
            </div>
          </section>

          {/* Tabs */}
          <div className="admin-dashboard-section">
            <div style={{ borderBottom: "1px solid #eee", marginBottom: "20px", display: "flex", gap: "10px" }}>
              <button 
                className={`admin-btn ${activeTab === "overview" ? "admin-btn-primary" : "admin-btn-secondary"}`}
                onClick={() => setActiveTab("overview")}
              >
                📊 Overview
              </button>
              <button 
                className={`admin-btn ${activeTab === "clubs" ? "admin-btn-primary" : "admin-btn-secondary"}`}
                onClick={() => setActiveTab("clubs")}
              >
                🏢 Club Management
              </button>
              <button 
                className={`admin-btn ${activeTab === "users" ? "admin-btn-primary" : "admin-btn-secondary"}`}
                onClick={() => setActiveTab("users")}
              >
                👥 User Management
              </button>
              <button 
                className={`admin-btn ${activeTab === "requests" ? "admin-btn-primary" : "admin-btn-secondary"}`}
                onClick={() => setActiveTab("requests")}
              >
                📝 Role Requests
              </button>
            </div>

            {/* Overview Tab */}
            {activeTab === "overview" && (
              <div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "20px" }}>
                  <div>
                    <h3 style={{ marginBottom: "15px", color: "var(--admin-primary-dark)" }}>📈 User Statistics</h3>
                    <div style={{ background: "var(--admin-light-bg)", borderRadius: "12px", padding: "20px" }}>
                      {dashboardData?.userStats?.map((stat, index) => (
                        <div key={index} style={{ 
                          display: "flex", 
                          justifyContent: "space-between", 
                          padding: "12px 0",
                          borderBottom: index < dashboardData.userStats.length - 1 ? "1px solid var(--admin-light-gray)" : "none"
                        }}>
                          <span style={{ textTransform: "capitalize", fontWeight: "500" }}>{stat._id || "Unknown"}</span>
                          <strong style={{ color: "var(--admin-primary-blue)" }}>{stat.count}</strong>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h3 style={{ marginBottom: "15px", color: "var(--admin-primary-dark)" }}>⏳ Pending Approvals</h3>
                    <div style={{ display: "grid", gap: "10px" }}>
                      <div style={{ 
                        padding: "15px", 
                        background: pendingClubs.length > 0 ? "#fff3cd" : "#d4edda",
                        borderRadius: "8px",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center"
                      }}>
                        <span>🏢 Pending Clubs</span>
                        <strong>{pendingClubs.length}</strong>
                      </div>
                      <div style={{ 
                        padding: "15px", 
                        background: roleRequests.length > 0 ? "#fff3cd" : "#d4edda",
                        borderRadius: "8px",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center"
                      }}>
                        <span>📝 Role Requests</span>
                        <strong>{roleRequests.length}</strong>
                      </div>
                    </div>
                  </div>
                </div>

                <div style={{ marginTop: "20px" }}>
                  <h3 style={{ marginBottom: "15px", color: "var(--admin-primary-dark)" }}>✨ Admin Features</h3>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "10px" }}>
                    {dashboardData?.features?.map((feature, index) => (
                      <div key={index} style={{ 
                        padding: "12px 15px", 
                        background: "var(--admin-light-bg)", 
                        borderRadius: "8px",
                        borderLeft: "3px solid var(--admin-primary-blue)"
                      }}>
                        {feature}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Clubs Tab */}
            {activeTab === "clubs" && (
              <div>
                {pendingClubs.length > 0 && (
                  <div style={{ marginBottom: "30px" }}>
                    <h3 style={{ color: "#ffc107", marginBottom: "15px" }}>⏳ Pending Approval ({pendingClubs.length})</h3>
                    <div style={{ display: "grid", gap: "15px" }}>
                      {pendingClubs.map(club => (
                        <div key={club._id} style={{ 
                          border: "2px solid #ffc107", 
                          padding: "20px", 
                          borderRadius: "12px",
                          background: "#fffbf0"
                        }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start" }}>
                            <div>
                              <h4 style={{ margin: "0 0 8px 0", color: "var(--admin-primary-dark)" }}>{club.name}</h4>
                              <p style={{ margin: "0 0 12px 0", color: "var(--admin-text-gray)" }}>{club.description}</p>
                              <div style={{ display: "flex", alignItems: "center" }}>
                                <div style={{ 
                                  width: "35px", 
                                  height: "35px", 
                                  borderRadius: "50%", 
                                  background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                                  color: "white",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  marginRight: "10px",
                                  fontWeight: "bold"
                                }}>
                                  {club.createdBy?.name?.charAt(0) || "?"}
                                </div>
                                <div>
                                  <p style={{ margin: 0, fontSize: "0.9rem" }}>
                                    <strong>{club.createdBy?.name || "Unknown"}</strong>
                                  </p>
                                  <p style={{ margin: 0, fontSize: "0.8rem", color: "var(--admin-text-gray)" }}>
                                    {club.createdBy?.email}
                                  </p>
                                </div>
                              </div>
                            </div>
                            <div style={{ display: "flex", gap: "8px" }}>
                              <button
                                className="admin-btn admin-btn-primary admin-btn-sm"
                                onClick={() => handleApproveClub(club._id, "approved")}
                              >
                                ✓ Approve
                              </button>
                              <button
                                className="admin-btn admin-btn-danger admin-btn-sm"
                                onClick={() => handleApproveClub(club._id, "rejected")}
                              >
                                ✗ Reject
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <h3 style={{ marginBottom: "15px", color: "var(--admin-primary-dark)" }}>📋 All Clubs ({allClubs.length})</h3>
                <div style={{ display: "grid", gap: "10px" }}>
                  {allClubs.map(club => (
                    <div key={club._id} style={{ 
                      border: "1px solid var(--admin-light-gray)", 
                      padding: "15px", 
                      borderRadius: "8px",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center"
                    }}>
                      <div>
                        <h4 style={{ margin: "0 0 5px 0", color: "var(--admin-primary-dark)" }}>
                          {club.name}
                          <span style={{ 
                            marginLeft: "10px", 
                            padding: "2px 8px", 
                            borderRadius: "12px",
                            fontSize: "0.75rem",
                            background: club.status === "approved" ? "#d4edda" : 
                                       club.status === "pending" ? "#fff3cd" : "#f8d7da",
                            color: club.status === "approved" ? "#155724" : 
                                   club.status === "pending" ? "#856404" : "#721c24"
                          }}>
                            {club.status}
                          </span>
                        </h4>
                        <p style={{ margin: "0", color: "var(--admin-text-gray)" }}>{club.description}</p>
                        <p style={{ margin: "5px 0 0 0", fontSize: "0.8rem", color: "var(--admin-text-gray)" }}>
                          Members: {club.members?.length || 0}
                        </p>
                      </div>
                      <button
                        className="admin-btn admin-btn-danger admin-btn-sm"
                        onClick={() => handleDeleteClub(club._id)}
                      >
                        🗑️ Delete
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Users Tab */}
            {activeTab === "users" && (
              <div>
                <h3 style={{ marginBottom: "15px", color: "var(--admin-primary-dark)" }}>👥 User Management</h3>
                <div style={{ marginBottom: "20px", display: "flex", gap: "10px" }}>
                  <input
                    type="text"
                    placeholder="🔍 Search by name or email..."
                    style={{
                      padding: "10px 16px",
                      border: "1px solid var(--admin-light-gray)",
                      borderRadius: "8px",
                      width: "300px",
                      outline: "none"
                    }}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                  <select
                    style={{
                      padding: "10px 16px",
                      border: "1px solid var(--admin-light-gray)",
                      borderRadius: "8px",
                      outline: "none",
                      cursor: "pointer"
                    }}
                    value={filterRole}
                    onChange={(e) => setFilterRole(e.target.value)}
                  >
                    <option value="all">All Roles</option>
                    <option value="student">Student</option>
                    <option value="teacher">Teacher</option>
                    <option value="club_head">Club Head</option>
                    <option value="coordinator">Coordinator</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>

                <div style={{ display: "grid", gap: "10px" }}>
                  {filteredUsers.length === 0 ? (
                    <p style={{ textAlign: "center", color: "var(--admin-text-gray)", padding: "40px" }}>No users found.</p>
                  ) : (
                    filteredUsers.map(u => (
                      <div key={u._id} style={{ 
                        border: "1px solid var(--admin-light-gray)", 
                        padding: "15px", 
                        borderRadius: "8px",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center"
                      }}>
                        <div style={{ display: "flex", alignItems: "center" }}>
                          <div className="admin-user-avatar">
                            {u.name?.charAt(0) || "?"}
                          </div>
                          <div style={{ marginLeft: "15px" }}>
                            <p style={{ margin: "0", fontWeight: "600", color: "var(--admin-primary-dark)" }}>{u.name}</p>
                            <p style={{ margin: "0", color: "var(--admin-text-gray)", fontSize: "0.9rem" }}>{u.email}</p>
                          </div>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                          <span style={{ 
                            padding: "4px 12px", 
                            borderRadius: "12px",
                            fontSize: "0.8rem",
                            background: u.role === "admin" ? "#dc3545" :
                                       u.role === "teacher" ? "#17a2b8" :
                                       u.role === "club_head" ? "#ffc107" :
                                       u.role === "coordinator" ? "#6f42c1" : "#28a745",
                            color: "white",
                            textTransform: "capitalize"
                          }}>
                            {u.role}
                          </span>
                          <button
                            className="admin-btn admin-btn-danger admin-btn-sm"
                            onClick={() => handleDeleteUser(u._id)}
                          >
                            🗑️
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* Role Requests Tab */}
            {activeTab === "requests" && (
              <div>
                <h3 style={{ marginBottom: "15px", color: "var(--admin-primary-dark)" }}>📝 Pending Role Requests</h3>
                {roleRequests.length === 0 ? (
                  <div style={{ 
                    padding: "40px", 
                    textAlign: "center", 
                    background: "#d4edda", 
                    borderRadius: "8px" 
                  }}>
                    <p style={{ margin: 0, color: "#155724" }}>✅ No pending role requests!</p>
                  </div>
                ) : (
                  <div style={{ display: "grid", gap: "15px" }}>
                    {roleRequests.map(request => (
                      <div key={request._id} style={{ 
                        border: "1px solid #ddd", 
                        padding: "15px", 
                        borderRadius: "8px",
                        background: "#fffbf0"
                      }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start" }}>
                          <div>
                            <h4 style={{ margin: "0 0 5px 0" }}>
                              <span style={{ 
                                padding: "2px 8px", 
                                borderRadius: "4px",
                                background: "#17a2b8",
                                color: "white",
                                fontSize: "0.8rem",
                                marginRight: "8px"
                              }}>
                                {request.requestedRole}
                              </span>
                            </h4>
                            <p style={{ margin: "0 0 10px 0", color: "#666" }}>
                              <strong>{request.userId?.name || "Unknown User"}</strong> ({request.userId?.email})
                            </p>
                            {request.clubId && (
                              <p style={{ margin: "0", fontSize: "0.9rem", color: "#666" }}>
                                For Club: <strong>{request.clubId.name}</strong>
                              </p>
                            )}
                            {request.description && (
                              <p style={{ margin: "10px 0 0 0", fontSize: "0.9rem" }}>
                                Note: {request.description}
                              </p>
                            )}
                          </div>
                          <div>
                            <button
                              className="admin-btn admin-btn-primary admin-btn-sm"
                              onClick={() => handleRoleRequest(request._id, "approved")}
                              style={{ marginRight: "8px" }}
                            >
                              ✓ Approve
                            </button>
                            <button
                              className="admin-btn admin-btn-danger admin-btn-sm"
                              onClick={() => handleRoleRequest(request._id, "rejected")}
                            >
                              ✗ Reject
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;
