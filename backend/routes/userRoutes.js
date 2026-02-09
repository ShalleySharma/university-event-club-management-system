const router = require("express").Router();
const { isAuthenticated } = require("../middleware/authMiddleware");

router.get("/me", isAuthenticated, (req, res) => {
  res.json(req.user);
});

module.exports = router;
