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
  const [isConvener, setIsConvener] = useState(false);

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
          // Check if user is a convener in any club
          checkConvenerStatus(token, data.email);
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

  // Check if user is a convener in any approved club
  const checkConvenerStatus = (token, email) => {
    if (!email) return;
    
    fetch("http://localhost:5000/api/clubs/check-convener", {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
    .then(res => {
      if (!res.ok) {
        // If endpoint doesn't exist or returns error, just set to false
        setIsConvener(false);
        return { isConvener: false };
      }
      return res.json();
    })
    .then(data => {
      setIsConvener(data?.isConvener || false);
    })
    .catch(err => {
      console.error("Error checking convener status:", err);
      setIsConvener(false);
    });
  };

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
    // Check if user is a club head by role OR by being a convener in a club
    // Priority: club_head role > convener status > student > other roles
    if (user.role === "club_head" || isConvener) {
      return <ClubHeadDashboard user={user} />;
    }
    
    // Check if student is also a coordinator
    if (user.role === "coordinator") {
      return <CoordinatorDashboard user={user} />;
    }
    
    // Regular student
    if (user.role === "student") {
      return <StudentDashboard user={user} />;
    }
    
    // Admin and Teacher
    switch (user.role) {
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
