const sequelize = require("../config/db");
const Worker = require("./Worker");
const Attendance = require("./Attendance");
const Meeting = require("./Meeting");
const Leave = require("./Leave");


Worker.hasMany(Attendance, { foreignKey: "WorkerId" });
Attendance.belongsTo(Worker, { foreignKey: "WorkerId" });

Worker.hasMany(Leave, { foreignKey: "WorkerId" });
Leave.belongsTo(Worker, { foreignKey: "WorkerId" });

module.exports = { sequelize, Worker, Attendance, Meeting, Leave };