"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { ChevronLeft, ChevronRight, X } from "lucide-react";

const pad = (n) => String(n).padStart(2, "0");
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const TYPES = [
  { key: "meetings", label: "Meetings", dot: "bg-blue-500" },
  { key: "newWorkers", label: "New workers", dot: "bg-brand" },
  { key: "leaves", label: "On leave", dot: "bg-red-500" },
  { key: "salaryDue", label: "Salary due", dot: "bg-purple-500" },
];

const formatTime = (t) => {
  if (!t) return "";
  const [h, m] = t.split(":");
  const hour = Number(h);
  return `${hour % 12 || 12}:${m} ${hour >= 12 ? "PM" : "AM"}`;
};

const money = (n) => `₹${Number(n).toLocaleString("en-IN")}`;

function Section({ title, dot, children }) {
  return (
    <div className="mb-6">
      <h3 className="mb-3 flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-gray-500">
        <span className={`h-2.5 w-2.5 rounded-full ${dot}`} />
        {title}
      </h3>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

export default function CalendarPage() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1); // 1-12
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState(null); // "YYYY-MM-DD"

  useEffect(() => {
    let cancelled = false;
    setError("");
    api
      .getCalendar(year, month)
      .then((res) => !cancelled && setData(res))
      .catch((err) => !cancelled && setError(err.message));
    return () => {
      cancelled = true;
    };
  }, [year, month]);

  // close the side panel with Esc
  useEffect(() => {
    if (!selected) return;
    const onKey = (e) => e.key === "Escape" && setSelected(null);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selected]);

  const go = (delta) => {
    let m = month + delta;
    let y = year;
    if (m < 1) { m = 12; y -= 1; }
    if (m > 12) { m = 1; y += 1; }
    setMonth(m);
    setYear(y);
    setSelected(null);
  };

  const goToday = () => {
    setYear(now.getFullYear());
    setMonth(now.getMonth() + 1);
  };

  const firstWeekday = new Date(year, month - 1, 1).getDay();
  const daysInMonth = new Date(year, month, 0).getDate();
  const todayStr = now.toLocaleDateString("en-CA");

  const dayData = selected && data?.days?.[selected];
  const salaryTotal = dayData ? dayData.salaryDue.reduce((s, w) => s + w.amount, 0) : 0;
  const isEmpty = dayData && TYPES.every((t) => dayData[t.key].length === 0);

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Calendars</h1>
          <p className="mt-1 text-gray-500">Meetings, new workers, leaves and salary at a glance.</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => go(-1)} className="rounded-xl border border-line bg-white p-2.5 hover:bg-brand-soft" aria-label="Previous month">
            <ChevronLeft size={20} />
          </button>
          <div className="min-w-44 text-center text-lg font-semibold">
            {MONTHS[month - 1]} {year}
          </div>
          <button onClick={() => go(1)} className="rounded-xl border border-line bg-white p-2.5 hover:bg-brand-soft" aria-label="Next month">
            <ChevronRight size={20} />
          </button>
          <button onClick={goToday} className="ml-2 rounded-xl border border-brand px-4 py-2 text-sm font-semibold text-brand hover:bg-brand-soft">
            Today
          </button>
        </div>
      </div>

      <div className="mb-4 flex flex-wrap gap-4 text-sm text-gray-600">
        {TYPES.map((t) => (
          <span key={t.key} className="flex items-center gap-2">
            <span className={`h-2.5 w-2.5 rounded-full ${t.dot}`} />
            {t.label}
          </span>
        ))}
      </div>

      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

      <div className="overflow-x-auto rounded-2xl border border-line bg-white shadow-sm">
        <div className="min-w-[760px]">
          <div className="grid grid-cols-7 border-b border-line bg-gray-50 text-sm font-semibold text-gray-500">
            {WEEKDAYS.map((d) => (
              <div key={d} className="px-3 py-3">{d}</div>
            ))}
          </div>

          <div className="grid grid-cols-7">
            {Array.from({ length: firstWeekday }).map((_, i) => (
              <div key={`b${i}`} className="min-h-28 border-b border-r border-line bg-gray-50/50" />
            ))}

            {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((d) => {
              const dateStr = `${year}-${pad(month)}-${pad(d)}`;
              const info = data?.days?.[dateStr];
              const isToday = dateStr === todayStr;
              const isPast = dateStr < todayStr;
              return (
                <div
                  key={d}
                  className={`flex min-h-28 flex-col justify-between border-b border-r border-line p-2 ${
                    isToday ? "bg-yellow-50" : isPast ? "bg-brand-soft/60" : ""
                  }`}
                >
                  <div>
                    <span
                      className={`flex h-7 w-7 items-center justify-center rounded-full text-sm font-semibold ${
                        isToday ? "bg-brand text-white" : ""
                      }`}
                    >
                      {d}
                    </span>
                    <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1">
                      {info &&
                        TYPES.map((t) =>
                          info[t.key].length > 0 ? (
                            <span key={t.key} className="flex items-center gap-1 text-[11px] font-medium text-gray-600">
                              <span className={`h-2 w-2 rounded-full ${t.dot}`} />
                              {info[t.key].length}
                            </span>
                          ) : null
                        )}
                    </div>
                  </div>
                  <button
                    onClick={() => setSelected(dateStr)}
                    className="mt-2 self-start rounded-md border border-line px-2 py-0.5 text-xs font-medium text-brand hover:bg-brand-soft"
                  >
                    Details
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Right-side details panel */}
      {selected && dayData && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/30" onClick={() => setSelected(null)}>
          <aside
            className="h-full w-full max-w-md overflow-y-auto bg-white p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-6 flex items-start justify-between gap-3">
              <div>
                <p className="text-sm text-gray-500">Day details</p>
                <h2 className="text-xl font-bold">
                  {new Date(`${selected}T00:00:00`).toLocaleDateString("en-IN", {
                    weekday: "long",
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </h2>
              </div>
              <button onClick={() => setSelected(null)} className="rounded-lg p-2 hover:bg-gray-100" aria-label="Close">
                <X size={20} />
              </button>
            </div>

            {isEmpty && <p className="text-gray-500">Nothing scheduled for this day.</p>}

            {dayData.meetings.length > 0 && (
              <Section title="Meetings" dot="bg-blue-500">
                {dayData.meetings.map((m) => (
                  <div key={m.id} className="rounded-xl border border-line p-3">
                    <p className="font-semibold">{m.personName}</p>
                    <p className="text-sm text-gray-600">{formatTime(m.time)} · {m.subject}</p>
                    {m.remarks && <p className="mt-1 text-sm text-gray-500">{m.remarks}</p>}
                  </div>
                ))}
              </Section>
            )}

            {dayData.newWorkers.length > 0 && (
              <Section title="New workers joined" dot="bg-brand">
                {dayData.newWorkers.map((w) => (
                  <div key={w.id} className="flex items-center justify-between rounded-xl border border-line p-3">
                    <p className="font-semibold">{w.name}</p>
                    {w.role && (
                      <span className="rounded-full bg-brand-soft px-3 py-1 text-xs font-semibold text-brand">
                        {w.role}
                      </span>
                    )}
                  </div>
                ))}
              </Section>
            )}

            {dayData.leaves.length > 0 && (
              <Section title="On leave" dot="bg-red-500">
                {dayData.leaves.map((l) => (
                  <div key={l.id} className="rounded-xl border border-line p-3">
                    <div className="flex items-center justify-between">
                      <p className="font-semibold">{l.name}</p>
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${
                          l.status === "half-day"
                            ? "bg-amber-50 text-amber-600"
                            : "bg-red-50 text-red-600"
                        }`}
                      >
                        {l.status === "absent"
                          ? "Absent"
                          : l.status === "leave"
                          ? "On leave"
                          : "Half day"}
                      </span>
                    </div>
                    {l.reason && <p className="mt-1 text-sm text-gray-500">{l.reason}</p>}
                  </div>
                ))}
              </Section>
            )}

            {dayData.salaryDue.length > 0 && (
              <Section title="Salary due" dot="bg-purple-500">
                {dayData.salaryDue.map((w) => (
                  <div key={w.id} className="rounded-xl border border-line p-3">
                    <div className="flex items-center justify-between">
                      <p className="font-semibold">{w.name}</p>
                      <p className="font-bold text-purple-600">{money(w.amount)}</p>
                    </div>
                    <p className="mt-1 text-sm text-gray-500">
                      {w.presentDays} present{w.halfDays > 0 && `, ${w.halfDays} half day`} × {money(w.dailyWage)}/day
                    </p>
                  </div>
                ))}
                <div className="flex items-center justify-between rounded-xl bg-purple-50 p-3 font-semibold">
                  <span>Total</span>
                  <span className="text-purple-700">{money(salaryTotal)}</span>
                </div>
              </Section>
            )}
          </aside>
        </div>
      )}
    </div>
  );
}