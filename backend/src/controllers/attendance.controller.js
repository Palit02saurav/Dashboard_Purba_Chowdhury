const { Op } = require("sequelize");
const { Worker, Attendance, Leave } = require("../models");
const { dayStatus } = require("../utils/attendance");
// local date as YYYY-MM-DD (avoids the UTC off-by-one-day problem)
const today = () => new Date().toLocaleDateString("en-CA");

const pad = (n) => String(n).padStart(2, "0");
const toStr = (d) =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

// Mon..Sat dates for the week containing dateStr (Sunday shows the week just ended)
const weekDays = (dateStr) => {
  const [y, m, d] = dateStr.split("-").map(Number);
  const base = new Date(y, m - 1, d);
  const dow = base.getDay(); // 0 = Sun
  const diff = dow === 0 ? -6 : 1 - dow;
  const days = [];
  for (let i = 0; i < 6; i++) {
    days.push(toStr(new Date(y, m - 1, d + diff + i)));
  }
  return days;
};

// every date (YYYY-MM-DD) of the month containing dateStr
const monthDays = (dateStr) => {
  const [y, m] = dateStr.split("-").map(Number);
  const last = new Date(y, m, 0).getDate();
  const days = [];
  for (let i = 1; i <= last; i++) days.push(`${y}-${pad(m)}-${pad(i)}`);
  return days;
};

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

    // ---- weekly summary (Mon–Sat) ----
    const week = weekDays(date);
    const weekStart = week[0];
    const weekEnd = week[week.length - 1];

    const weekRecords = await Attendance.findAll({
      where: { date: { [Op.between]: [weekStart, weekEnd] } },
      raw: true,
    });
    const weekLeaves = await Leave.findAll({
      where: { fromDate: { [Op.lte]: weekEnd }, toDate: { [Op.gte]: weekStart } },
      raw: true,
    });

    // ---- monthly summary ----
    const month = monthDays(date);
    const monthStart = month[0];
    const monthEnd = month[month.length - 1];

    const monthRecords = await Attendance.findAll({
      where: { date: { [Op.between]: [monthStart, monthEnd] } },
      raw: true,
    });
    const monthLeaves = await Leave.findAll({
      where: { fromDate: { [Op.lte]: monthEnd }, toDate: { [Op.gte]: monthStart } },
      raw: true,
    });

    const result = workers.map((w) => {
      const wage = Number(w.dailyWage) || 0;
      let units = 0;
      let presentDays = 0;
      let halfDays = 0;
      let leaveDays = 0;

      const weekStatus = week.map((day) => {
        const onLeave = weekLeaves.some(
          (l) => l.WorkerId === w.id && l.fromDate <= day && l.toDate >= day
        );
        const rec = weekRecords.find((r) => r.WorkerId === w.id && r.date === day);
        const status = dayStatus({
          date: day,
          joiningDate: w.joiningDate,
          upTo: date,
          onLeave,
          saved: rec ? rec.status : null,
        });
        if (status === "leave") leaveDays++;
        if (status === "present") { presentDays++; units += 1; }
        if (status === "half-day") { halfDays++; units += 0.5; }
        return { date: day, status };
      });

      // month so far (up to selected date) and projected full month
      let monthUnits = 0;
      let monthProjectedUnits = 0;
      let monthPresentDays = 0;
      month.forEach((day) => {
        const onLeave = monthLeaves.some(
          (l) => l.WorkerId === w.id && l.fromDate <= day && l.toDate >= day
        );
        const rec = monthRecords.find((r) => r.WorkerId === w.id && r.date === day);
        const saved = rec ? rec.status : null;

        const earned = dayStatus({ date: day, joiningDate: w.joiningDate, upTo: date, onLeave, saved });
        if (earned === "present") { monthUnits += 1; monthPresentDays += 1; }
        if (earned === "half-day") { monthUnits += 0.5; monthPresentDays += 0.5; }

        const full = dayStatus({ date: day, joiningDate: w.joiningDate, upTo: monthEnd, onLeave, saved });
        if (full === "present") monthProjectedUnits += 1;
        if (full === "half-day") monthProjectedUnits += 0.5;
      });

      return {
        ...w,
        status: dayStatus({
          date,
          joiningDate: w.joiningDate,
          upTo: date,
          onLeave: leaveOf.has(w.id),
          saved: map.get(w.id) || null,
        }),
        onLeave: leaveOf.has(w.id),
        leaveReason: leaveOf.get(w.id) || null,
        week: weekStatus,
        presentDays,
        halfDays,
        leaveDays,
        weeklyWage: units * wage,
        monthPresentDays,
        monthWage: monthUnits * wage,
        monthProjectedWage: monthProjectedUnits * wage,
      };
    });

    res.json({ date, weekStart, weekEnd, workers: result });
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