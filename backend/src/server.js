
require("dotenv").config();
const app = require("./app");
const { sequelize } = require("./models");

const PORT = process.env.PORT || 5000;

if (!process.env.JWT_SECRET || !process.env.ADMIN_EMAIL || !process.env.ADMIN_PASSWORD) {
  console.error("JWT_SECRET, ADMIN_EMAIL and ADMIN_PASSWORD must be set");
  process.exit(1);
}

(async () => {
  try {
    await sequelize.authenticate();
    // await User.sync(); // creates the users table if it doesn't exist yet

    console.log("MySQL connected");

    app.listen(PORT, () => {
      console.log(`API running on ${PORT}`);
    });
  } catch (err) {
    console.error("DB connection failed:", err.message);
    process.exit(1);
  }
})();
