const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const User = sequelize.define(
  "User",
  {
    name: { type: DataTypes.STRING(100), allowNull: false },
    email: { type: DataTypes.STRING(150), allowNull: false, unique: true },
    phone: { type: DataTypes.STRING(20) },
    passwordHash: { type: DataTypes.STRING(100), allowNull: false },
  },
  { tableName: "users" }
);

module.exports = User;