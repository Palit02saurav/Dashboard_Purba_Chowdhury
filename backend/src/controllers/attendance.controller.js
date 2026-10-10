const { Op } = require("sequelize");
const { Worker, Attendance, Leave } = require("../models");

// local date as YYYY-MM-DD (avoids the UTC off-by-one-day problem)
const today = () => new Date().toLocaleDateString("en-CA");

exports.getByDate = async (req, res, next) => {
  try {
    const date = req.query.date || today();
    const workers = await Worker.findAll({
      where: { isActive: true },
      order: [["name", "ASC"]],
      raw: true,
    });
    const records = await Attendance.findAll({ where: { date }, raw: true });

    const leaves = await Leave.findAll({
      where: { fromDate: { [Op.lte]: date }, toDate: { [Op.gte]: date } },
      raw: true,
    });
    const leaveOf = new Map(leaves.map((l) => [l.WorkerId, l.reason]));

    const map = new Map(records.map((r) => [r.WorkerId, r.status]));
    const result = workers.map((w) => ({
      ...w,
      status: map.get(w.id) || null,
      onLeave: leaveOf.has(w.id),
      leaveReason: leaveOf.get(w.id) || null,
    }));

    res.json({ date, workers: result });
  } catch (err) {
    next(err);
  }
};

exports.mark = async (req, res, next) => {
  try {
    const { workerId, status, date } = req.body;
    if (!workerId || !["present", "absent", "half-day"].includes(status)) {
      return res.status(400).json({ message: "workerId and valid status required" });
    }
    await Attendance.upsert({
      WorkerId: workerId,
      date: date || today(),
      status,
    });
    res.json({ message: "Attendance saved" });
  } catch (err) {
    next(err);
  }
};