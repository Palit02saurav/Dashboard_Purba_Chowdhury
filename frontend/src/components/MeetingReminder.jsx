"use client";
import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Bell, X } from "lucide-react";

const REMINDER_HOUR = 7; // alerts start at 7:00 AM (device time)
const STORAGE_KEY = "alertedMeetings";

const localDate = (d = new Date()) => d.toLocaleDateString("en-CA"); // YYYY-MM-DD

const formatTime = (t) => {
  if (!t) return "";
  const [h, m] = t.split(":");
  const hour = Number(h);
  return `${hour % 12 || 12}:${m} ${hour >= 12 ? "PM" : "AM"}`;
};

const getAlerted = () => {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  } catch {
    return [];
  }
};

const saveAlerted = (list) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list.slice(-200)));
  } catch {}
};

export default function MeetingReminder() {
  const [alerts, setAlerts] = useState([]);
  const [permission, setPermission] = useState("unsupported");
  const [hideAsk, setHideAsk] = useState(false);

  useEffect(() => {
    if (typeof Notification !== "undefined") setPermission(Notification.permission);
  }, []);

  const check = useCallback(async () => {
    const now = new Date();
    if (now.getHours() < REMINDER_HOUR) return; // too early, wait for 7 AM

    try {
      const meetings = await api.getMeetings(localDate(now));
      const alerted = getAlerted();

      const fresh = meetings.filter((m) => {
        const key = `${m.id}-${m.date}`;
        const notOver = new Date(`${m.date}T${m.time}`) > now;
        return !alerted.includes(key) && notOver;
      });
      if (fresh.length === 0) return;

      saveAlerted([...alerted, ...fresh.map((m) => `${m.id}-${m.date}`)]);
      setAlerts((prev) => [...prev, ...fresh]);

      if (typeof Notification !== "undefined" && Notification.permission === "granted") {
        fresh.forEach((m) => {
          try {
            new Notification("Meeting today", {
              body: `${m.personName} at ${formatTime(m.time)} - ${m.subject}`,
              tag: `meeting-${m.id}`,
            });
          } catch {}
        });
      }
    } catch {
      // backend not reachable, try again on the next check
    }
  }, []);

  useEffect(() => {
    check();
    const timer = setInterval(check, 60 * 1000);
    const onVisible = () => document.visibilityState === "visible" && check();
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [check]);

  const enable = async () => {
    const result = await Notification.requestPermission();
    setPermission(result);
  };

  const dismiss = (id) => setAlerts((prev) => prev.filter((m) => m.id !== id));

  return (
    <div className="fixed right-4 top-4 z-[60] w-80 space-y-3">
      {permission === "default" && !hideAsk && (
        <div className="rounded-2xl border border-line bg-white p-4 shadow-lg">
          <div className="flex items-start gap-3">
            <Bell className="mt-0.5 text-brand" size={20} />
            <div className="text-sm">
              <p className="font-semibold">Get meeting reminders</p>
              <p className="mt-1 text-gray-500">
                Allow notifications to be reminded on meeting days.
              </p>
              <div className="mt-3 flex gap-2">
                <button
                  onClick={enable}
                  className="rounded-lg bg-brand px-3 py-1.5 font-semibold text-white hover:bg-brand-dark"
                >
                  Enable
                </button>
                <button
                  onClick={() => setHideAsk(true)}
                  className="rounded-lg border px-3 py-1.5 hover:bg-gray-100"
                >
                  Not now
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {alerts.map((m) => (
        <div
          key={m.id}
          className="rounded-2xl border border-line border-l-4 border-l-brand bg-white p-4 shadow-lg"
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-bold text-brand">Meeting today</p>
              <p className="mt-1 font-semibold">
                {m.personName} · {formatTime(m.time)}
              </p>
              <p className="text-sm text-gray-600">{m.subject}</p>
              {m.remarks && <p className="mt-1 text-sm text-gray-500">{m.remarks}</p>}
            </div>
            <button
              onClick={() => dismiss(m.id)}
              className="rounded-lg p-1 text-gray-400 hover:bg-gray-100"
              aria-label="Dismiss"
            >
              <X size={18} />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}