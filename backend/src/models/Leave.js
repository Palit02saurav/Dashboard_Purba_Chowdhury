const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const Leave = sequelize.define("Leave", {
  WorkerId: { type: DataTypes.INTEGER, allowNull: false },
  fromDate: { type: DataTypes.DATEONLY, allowNull: false },
  toDate: { type: DataTypes.DATEONLY, allowNull: false },
  reason: { type: DataTypes.STRING(255) },
}, { tableName: "leaves" });

module.exports = Leave;