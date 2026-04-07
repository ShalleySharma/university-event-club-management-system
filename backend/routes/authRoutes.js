const router = require("express").Router();
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const passport = require("passport");
const bcrypt = require("bcryptjs");

// ============================================
// MICROSOFT OAUTH AUTHENTICATION
// ============================================

// Initiate Microsoft OAuth login
router.get("/microsoft", passport.authenticate("microsoft", { 
  scope: ["user.read"],
  prompt: "select_account"
}));

// Microsoft OAuth callback handler
router.get("/microsoft/callback", 
  passport.authenticate("microsoft", { failureRedirect: (process.env.FRONTEND_URL || 'http://localhost:3000') + "/login?error=auth_failed" }),
  async (req, res) => {
    try {
      const user = req.user;
      
      // Generate JWT token
      const token = jwt.sign(
        { id: user._id, role: user.role },
        process.env.JWT_SECRET || "your-secret-key",
        { expiresIn: "1d" }
      );

      // Redirect to frontend with token
      res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/auth/success?token=${token}&role=${user.role}`);
    } catch (err) {
      console.error("OAuth Callback Error:", err);
      res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/login?error=auth_failed`);
    }
  }
);

// ============================================
// MANUAL EMAIL/PASSWORD LOGIN
// ============================================

// Debug endpoint to test server connectivity
router.post("/test", (req, res) => {
    console.log("Test endpoint hit:", req.body);
    res.json({ success: true, received: req.body });
});

// Email/Password login - DEBUG VERSION
router.post("/login", async (req, res) => {
    console.log("=== LOGIN REQUEST ===");
    console.log("Body:", req.body);
    
    const { email, password } = req.body;

    // Check if email and password are provided
    if (!email) {
        console.log("ERROR: No email provided");
        return res.status(400).json({ message: "Email is required" });
    }
    
    if (!password) {
        console.log("ERROR: No password provided");
        return res.status(400).json({ message: "Password is required" });
    }

    const normalizedEmail = email.toLowerCase().trim();
    console.log("Normalized email:", normalizedEmail);

    // Determine role based on email
    let role = "student";
    
    // FIRST: Check if this is the admin email (highest priority)
    if (normalizedEmail === "2201730018@krmu.edu.in") {
      role = "admin";
      console.log("Admin login detected:", normalizedEmail);
    }
    // SECOND: Check if teacher (krmangalam.edu.in)
    else if (normalizedEmail.endsWith("@krmangalam.edu.in")) {
      role = "teacher";
    }
    // THIRD: Student (krmu.edu.in) - default

    try {
        // Find user by email
        let user = await User.findOne({ email: normalizedEmail });
        console.log("User found:", user ? "Yes" : "No");
        
        if (!user) {
            // Create new user - first time login
            console.log("Creating new user with role:", role);
            
            user = await User.create({
                email: normalizedEmail,
                name: normalizedEmail.split("@")[0],
                password: await bcrypt.hash(password, 10),
                role: role,
                provider: "manual"
            });
            
            console.log("New user created with role:", role);
        } else {
            console.log("User exists. Provider:", user.provider, "Has password:", !!user.password);
            
            // Check if user has password
            if (user.password) {
                // Validate password
                const isValid = await bcrypt.compare(password, user.password);
                console.log("Password valid:", isValid);
                
                if (!isValid) {
                    return res.status(400).json({ message: "Invalid email or password" });
                }
            } else {
                // User logged in via Microsoft before - set password now
                console.log("Setting password for Microsoft user...");
                user.password = await bcrypt.hash(password, 10);
                user.provider = "manual";
                await user.save();
                console.log("Password saved successfully");
            }
            
            // CRITICAL: Update role if admin email logs in
            // Admin role takes priority over all other roles
            if (normalizedEmail === "2201730018@krmu.edu.in") {
              user.role = "admin";
              await user.save();
              console.log("Updated user to admin:", user.email);
            }
        }

        // Generate JWT token
        const token = jwt.sign(
            { id: user._id, role: user.role },
            process.env.JWT_SECRET || "your-secret-key",
            { expiresIn: "1d" }
        );

        console.log("Login SUCCESS for:", user.email, "Role:", user.role);
        
        res.json({
            success: true,
            token,
            user: {
                id: user._id,
                email: user.email,
                name: user.name,
                role: user.role
            }
        });
    } catch (error) {
        console.error("=== LOGIN ERROR ===");
        console.error("Error:", error);
        console.error("Stack:", error.stack);
        res.status(500).json({ message: error.message, error: error.toString() });
    }
});

// Register endpoint for email/password
router.post("/register", async (req, res) => {
    console.log("=== REGISTER REQUEST ===");
    console.log("Body:", req.body);
    
    const { email, password, name } = req.body;

    // Validate input
    if (!email || !password) {
        return res.status(400).json({ message: "Email and password are required" });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Validate email domain
    if (!normalizedEmail.endsWith("@krmangalam.edu.in") && !normalizedEmail.endsWith("@krmu.edu.in")) {
        return res.status(400).json({ message: "Please use your college email (@krmangalam.edu.in or @krmu.edu.in)" });
    }

    try {
        // Check if user already exists
        const existingUser = await User.findOne({ email: normalizedEmail });
        
        if (existingUser) {
            return res.status(400).json({ message: "User with this email already exists" });
        }

        // Determine role based on email domain
        let role = "student";
        
        // FIRST: Check if this is the admin email (highest priority)
        if (normalizedEmail === "2201730018@krmu.edu.in") {
          role = "admin";
          console.log("Admin registration detected:", normalizedEmail);
        }
        // SECOND: Check if teacher (krmangalam.edu.in)
        else if (normalizedEmail.endsWith("@krmangalam.edu.in")) {
          role = "teacher";
        }
        // THIRD: Student (krmu.edu.in) - default

        // Create new user
        const user = await User.create({
            email: normalizedEmail,
            name: name || normalizedEmail.split("@")[0],
            password: await bcrypt.hash(password, 10),
            role: role,
            provider: "manual"
        });

        console.log("User registered successfully:", user.email, "Role:", role);

        // Generate JWT token
        const token = jwt.sign(
            { id: user._id, role: user.role },
            process.env.JWT_SECRET || "your-secret-key",
            { expiresIn: "1d" }
        );

        res.status(201).json({
            success: true,
            message: "Registration successful",
            token,
            user: {
                id: user._id,
                email: user.email,
                name: user.name,
                role: user.role
            }
        });
    } catch (error) {
        console.error("=== REGISTER ERROR ===");
        console.error("Error:", error);
        res.status(500).json({ message: error.message });
    }
});

// Logout endpoint
router.post("/logout", (req, res) => {
    req.logout((err) => {
        if (err) {
            return res.status(500).json({ message: "Logout failed" });
        }
        res.json({ success: true, message: "Logged out successfully" });
    });
});

module.exports = router;
