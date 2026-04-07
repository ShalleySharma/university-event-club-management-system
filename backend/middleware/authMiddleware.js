const jwt = require("jsonwebtoken");

const isAuthenticated = (req, res, next) => {
  console.log('🔐 AUTH MIDDLEWARE - Token check start');
  const token = req.headers.authorization?.split(" ")[1] || req.cookies?.token;
  
  if (!token) {
    console.log('❌ NO TOKEN');
    return res.status(401).json({ message: "Access token required" });
  }
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "your-secret-key");
    console.log('✅ TOKEN DECODED:', { id: decoded.id || decoded._id, email: decoded.email, role: decoded.role });
    req.user = decoded;
    next();
  } catch (err) {
    console.log('❌ TOKEN ERROR:', err.message);
    return res.status(401).json({ message: "Invalid token" });
  }
};

const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ message: "Access Denied" });
    }
    next();
  };
};

module.exports = { isAuthenticated, authorizeRoles };
