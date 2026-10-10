const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const errorHandler = require("./middleware/error");

const app = express();

app.use(helmet());
app.use(cors({ origin: process.env.CLIENT_URL }));
app.use(express.json());
app.use(morgan("dev"));

app.get("/api/health", (_, res) => res.json({ ok: true }));
app.use("/api/workers", require("./routes/worker.routes"));
app.use("/api/attendance", require("./routes/attendance.routes"));
app.use("/api/meetings", require("./routes/meeting.routes"));
app.use("/api/calendar", require("./routes/calendar.routes"));
app.use("/api/leaves", require("./routes/leave.routes"));

app.use(errorHandler);

module.exports = app;