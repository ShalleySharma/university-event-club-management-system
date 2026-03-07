const passport = require("passport");
const MicrosoftStrategy = require("passport-microsoft").Strategy;
const User = require("../models/User");

// Get tenant ID - use common for multi-tenant or specific tenant
const tenantId = process.env.AZURE_TENANT_ID || "common";

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
        if (email.endsWith("@krmangalam.edu.in")) {
          role = "teacher";
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
