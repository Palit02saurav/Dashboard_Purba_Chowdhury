const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const Attendance = sequelize.define(
  "Attendance",
  {
    date: { type: DataTypes.DATEONLY, allowNull: false }, // YYYY-MM-DD
    status: {
      type: DataTypes.ENUM("present", "absent", "half-day"),
      allowNull: false,
    },
  },
  {
    // one record per worker per day
    indexes: [{ unique: true, fields: ["WorkerId", "date"] }],
  }
);

module.exports = Attendance;