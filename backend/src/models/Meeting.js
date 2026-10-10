const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const Meeting = sequelize.define("Meeting", {
  personName: { type: DataTypes.STRING(100), allowNull: false },
  date: { type: DataTypes.DATEONLY, allowNull: false },
  time: { type: DataTypes.TIME, allowNull: false },
  subject: { type: DataTypes.STRING(200), allowNull: false },
  remarks: { type: DataTypes.TEXT },
});

module.exports = Meeting;