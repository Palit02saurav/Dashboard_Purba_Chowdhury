const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const errorHandler = require("./middleware/error");
const requireAuth = require("./middleware/auth");

const app = express();

app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));

const allowedOrigins = (process.env.CLIENT_URL || "")
  .split(",")
  .map((s) => s.trim().replace(/\/$/, ""))
  .filter(Boolean);

app.use(
  cors({
    origin: (origin, cb) => {
      if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
      console.error("CORS blocked origin:", origin);
      return cb(new Error("Not allowed by CORS"));
    },
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],  
  })
);
app.use(express.json({ limit: "1mb" }));
app.use(morgan("dev"));

app.get("/", (_, res) => res.json({ ok: true, service: "Purba Dashboard API" }));
app.get("/api/health", (_, res) => res.json({ ok: true }));
app.use("/api/auth", require("./routes/auth.routes")); // public
app.use("/api", requireAuth); // everything below needs a valid login
app.use("/api/workers", require("./routes/worker.routes"));
app.use("/api/attendance", require("./routes/attendance.routes"));
app.use("/api/meetings", require("./routes/meeting.routes"));
app.use("/api/calendar", require("./routes/calendar.routes"));
app.use("/api/leaves", require("./routes/leave.routes"));

app.use(errorHandler);

module.exports = app;