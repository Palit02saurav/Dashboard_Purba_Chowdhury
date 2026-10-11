const ExcelJS = require("exceljs");
const { Op } = require("sequelize");
const { Worker } = require("../models");

const MAX_IMPORT_ROWS = 500;


const checkPhoto = (photo) =>
  !photo || (/^data:image\/(jpeg|png);base64,/.test(photo) && photo.length < 600000);

// reads the real value out of an Excel cell (handles rich text / formulas)
const cellValue = (v) => {
  if (v === null || v === undefined) return "";
  if (v instanceof Date) return v;
  if (typeof v === "object") {
    if (v.richText) return v.richText.map((t) => t.text).join("");
    if (v.result !== undefined) return v.result;
    if (v.text) return v.text;
  }
  return v;
};

// accepts a real Excel date, "yyyy-mm-dd" or "dd/mm/yyyy"; returns "yyyy-mm-dd" or null
const parseDate = (v) => {
  if (v === "" || v === null) return { value: null };
  let y, m, d;
  if (v instanceof Date) {
    y = v.getUTCFullYear();
    m = v.getUTCMonth() + 1;
    d = v.getUTCDate();
  } else {
    const s = String(v).trim();
    let match = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
    if (match) {
      [, y, m, d] = match;
    } else if ((match = s.match(/^(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{4})$/))) {
      [, d, m, y] = match; // day first (dd/mm/yyyy)
    } else {
      return { error: "Invalid joining date (use dd/mm/yyyy)" };
    }
  }
  y = Number(y); m = Number(m); d = Number(d);
  const check = new Date(Date.UTC(y, m - 1, d));
  if (check.getUTCFullYear() !== y || check.getUTCMonth() !== m - 1 || check.getUTCDate() !== d) {
    return { error: "Invalid joining date" };
  }
  const pad = (n) => String(n).padStart(2, "0");
  return { value: `${y}-${pad(m)}-${pad(d)}` };
};

exports.createWorker = async (req, res, next) => {
  try {
    const { name, phone, role, dailyWage, joiningDate, photo, notes } = req.body;
    if (!name) return res.status(400).json({ message: "Name is required" });

    if (phone && !/^\d{10}$/.test(phone)) {
      return res.status(400).json({ message: "Phone must be exactly 10 digits" });
    }
    if (!checkPhoto(photo)) {
      return res.status(400).json({ message: "Invalid or too large photo" });
    }

    const worker = await Worker.create({
      name,
      phone,
      role,
      dailyWage,
      joiningDate: joiningDate || null,
      photo: photo || null,
      notes: notes?.trim() || null,
    });
    res.status(201).json(worker);
  } catch (err) {
    next(err);
  }
};

exports.updateWorker = async (req, res, next) => {
  try {
    const { name, phone, role, dailyWage, joiningDate, photo, notes } = req.body;
    if (!checkPhoto(photo)) {
      return res.status(400).json({ message: "Invalid or too large photo" });
    }
    if (!name) return res.status(400).json({ message: "Name is required" });

    if (phone && !/^\d{10}$/.test(phone)) {
      return res.status(400).json({ message: "Phone must be exactly 10 digits" });
    }

    const worker = await Worker.findOne({
      where: { id: req.params.id, isActive: true },
    });
    if (!worker) return res.status(404).json({ message: "Worker not found" });

    await worker.update({
      name,
      phone,
      role,
      dailyWage,
      joiningDate: joiningDate || null,
      photo: photo || null,
      notes: notes?.trim() || null,
    });
    res.json(worker);
  } catch (err) {
    next(err);
  }
};

exports.getWorkers = async (req, res, next) => {
  try {
    const workers = await Worker.findAll({
      where: { isActive: true },
      order: [["createdAt", "DESC"]],
    });
    res.json(workers);
  } catch (err) {
    next(err);
  }
};

exports.deleteWorker = async (req, res, next) => {
  try {
    await Worker.update({ isActive: false }, { where: { id: req.params.id } }); // soft delete
    res.json({ message: "Worker removed" });
  } catch (err) {
    next(err);
  }
};

// GET /api/workers/template  -> downloads a sample .xlsx
exports.downloadTemplate = async (req, res, next) => {
  try {
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet("Workers");
    ws.columns = [
      { header: "Name", key: "name", width: 24 },
      { header: "Phone", key: "phone", width: 16 },
      { header: "Role", key: "role", width: 18 },
      { header: "Daily Wage", key: "dailyWage", width: 14 },
      { header: "Joining Date", key: "joiningDate", width: 16 },
    ];
    ws.getRow(1).font = { bold: true };
    ws.addRow({
      name: "Ramesh Kumar",
      phone: "9876543210",
      role: "Mason",
      dailyWage: 600,
      joiningDate: "10/10/2026",
    });

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader("Content-Disposition", 'attachment; filename="workers-template.xlsx"');
    await wb.xlsx.write(res);
    res.end();
  } catch (err) {
    next(err);
  }
};

// POST /api/workers/import  (multipart, field name: "file")
exports.importWorkers = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "Please choose an .xlsx file" });
    }

    const wb = new ExcelJS.Workbook();
    try {
      await wb.xlsx.load(req.file.buffer);
    } catch {
      return res.status(400).json({ message: "Could not read the file. Please use the .xlsx template." });
    }

    const ws = wb.worksheets[0];
    if (!ws) return res.status(400).json({ message: "The file has no sheet" });

    // find columns by header name (order doesn't matter)
    const col = {};
    ws.getRow(1).eachCell((cell, colNumber) => {
      const key = String(cellValue(cell.value)).toLowerCase().replace(/[^a-z]/g, "");
      col[key] = colNumber;
    });
    if (!col.name) {
      return res.status(400).json({ message: 'Missing "Name" column. Please use the template.' });
    }
    if (ws.rowCount - 1 > MAX_IMPORT_ROWS) {
      return res.status(400).json({ message: `Too many rows. Maximum is ${MAX_IMPORT_ROWS} per file.` });
    }

    const get = (row, key) => (col[key] ? cellValue(row.getCell(col[key]).value) : "");

    // phones already in the system (to skip duplicates)
    const existing = await Worker.findAll({
      where: { isActive: true, phone: { [Op.ne]: null } },
      attributes: ["phone"],
      raw: true,
    });
    const seenPhones = new Set(existing.map((w) => w.phone));

    const valid = [];
    const skipped = [];

    for (let r = 2; r <= ws.rowCount; r++) {
      const row = ws.getRow(r);
      const name = String(get(row, "name")).trim();
      let phone = String(get(row, "phone")).replace(/\D/g, "");
      const role = String(get(row, "role")).trim();
      const wageRaw = get(row, "dailywage");
      const dateRaw = get(row, "joiningdate");

      // completely empty row -> ignore silently
      if (!name && !phone && !role && wageRaw === "" && dateRaw === "") continue;

      if (!name) { skipped.push({ row: r, reason: "Name is missing" }); continue; }

      if (phone.length === 12 && phone.startsWith("91")) phone = phone.slice(2);
      if (phone && phone.length !== 10) {
        skipped.push({ row: r, reason: "Phone must be exactly 10 digits" });
        continue;
      }
      if (phone && seenPhones.has(phone)) {
        skipped.push({ row: r, reason: "Phone number already exists" });
        continue;
      }

      const dailyWage = wageRaw === "" ? 0 : Number(wageRaw);
      if (Number.isNaN(dailyWage) || dailyWage < 0) {
        skipped.push({ row: r, reason: "Daily wage must be a number" });
        continue;
      }

      const date = parseDate(dateRaw);
      if (date.error) { skipped.push({ row: r, reason: date.error }); continue; }

      if (phone) seenPhones.add(phone);
      valid.push({
        name: name.slice(0, 100),
        phone: phone || null,
        role: role.slice(0, 50) || null,
        dailyWage,
        joiningDate: date.value,
      });
    }

    if (valid.length) await Worker.bulkCreate(valid);

    res.status(201).json({ added: valid.length, skipped });
  } catch (err) {
    next(err);
  }
};