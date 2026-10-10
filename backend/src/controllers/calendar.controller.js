const { Op } = require("sequelize");
const { Worker, Attendance, Meeting, Leave } = require("../models");

const pad = (n) => String(n).padStart(2, "0");

// GET /api/calendar?year=2026&month=10
exports.getMonth = async (req, res, next) => {
  try {
    const year = Number(req.query.year);
    const month = Number(req.query.month); // 1-12
    if (!Number.isInteger(year) || !Number.isInteger(month) || month < 1 || month > 12) {
      return res.status(400).json({ message: "Valid year and month are required" });
    }

    const lastDay = new Date(year, month, 0).getDate();
    const start = `${year}-${pad(month)}-01`;
    const end = `${year}-${pad(month)}-${pad(lastDay)}`;
    const range = { [Op.between]: [start, end] };

    const [workers, meetings, records, leaveRows] = await Promise.all([
      Worker.findAll({ raw: true }), // includes removed workers so old leave records keep their names
      Meeting.findAll({ where: { date: range }, order: [["time", "ASC"]], raw: true }),
      Attendance.findAll({ where: { date: range }, raw: true }),
      Leave.findAll({
        where: { fromDate: { [Op.lte]: end }, toDate: { [Op.gte]: start } },
        raw: true,
      }),
    ]);

    const nameOf = new Map(workers.map((w) => [w.id, w.name]));
    const activeWorkers = workers.filter((w) => w.isActive);

    // empty bucket for every day of the month
    const days = {};
    for (let d = 1; d <= lastDay; d++) {
      days[`${year}-${pad(month)}-${pad(d)}`] = {
        newWorkers: [],
        meetings: [],
        leaves: [],
        salaryDue: [],
      };
    }

    // new workers (by joining date)
    activeWorkers.forEach((w) => {
      if (w.joiningDate && days[w.joiningDate]) {
        days[w.joiningDate].newWorkers.push({ id: w.id, name: w.name, role: w.role });
      }
    });

    // meetings
    meetings.forEach((m) => {
      days[m.date]?.meetings.push({
        id: m.id,
        personName: m.personName,
        time: m.time,
        subject: m.subject,
        remarks: m.remarks,
      });
    });

    // planned leaves (from the Leave Manager)
    const planned = new Set();
    leaveRows.forEach((l) => {
      if (!nameOf.has(l.WorkerId)) return;
      for (let d = 1; d <= lastDay; d++) {
        const date = `${year}-${pad(month)}-${pad(d)}`;
        if (date >= l.fromDate && date <= l.toDate) {
          planned.add(`${l.WorkerId}|${date}`);
          days[date].leaves.push({
            id: l.WorkerId,
            name: nameOf.get(l.WorkerId),
            status: "leave",
            reason: l.reason,
          });
        }
      }
    });

    // leaves marked as absent / half-day on the Dashboard
    records.forEach((r) => {
      if (planned.has(`${r.WorkerId}|${r.date}`)) return; // already shown as planned leave
      if (r.status === "absent" || r.status === "half-day") {
        days[r.date]?.leaves.push({
          id: r.WorkerId,
          name: nameOf.get(r.WorkerId) || "Unknown",
          status: r.status,
        });
      }
    });

    // salary due on the last day of the month
    const salaryList = [];
    activeWorkers.forEach((w) => {
      const wage = Number(w.dailyWage) || 0;
      if (!wage) return;
      if (w.joiningDate && w.joiningDate > end) return;

      const mine = records.filter((r) => r.WorkerId === w.id);
      const presentDays = mine.filter((r) => r.status === "present").length;
      const halfDays = mine.filter((r) => r.status === "half-day").length;
      const amount = (presentDays + halfDays * 0.5) * wage;
      if (amount <= 0) return;

      salaryList.push({
        id: w.id,
        name: w.name,
        presentDays,
        halfDays,
        dailyWage: wage,
        amount,
      });
    });
    days[end].salaryDue = salaryList;

    res.json({ year, month, days });
  } catch (err) {
    next(err);
  }
};