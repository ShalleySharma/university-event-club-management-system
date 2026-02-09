import { useEffect, useState } from 'react';

const Dashboard = () => {
  const [user, setUser] = useState(null);

  useEffect(() => {
    fetch("http://localhost:5000/api/me", {
      credentials: "include"
    })
      .then(res => res.json())
      .then(data => setUser(data));
  }, []);

  const handleLogout = () => {
    fetch("http://localhost:5000/auth/logout", {
      credentials: "include"
    })
      .then(() => {
        window.location.href = '/';
      });
  };

  return (
    <div>
      <h1>Welcome to Campus Connect Dashboard</h1>
      <p>You are successfully logged in as a {user?.role} 🎉</p>
      <button onClick={handleLogout}>Logout</button>
    </div>
  );
};

export default Dashboard;
