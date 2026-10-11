
const { Sequelize } = require("sequelize");
const fs = require("fs");
const path = require("path");

const caPath = path.join(__dirname, "../../certs/ca.pem");

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    dialect: "mysql",
    logging: false,
    dialectOptions: {
      ssl: {
        ca: fs.readFileSync(caPath, "utf8"),
        rejectUnauthorized: true,
      },
    },
  }
);

module.exports = sequelize;
