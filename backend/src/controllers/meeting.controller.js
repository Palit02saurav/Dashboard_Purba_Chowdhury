const { Meeting } = require("../models");

exports.createMeeting = async (req, res, next) => {
  try {
    const { personName, date, time, subject, remarks } = req.body;

    if (!personName?.trim() || !subject?.trim()) {
      return res.status(400).json({ message: "Person name and subject are required" });
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date || "")) {
      return res.status(400).json({ message: "A valid date is required" });
    }
    if (!/^\d{2}:\d{2}(:\d{2})?$/.test(time || "")) {
      return res.status(400).json({ message: "A valid time is required" });
    }

    const meeting = await Meeting.create({
      personName: personName.trim(),
      date,
      time,
      subject: subject.trim(),
      remarks: remarks?.trim() || null,
    });
    res.status(201).json(meeting);
  } catch (err) {
    next(err);
  }
};

exports.getMeetings = async (req, res, next) => {
  try {
    const { date } = req.query;
    if (date && !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return res.status(400).json({ message: "Invalid date" });
    }
    const where = date ? { date } : {};

    const meetings = await Meeting.findAll({
      where,
      order: [
        ["date", "ASC"],
        ["time", "ASC"],
      ],
    });
    res.json(meetings);
  } catch (err) {
    next(err);
  }
};

exports.deleteMeeting = async (req, res, next) => {
  try {
    const deleted = await Meeting.destroy({ where: { id: req.params.id } });
    if (!deleted) return res.status(404).json({ message: "Meeting not found" });
    res.json({ message: "Meeting deleted" });
  } catch (err) {
    next(err);
  }
};