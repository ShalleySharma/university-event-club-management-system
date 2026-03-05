import { useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";

const AuthSuccess = () => {
  const navigate = useNavigate();
  const { login } = useContext(AuthContext);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get("token");
    const role = urlParams.get("role");

    if (token && role) {
      login(token, role);
      
      // Redirect based on role after Microsoft OAuth
      switch (role) {
        case "admin":
          navigate("/dashboard");
          break;
        case "teacher":
          navigate("/dashboard");
          break;
        case "coordinator":
          navigate("/dashboard");
          break;
        case "club_head":
          navigate("/dashboard");
          break;
        case "student":
        default:
          navigate("/dashboard");
          break;
      }
    } else {
      navigate("/");
    }
  }, [login, navigate]);

  return (
    <div style={{ 
      display: "flex", 
      justifyContent: "center", 
      alignItems: "center", 
      height: "100vh",
      background: "linear-gradient(135deg, #0A192F 0%, #1a365d 50%, #0f172a 100%)"
    }}>
      <div style={{ textAlign: "center", color: "white" }}>
        <h1 style={{ fontSize: "24px", marginBottom: "20px" }}>🎓 Campus Connect</h1>
        <p style={{ fontSize: "18px" }}>Processing your login...</p>
        <div style={{ marginTop: "20px" }}>
          <div style={{ 
            width: "40px", 
            height: "40px", 
            border: "4px solid rgba(255,255,255,0.3)",
            borderTop: "4px solid white",
            borderRadius: "50%",
            animation: "spin 1s linear infinite",
            margin: "0 auto"
          }}></div>
        </div>
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    </div>
  );
};

export default AuthSuccess;
