const passport = require("passport");
const MicrosoftStrategy = require("passport-microsoft").Strategy;
const User = require("../models/User");

passport.use(
  new MicrosoftStrategy(
    {
      clientID: process.env.MICROSOFT_CLIENT_ID,
      clientSecret: process.env.MICROSOFT_CLIENT_SECRET,
      callbackURL: process.env.MICROSOFT_CALLBACK_URL,
      scope: ["user.read"]
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const email = profile.emails[0].value;

        // Only allow college email
        if (!email.endsWith("@krmangalam.edu.in") && !email.endsWith("@krmu.edu.in")) {
          return done(null, false);
        }

        let user = await User.findOne({ email });

        if (!user) {
          const role = email.endsWith("@krmangalam.edu.in")
            ? "teacher"
            : "student";

          user = await User.create({
            name: profile.displayName,
            email,
            role,
            provider: "microsoft"
          });
        }

        return done(null, user);
      } catch (err) {
        return done(err, null);
      }
    }
  )
);

passport.serializeUser((user, done) => done(null, user.id));
passport.deserializeUser(async (id, done) => {
  const user = await User.findById(id);
  done(null, user);
});
