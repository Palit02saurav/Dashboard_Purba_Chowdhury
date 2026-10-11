const router = require("express").Router();
const c = require("../controllers/auth.controller");

router.post("/register", (_, res) =>
  res.status(403).json({ message: "Sign up is disabled" })
);
router.post("/login", c.login);

module.exports = router;