const router = require("express").Router();
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const passport = require("passport");
const bcrypt = require("bcryptjs");

// Initiate Microsoft OAuth login
router.get("/microsoft", passport.authenticate("microsoft", { scope: ["user.read"] }));

// Email/Password login - SIMPLIFIED VERSION
router.post("/login", async (req, res) => {
    console.log("Login request received:", req.body);
    
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ message: "Email and password are required" });
    }

    try {
        // Find or create user
        let user = await User.findOne({ email: email.toLowerCase() });
        
        if (!user) {
            // Create new user
            user = await User.create({
                email: email.toLowerCase(),
                name: email.split("@")[0],
                password: await bcrypt.hash(password, 10),
                role: "student",
                provider: "manual"
            });
            console.log("Created new user:", user.email);
        } else {
            // Check password
            if (user.password) {
                const isValid = await bcrypt.compare(password, user.password);
                if (!isValid) {
                    return res.status(400).json({ message: "Invalid credentials" });
                }
            } else {
                // Set password for user who logged in via Microsoft before
                user.password = await bcrypt.hash(password, 10);
                user.provider = "manual";
                await user.save();
            }
        }

        // Generate token
        const token = jwt.sign(
            { id: user._id, role: user.role },
            process.env.JWT_SECRET || "your-secret-key",
            { expiresIn: "1d" }
        );

        res.json({
            token,
            user: {
                id: user._id,
                email: user.email,
                name: user.name,
                role: user.role
            }
        });
    } catch (error) {
        console.error("Login error:", error);
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
