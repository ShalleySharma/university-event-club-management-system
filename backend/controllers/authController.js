exports.microsoftCallback = (req, res) => {
  // User is already authenticated via session
  res.redirect(`${process.env.FRONTEND_URL}/dashboard`);
};
