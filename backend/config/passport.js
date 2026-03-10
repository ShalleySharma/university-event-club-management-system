
const passport = require("passport");
const MicrosoftStrategy = require("passport-microsoft").Strategy;
const User = require("../models/User");
const Club = require("../models/Club");

// Get tenant ID - use common for multi-tenant or specific tenant
const tenantId = process.env.AZURE_TENANT_ID || "common";

// Helper function to check if user is convener or co-convener of any club
const checkClubRoles = async (email) => {
  try {
    // Check if user is convener in any approved club
    const convenerClub = await Club.findOne({
      "convener.email": email.toLowerCase(),
      status: "approved"
    });
    
    if (convenerClub) {
      return { role: "club_head", clubId: convenerClub._id };
    }
    
    // Check if user is co-convener in any approved club
    const coConvenerClub = await Club.findOne({
      "coConvener.email": email.toLowerCase(),
      status: "approved"
    });
    
    if (coConvenerClub) {
      return { role: "coordinator", clubId: coConvenerClub._id };
    }
    
    return { role: null, clubId: null };
  } catch (err) {
    console.error("Error checking club roles:", err);
    return { role: null, clubId: null };
  }
};

passport.use(
  new MicrosoftStrategy(
    {
      clientID: process.env.AZURE_CLIENT_ID,
      clientSecret: process.env.MICROSOFT_CLIENT_SECRET,
      callbackURL: "http://localhost:5000/api/auth/microsoft/callback",
      tenant: tenantId,
      authorizationURL: `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/authorize`,
      tokenURL: `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`,
      scope: ["user.read", "openid", "profile", "email"]
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        console.log("Microsoft OAuth Profile:", profile);
        
        // Get email from profile
        const email = profile.emails?.[0]?.value || profile._json?.mail || profile._json?.userPrincipalName;
        
        if (!email) {
          console.error("No email found in Microsoft profile");
          return done(new Error("No email found in Microsoft account"), null);
        }

        console.log("OAuth Login attempt for:", email);

        // Only allow college email domains
        if (!email.endsWith("@krmangalam.edu.in") && !email.endsWith("@krmu.edu.in")) {
          console.log("Rejected email (not college domain):", email);
          return done(null, false, { message: "Please use your college email (@krmangalam.edu.in or @krmu.edu.in)" });
        }

        // Determine role based on email domain
        let role = "student";
        let clubRole = null;
        
        // FIRST: Check if this is the admin email (highest priority)
        if (email.toLowerCase() === "2201730018@krmu.edu.in") {
          role = "admin";
          console.log("Admin login detected:", email);
        }
        // SECOND: Check if teacher (krmangalam.edu.in)
        else if (email.endsWith("@krmangalam.edu.in")) {
          role = "teacher";
        }
        // THIRD: Check if student (krmu.edu.in) - default
        // Only check club roles for students
        else {
          // Check if user is convener or co-convener of any approved club
          clubRole = await checkClubRoles(email.toLowerCase());
          if (clubRole.role) {
            role = clubRole.role;
            console.log("User has club role:", role);
          }
        }

        // Find or create user
        let user = await User.findOne({ email: email.toLowerCase() });

        if (!user) {
          console.log("Creating new Microsoft OAuth user with role:", role);
          user = await User.create({
            name: profile.displayName || email.split("@")[0],
            email: email.toLowerCase(),
            microsoftId: profile.id,
            role: role,
            provider: "microsoft"
          });
        } else {
          // Update existing user with Microsoft info if needed
          user.microsoftId = profile.id;
          user.provider = "microsoft";
          if (!user.name && profile.displayName) {
            user.name = profile.displayName;
          }
          
          // CRITICAL: Update role based on email
          // Admin role takes priority over all other roles
          if (email.toLowerCase() === "2201730018@krmu.edu.in") {
            user.role = "admin";
            console.log("Updated existing user to admin:", user.email);
          }
          // For club roles, only update if not teacher/admin
          else if (clubRole && clubRole.role && user.role !== "teacher" && user.role !== "admin") {
            user.role = clubRole.role;
          }
          await user.save();
        }

        console.log("Microsoft OAuth successful for:", user.email, "Role:", user.role);
        return done(null, user);
      } catch (err) {
        console.error("Microsoft OAuth Error:", err);
        return done(err, null);
      }
    }
  )
);

// Serialize user to session
passport.serializeUser((user, done) => {
  console.log("Serializing user:", user.id);
  done(null, user.id);
});

// Deserialize user from session
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    if (user) {
      console.log("Deserialized user:", user.email);
    }
    done(null, user);
  } catch (err) {
    console.error("Deserialize error:", err);
    done(err, null);
  }
});
