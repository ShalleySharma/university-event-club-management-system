import React, { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../../../context/AuthContext";
import "./Login.css";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleMicrosoftLogin = () => {
    const apiUrl = process.env.REACT_APP_API_URL || 'https://university-event-club-management-system.onrender.com';
    window.location.href = `${apiUrl}/api/auth/microsoft`;
  };

  const handleEmailLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const loginData = { email, password };
    console.log("Sending login request:", loginData);

    try {
      const apiUrl = process.env.REACT_APP_API_URL || 'https://university-event-club-management-system.onrender.com';
      const response = await fetch(`${apiUrl}/api/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(loginData)
      });

      console.log("Response status:", response.status);

      const data = await response.json();
      console.log("Login response data:", data);

      if (response.ok && data.success) {
        login(data.token, data.user.role);
        navigate("/dashboard");
      } else {
        setError(data.message || "Login failed. Please try again.");
      }
    } catch (err) {
      setError("Network error. Please check if the server is running.");
      console.error("Login error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <div className="login-header">
          <h1>🎓 Campus Connect</h1>
          <p>Login with your college credentials</p>
        </div>

        {/* Microsoft Login Button */}
        <button className="microsoft-btn" onClick={handleMicrosoftLogin}>
          <svg width="21" height="21" viewBox="0 0 21 21" xmlns="http://www.w3.org/2000/svg">
            <rect x="1" y="1" width="9" height="9" fill="#f25022"/>
            <rect x="11" y="1" width="9" height="9" fill="#7fba00"/>
            <rect x="1" y="11" width="9" height="9" fill="#00a4ef"/>
            <rect x="11" y="11" width="9" height="9" fill="#ffb900"/>
          </svg>
          Sign in with Microsoft
        </button>

        <div className="divider">
          <span>or</span>
        </div>

        {/* Email/Password Login Form */}
        <form onSubmit={handleEmailLogin}>
          <div className="form-group">
            <label htmlFor="email">College Email</label>
            <input
              type="email"
              id="email"
              placeholder="your.email@krmangalam.edu.in"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
          </div>

          {error && <div className="error-message">{error}</div>}

          <button type="submit" className="login-btn" disabled={loading}>
            {loading ? "Logging in..." : "Login with Email"}
          </button>
        </form>

        <div className="login-footer">
          <p>Use your college email to login:</p>
          <p className="email-hint">@krmangalam.edu.in or @krmu.edu.in</p>
        </div>
      </div>
    </div>
  );
};

export default Login;
