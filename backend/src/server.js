require("dotenv").config();
const app = require("./app");
const { sequelize } = require("./models");

const PORT = process.env.PORT || 5000;

(async () => {
  try {
    await sequelize.authenticate();
    await sequelize.sync(); // creates tables if they don't exist
    console.log("MySQL connected");
    app.listen(PORT, () => console.log(`API running on ${PORT}`));
  } catch (err) {
    console.error("DB connection failed:", err.message);
    process.exit(1);
  }
})();