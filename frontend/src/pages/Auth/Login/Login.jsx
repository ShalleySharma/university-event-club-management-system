const Login = () => {
  const handleMicrosoftLogin = () => {
    window.location.href = "http://localhost:5000/auth/microsoft";
  };

  return (
    <div style={{ textAlign: "center", marginTop: "100px" }}>
      <h2>Campus Connect</h2>
      <p>Login with your college Microsoft ID</p>

      <button onClick={handleMicrosoftLogin}>
        Sign in with Microsoft
      </button>
    </div>
  );
};

export default Login;
