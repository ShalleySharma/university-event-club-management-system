const router = require("express").Router();
const passport = require("passport");
const authController = require("../controllers/authController");

router.get(
  "/microsoft",
  passport.authenticate("microsoft")
);

router.get(
  "/microsoft/callback",
  passport.authenticate("microsoft", {
    failureRedirect: "/login"
  }),
  authController.microsoftCallback
);

router.get("/logout", (req, res) => {
  req.logout(() => {
    res.redirect(process.env.FRONTEND_URL);
  });
});

module.exports = router;
