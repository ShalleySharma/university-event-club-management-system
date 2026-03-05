import React, { useEffect, useState } from "react";

const ClubHeadDashboard = ({ user }) => {
  const [dashboardData, setDashboardData] = useState(null);
  const [clubs, setClubs] = useState([]);
  const [roleRequests, setRoleRequests] = useState([]);

  useEffect(() => {
    fetch("http://localhost:5000/api/club_head/dashboard", {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`
      }
    })
      .then(res => res.json())
      .then(data => setDashboardData(data))
      .catch(err => console.error("Error fetching dashboard:", err));

    fetch("http://localhost:5000/api/clubs", {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`
      }
    })
      .then(res => res.json())
      .then(data => setClubs(data))
      .catch(err => console.error("Error fetching clubs:", err));

    fetch("http://localhost:5000/api/clubs/role-requests", {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`
      }
    })
      .then(res => res.json())
      .then(data => setRoleRequests(data))
      .catch(err => console.error("Error fetching requests:", err));
  }, []);

  const handleReviewRequest = async (requestId, status) => {
    try {
      const response = await fetch(`http://localhost:5000/api/clubs/role-requests/${requestId}/review`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`
        },
        body: JSON.stringify({ status })
      });

      if (response.ok) {
        alert(`Request ${status} successfully!`);
        setRoleRequests(roleRequests.filter(req => req._id !== requestId));
      }
    } catch (err) {
      console.error("Error reviewing request:", err);
    }
  };

  if (!dashboardData) {
    return <div>Loading...</div>;
  }

  const myClubs = dashboardData.myClubs || [];
  const features = dashboardData.features || [];
  const recentRequests = dashboardData.recentRequests || [];
  const pendingRequests = dashboardData.pendingRequests || 0;

  return (
    <div style={{ padding: "20px" }}>
      <h1>Club Head Dashboard</h1>
      <p>Welcome, {user?.name || "Club Head"}!</p>
      <p>Role: {user?.role || "club_head"}</p>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "20px", marginTop: "30px" }}>
        <div style={{ border: "1px solid #ccc", padding: "20px", borderRadius: "8px" }}>
          <h2>My Clubs</h2>
          {myClubs.length === 0 ? (
            <p>No clubs created yet.</p>
          ) : (
            <ul>
              {myClubs.map(club => (
                <li key={club._id} style={{ marginBottom: "10px" }}>
                  <strong>{club.name}</strong>
                  <br />
                  <span style={{ color: "#666" }}>{club.description}</span>
                  <br />
                  <span style={{ fontSize: "0.9em", color: club.status === "approved" ? "green" : "orange" }}>
                    Status: {club.status}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div style={{ border: "1px solid #ccc", padding: "20px", borderRadius: "8px" }}>
          <h2>Pending Role Requests</h2>
          <p>Total: {pendingRequests}</p>
          {recentRequests.length === 0 ? (
            <p>No pending requests.</p>
          ) : (
            <ul>
              {recentRequests.map(request => (
                <li key={request._id} style={{ marginBottom: "10px" }}>
                  <strong>{request.userId?.name || "Unknown"}</strong> wants to be <strong>{request.requestedRole}</strong>
                  <br />
                  <span style={{ color: "#666" }}>Club: {request.clubId?.name || "Unknown"}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div style={{ marginTop: "30px" }}>
        <h2>Role Requests to Review</h2>
        {roleRequests.length === 0 ? (
          <p>No role requests to review.</p>
        ) : (
          <div style={{ display: "grid", gap: "10px" }}>
            {roleRequests.map(request => (
              <div key={request._id} style={{ border: "1px solid #ccc", padding: "15px", borderRadius: "8px" }}>
                <h3>{request.userId?.name || "Unknown"} ({request.userId?.email || "N/A"})</h3>
                <p>Requested Role: {request.requestedRole}</p>
                <p>Club: {request.clubId?.name || "Unknown"}</p>
                <p>Status: {request.status}</p>
                {request.status === "pending" && (
                  <div style={{ marginTop: "10px" }}>
                    <button
                      onClick={() => handleReviewRequest(request._id, "approved")}
                      style={{ marginRight: "10px", padding: "8px 16px", backgroundColor: "#28a745", color: "white", border: "none", borderRadius: "4px" }}
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => handleReviewRequest(request._id, "rejected")}
                      style={{ padding: "8px 16px", backgroundColor: "#dc3545", color: "white", border: "none", borderRadius: "4px" }}
                    >
                      Reject
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={{ marginTop: "30px" }}>
        <h2>Your Features:</h2>
        <ul>
          {features.map((feature, index) => (
            <li key={index}>{feature}</li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default ClubHeadDashboard;
