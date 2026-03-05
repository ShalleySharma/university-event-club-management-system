import { useEffect, useState, useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import StudentDashboard from './StudentDashboard';
import ClubHeadDashboard from './ClubHeadDashboard';
import CoordinatorDashboard from './CoordinatorDashboard';
import AdminDashboard from './AdminDashboard';
import TeacherDashboard from './TeacherDashboard';

const Dashboard = () => {
  const { user: authUser } = useContext(AuthContext);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');

    if (!token) {
      // No token found, redirect to landing
      window.location.href = '/';
      return;
    }

    fetch("http://localhost:5000/api/me", {
      headers: {
        'Authorization': `Bearer ${token}`
      },
      credentials: "include"
    })
      .then(res => {
        if (res.status === 401) {
          // Token invalid, clear and redirect
          localStorage.removeItem('token');
          localStorage.removeItem('role');
          window.location.href = '/';
          return null;
        }
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        return res.json();
      })
      .then(data => {
        if (data) {
          setUser(data);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error("Error fetching user:", err);
        // Clear invalid tokens and redirect
        localStorage.removeItem('token');
        localStorage.removeItem('role');
        window.location.href = '/';
      });
  }, []);

  const handleLogout = async () => {
    try {
      await fetch("http://localhost:5000/auth/logout", {
        credentials: "include"
      });
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      // Always clear localStorage and redirect to landing
      localStorage.removeItem('token');
      localStorage.removeItem('role');
      window.location.href = '/';
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return <div>Please log in to access the dashboard.</div>;
  }

  const renderDashboard = () => {
    switch (user.role) {
      case "student":
        return <StudentDashboard user={user} />;
      case "club_head":
        return <ClubHeadDashboard user={user} />;
      case "coordinator":
        return <CoordinatorDashboard user={user} />;
      case "admin":
        return <AdminDashboard user={user} />;
      case "teacher":
        return <TeacherDashboard user={user} />;
      default:
        return <div>Invalid user role.</div>;
    }
  };

  return (
    <div>
      {renderDashboard()}
      <button
        onClick={handleLogout}
        style={{
          position: "fixed",
          top: "20px",
          right: "20px",
          padding: "10px 20px",
          backgroundColor: "#dc3545",
          color: "white",
          border: "none",
          borderRadius: "4px",
          cursor: "pointer"
        }}
      >
        Logout
      </button>
    </div>
  );
};

export default Dashboard;
