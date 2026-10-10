"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";

const options = [
  { value: "present", label: "Present", on: "bg-brand border-brand text-white" },
  { value: "half-day", label: "Half Day", on: "bg-amber-500 border-amber-500 text-white" },
  { value: "absent", label: "Absent", on: "bg-red-600 border-red-600 text-white" },
];

export default function AttendanceList() {
  const [workers, setWorkers] = useState([]);
  const [date, setDate] = useState("");

  const load = async () => {
    const data = await api.getAttendance();
    setWorkers(data.workers);
    setDate(data.date);
  };
  useEffect(() => { load(); }, []);

  const mark = async (workerId, status) => {
    // optimistic update
    setWorkers((prev) => prev.map((w) => (w.id === workerId ? { ...w, status } : w)));
    try {
      await api.markAttendance({ workerId, status, date });
    } catch {
      load(); // revert on failure
    }
  };

  const present = workers.filter((w) => w.status === "present").length;

  return (
    <div className="rounded-2xl border border-line bg-white p-6 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-semibold">Today&apos;s Workers ({date})</h2>
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
          </div>
        ))}
        {workers.length === 0 && <p className="text-gray-500">Add workers first from the Workers tab.</p>}
      </div>
    </div>
  );
}