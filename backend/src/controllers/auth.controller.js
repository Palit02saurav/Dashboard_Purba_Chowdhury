const jwt = require("jsonwebtoken");
const crypto = require("crypto");

const same = (a, b) => {
  const x = crypto.createHash("sha256").update(String(a)).digest();
  const y = crypto.createHash("sha256").update(String(b)).digest();
  return crypto.timingSafeEqual(x, y);
};

exports.login = (req, res) => {
  const { email, password } = req.body || {};

  const okEmail = same(
    (email || "").trim().toLowerCase(),
    (process.env.ADMIN_EMAIL || "").trim().toLowerCase()
  );
  const okPass = same(password || "", process.env.ADMIN_PASSWORD || "");

  if (!okEmail || !okPass) {
    return res.status(401).json({ message: "Invalid email or password" });
  }

  const user = { name: "Purba", email: process.env.ADMIN_EMAIL };
  const token = jwt.sign(user, process.env.JWT_SECRET, { expiresIn: "7d" });
  res.json({ token, user });
};