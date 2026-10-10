const { Op } = require("sequelize");
const { Worker, Leave } = require("../models");

const isDate = (s) => /^\d{4}-\d{2}-\d{2}$/.test(s || "");

exports.createLeave = async (req, res, next) => {
  try {
    const { workerId, fromDate, toDate, reason } = req.body;

    if (!workerId) return res.status(400).json({ message: "Please select a worker" });
    if (!isDate(fromDate) || !isDate(toDate)) {
      return res.status(400).json({ message: "Valid from and to dates are required" });
    }
    if (toDate < fromDate) {
      return res.status(400).json({ message: "End date cannot be before the start date" });
    }

    const worker = await Worker.findOne({ where: { id: workerId, isActive: true } });
    if (!worker) return res.status(404).json({ message: "Worker not found" });

    // block overlapping leave for the same worker
    const overlap = await Leave.findOne({
      where: {
        WorkerId: workerId,
        fromDate: { [Op.lte]: toDate },
        toDate: { [Op.gte]: fromDate },
      },
    });
    if (overlap) {
      return res
        .status(409)
        .json({ message: "This worker already has leave on some of these dates" });
    }

    const leave = await Leave.create({
      WorkerId: workerId,
      fromDate,
      toDate,
      reason: reason?.trim() || null,
    });
    res.status(201).json(leave);
  } catch (err) {
    next(err);
  }
};

exports.getLeaves = async (req, res, next) => {
  try {
    const leaves = await Leave.findAll({
      include: [{ model: Worker, attributes: ["id", "name"] }],
      order: [["fromDate", "DESC"]],
    });
    res.json(leaves);
  } catch (err) {
    next(err);
  }
};

exports.deleteLeave = async (req, res, next) => {
  try {
    const deleted = await Leave.destroy({ where: { id: req.params.id } });
    if (!deleted) return res.status(404).json({ message: "Leave not found" });
    res.json({ message: "Leave removed" });
  } catch (err) {
    next(err);
  }
};