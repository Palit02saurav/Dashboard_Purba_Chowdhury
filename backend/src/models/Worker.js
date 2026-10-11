const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const Worker = sequelize.define("Worker", {
  name: { type: DataTypes.STRING(100), allowNull: false },
  phone: { type: DataTypes.STRING(20) },
  role: { type: DataTypes.STRING(50) },
  dailyWage: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
  joiningDate: { type: DataTypes.DATEONLY },
  isActive: { type: DataTypes.BOOLEAN, defaultValue: true },
}, { tableName: "workers" });



module.exports = Worker;