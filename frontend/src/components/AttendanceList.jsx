"use client";
import { useEffect, useState } from "react";
import { CalendarDays, Check, ChevronRight, Users, X } from "lucide-react";
import { api } from "@/lib/api";

const options = [
  { value: "present", label: "Present", on: "bg-brand border-brand text-white" },
  { value: "half-day", label: "Half Day", on: "bg-amber-500 border-amber-500 text-white" },
  { value: "absent", label: "Absent", on: "bg-red-600 border-red-600 text-white" },
];

const dayNames = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const statusText = {
  present: "Present",
  "half-day": "Half Day",
  absent: "Absent",
  leave: "On leave",
};

const avatarColors = [
  "bg-brand",
  "bg-blue-500",
  "bg-amber-600",
  "bg-purple-500",
  "bg-rose-500",
  "bg-teal-600",
];

function DayIcon({ status }) {
  const base = "flex h-5 w-5 items-center justify-center rounded-full text-white";
  if (status === "present")
    return (
      <span className={`${base} bg-brand`}>
        <Check size={13} strokeWidth={3} />
      </span>
    );
  if (status === "half-day")
    return <span className={`${base} bg-amber-500 text-[11px] font-bold`}>½</span>;
  if (status === "absent")
    return (
      <span className={`${base} bg-red-600`}>
        <X size={13} strokeWidth={3} />
      </span>
    );
  if (status === "leave")
    return <span className={`${base} bg-blue-500 text-[10px] font-bold`}>L</span>;
  return <span className="flex h-5 items-center text-gray-400">–</span>;
}
function Avatar({ worker, index }) {
  if (worker.photo) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={worker.photo}
        alt={worker.name}
        className="h-[52px] w-[52px] shrink-0 rounded-full object-cover"
      />
    );
  }
  return (
    <div
      className={`flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-full text-xl font-bold text-white ${
        avatarColors[index % avatarColors.length]
      }`}
    >
      {worker.name?.charAt(0).toUpperCase()}
    </div>
  );
}

export default function AttendanceList() {
  const [workers, setWorkers] = useState([]);
  const [date, setDate] = useState("");
  const [range, setRange] = useState({ start: "", end: "" });
  const [selectedId, setSelectedId] = useState(null);

  const load = async () => {
    const data = await api.getAttendance(new Date().toLocaleDateString("en-CA")); 
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
  const selectedIndex = workers.findIndex((w) => w.id === selectedId);
  const selected = selectedIndex >= 0 ? workers[selectedIndex] : null;

  const presentCount = (w) => (w.presentDays || 0) + (w.halfDays || 0) * 0.5;

  const monthLabel = date
    ? new Date(`${date}T00:00:00`).toLocaleString("en-IN", { month: "long", year: "numeric" })
    : "";

  return (
    <div>
      {/* Header card */}
      <div className="mb-5 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-line bg-white px-6 py-5 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gray-100 text-gray-700">
            <CalendarDays size={26} />
          </div>
          <div>
            <h2 className="text-xl font-semibold">Today&apos;s Workers ({date})</h2>
            <p className="text-sm text-gray-500">
              Week: {range.start} to {range.end} (Mon–Sat)
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 text-gray-500">
          <Users size={24} />
          <span>
            <span className="text-xl font-bold text-brand">
              {present} / {workers.length}
            </span>{" "}
            present
          </span>
        </div>
      </div>

      {/* Worker cards */}
      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {workers.map((w, i) => (
          <div key={w.id} className="rounded-2xl border border-line bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <Avatar worker={w} index={i} />
              <div>
                <p className="text-lg font-semibold leading-tight">
                  {w.name}
                  {w.onLeave && (
                    <span
                      title={w.leaveReason || "On leave"}
                      className="ml-2 rounded-full bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-600"
                    >
                      On leave
                    </span>
                  )}
                </p>
                <p className="text-sm text-gray-500">{w.role}</p>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-6 gap-2">
              {dayNames.map((d, idx) => {
                const status = w.week?.[idx]?.status || null;
                return (
                  <div
                    key={d}
                    title={w.week?.[idx]?.date}
                    className="flex flex-col items-center gap-1 rounded-xl bg-gray-100 py-2 text-xs text-gray-500"
                  >
                    <span>{d}</span>
                    <DayIcon status={status} />
                  </div>
                );
              })}
            </div>

            <div className="mt-4 flex items-end justify-between gap-3">
              <div>
                <p className="font-medium">Present {presentCount(w)}/6 days</p>
                <p className="text-sm text-gray-500">
                  Weekly wage:{" "}
                  <span className="font-bold text-gray-900">₹{w.weeklyWage || 0}</span>{" "}
                  (₹{Number(w.dailyWage) || 0}/day)
                </p>
                <p className="text-sm text-gray-500">
                  {monthLabel} wage:{" "}
                  <span className="font-bold text-brand">₹{w.monthWage || 0}</span>
                </p>
              </div>
              <button
                onClick={() => setSelectedId(w.id)}
                className="flex shrink-0 items-center gap-1 rounded-lg border border-brand px-4 py-2 text-sm font-semibold text-brand hover:bg-brand-soft"
              >
                Details <ChevronRight size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {workers.length === 0 && (
        <p className="mt-4 text-gray-500">Add workers first from the Workers tab.</p>
      )}

      {/* Details popup */}
      {selected && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={() => setSelectedId(null)}
        >
          <div
            className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <Avatar worker={selected} index={selectedIndex} />
                <div>
                  <p className="text-lg font-semibold leading-tight">{selected.name}</p>
                  <p className="text-sm text-gray-500">{selected.role}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedId(null)}
                className="rounded-lg p-2 text-gray-500 hover:bg-gray-100"
                aria-label="Close"
              >
                <X size={20} />
              </button>
            </div>

            <p className="mb-2 mt-5 text-sm font-medium text-gray-600">
              Mark attendance for today ({date})
            </p>
            <div className="flex gap-2">
              {options.map((o) => (
                <button
                  key={o.value}
                  onClick={() => mark(selected.id, o.value)}
                  className={`rounded-lg border px-4 py-2 text-sm ${
                    selected.status === o.value ? o.on : "hover:bg-gray-100"
                  }`}
                >
                  {o.label}
                </button>
              ))}
            </div>

            <p className="mb-2 mt-5 text-sm font-medium text-gray-600">This week</p>
            <div className="divide-y rounded-xl border border-line">
              {selected.week?.map((d, idx) => (
                <div key={d.date} className="flex items-center justify-between px-4 py-2 text-sm">
                  <span>
                    <span className="font-medium">{dayNames[idx]}</span>{" "}
                    <span className="text-gray-500">{d.date}</span>
                  </span>
                  <span className="flex items-center gap-2">
                    <DayIcon status={d.status} />
                    <span className="w-20 text-right text-gray-600">
                      {statusText[d.status] || "Not marked"}
                    </span>
                  </span>
                </div>
              ))}
            </div>

            <p className="mt-4 text-sm text-gray-600">
              Present {presentCount(selected)}/6 days
              {selected.leaveDays > 0 && ` • ${selected.leaveDays} on leave`} • Weekly wage:{" "}
              <span className="font-bold text-gray-900">₹{selected.weeklyWage || 0}</span>{" "}
              (₹{Number(selected.dailyWage) || 0}/day)
            </p>
            <p className="mt-2 text-sm text-gray-600">
              {monthLabel}: present {selected.monthPresentDays || 0} days • earned{" "}
              <span className="font-bold text-brand">₹{selected.monthWage || 0}</span>{" "}
              (projected ₹{selected.monthProjectedWage || 0})
            </p>
          </div>
        </div>
      )}
    </div>
  );
}