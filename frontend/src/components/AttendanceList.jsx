"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";

const options = [
  { value: "present", label: "Present", on: "bg-brand border-brand text-white" },
  { value: "half-day", label: "Half Day", on: "bg-amber-500 border-amber-500 text-white" },
  { value: "absent", label: "Absent", on: "bg-red-600 border-red-600 text-white" },
];

const dayNames = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const chip = {
  present: "bg-green-100 text-green-700",
  "half-day": "bg-amber-100 text-amber-700",
  absent: "bg-red-100 text-red-700",
  leave: "bg-blue-100 text-blue-700",
  none: "bg-gray-100 text-gray-400",
};
const chipLabel = { present: "P", "half-day": "½", absent: "A", leave: "Leave", none: "–" };

export default function AttendanceList() {
  const [workers, setWorkers] = useState([]);
  const [date, setDate] = useState("");
  const [range, setRange] = useState({ start: "", end: "" });

  const load = async () => {
    const data = await api.getAttendance();
    setWorkers(data.workers);
    setDate(data.date);
    setRange({ start: data.weekStart, end: data.weekEnd });
  };
  useEffect(() => { load(); }, []);

  const mark = async (workerId, status) => {
    // optimistic update
    setWorkers((prev) => prev.map((w) => (w.id === workerId ? { ...w, status } : w)));
    try {
      await api.markAttendance({ workerId, status, date });
      load(); // refresh weekly totals and wage
    } catch {
      load(); // revert on failure
    }
  };

  const present = workers.filter((w) => w.status === "present").length;

  return (
    <div className="rounded-2xl border border-line bg-white p-6 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="font-semibold">Today&apos;s Workers ({date})</h2>
          <p className="text-sm text-gray-500">
            Week: {range.start} to {range.end} (Mon–Sat)
          </p>
        </div>
        <span className="text-sm text-gray-500">{present}/{workers.length} present</span>
      </div>

      <div className="divide-y">
        {workers.map((w) => (
          <div key={w.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
            <div>
              <p className="font-medium">
                {w.name}
                {w.onLeave && (
                  <span
                    title={w.leaveReason || "On leave"}
                    className="ml-2 rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-600"
                  >
                    On leave
                  </span>
                )}
              </p>
              <p className="text-sm text-gray-500">{w.role}</p>
            </div>  
            <div className="flex gap-2">
              {options.map((o) => (
                <button
                  key={o.value}
                  onClick={() => mark(w.id, o.value)}
                  className={`rounded-lg border px-3 py-1.5 text-sm ${
                    w.status === o.value ? o.on : "hover:bg-gray-100"
                  }`}
                >
                  {o.label}
                </button>
              ))}
            </div>

            <div className="w-full">
              <div className="flex flex-wrap items-center gap-2">
                {w.week?.map((d, i) => (
                  <div
                    key={d.date}
                    title={d.date}
                    className={`flex w-14 flex-col items-center rounded-lg px-2 py-1 text-xs ${
                      chip[d.status || "none"]
                    }`}
                  >
                    <span className="font-semibold">{dayNames[i]}</span>
                    <span>{chipLabel[d.status || "none"]}</span>
                  </div>
                ))}
              </div>
              <p className="mt-2 text-sm text-gray-600">
                Present {(w.presentDays || 0) + (w.halfDays || 0) * 0.5}/6 days
                {w.leaveDays > 0 && ` • ${w.leaveDays} on leave`}
                {" • "}Weekly wage:{" "}
                <span className="font-semibold">
                  ₹{(w.weeklyWage || 0).toLocaleString("en-IN")}
                </span>
                <span className="text-gray-400"> (₹{Number(w.dailyWage) || 0}/day)</span>
              </p>
            </div>
          </div>
        ))}
        {workers.length === 0 && <p className="text-gray-500">Add workers first from the Workers tab.</p>}
      </div>
    </div>
  );
}