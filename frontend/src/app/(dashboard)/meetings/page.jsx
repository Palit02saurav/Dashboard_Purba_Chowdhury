"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Trash2 } from "lucide-react";

const todayStr = () => new Date().toLocaleDateString("en-CA"); // YYYY-MM-DD

const emptyForm = () => ({
  personName: "",
  date: todayStr(),
  time: "",
  subject: "",
  remarks: "",
});

const formatDate = (d) => {
  if (!d) return "";
  const [y, m, day] = d.split("-");
  return `${day}/${m}/${y}`;
};

const formatTime = (t) => {
  if (!t) return "";
  const [h, m] = t.split(":");
  const hour = Number(h);
  return `${hour % 12 || 12}:${m} ${hour >= 12 ? "PM" : "AM"}`;
};

const isPast = (m) => new Date(`${m.date}T${m.time}`) < new Date();

const input =
  "w-full rounded-xl border border-gray-300 px-3 py-2.5 outline-none focus:border-brand focus:ring-2 focus:ring-brand/20";

export default function MeetingsPage() {
  const [meetings, setMeetings] = useState([]);
  const [form, setForm] = useState(emptyForm());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [filter, setFilter] = useState("upcoming"); // upcoming | past

  const load = async () => setMeetings(await api.getMeetings());
  useEffect(() => { load(); }, []);

  const handle = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      await api.addMeeting(form);
      setForm(emptyForm());
      setSuccess("Meeting added");
      setFilter("upcoming");
      load();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const remove = async (id) => {
    if (!confirm("Delete this meeting?")) return;
    await api.deleteMeeting(id);
    load();
  };

  const upcoming = meetings.filter((m) => !isPast(m));
  const past = meetings.filter(isPast).reverse(); // most recent first
  const shown = filter === "upcoming" ? upcoming : past;

  return (
    <div>
      <h1 className="text-3xl font-bold">Add Meeting</h1>
      <p className="mb-6 mt-1 text-gray-500">Schedule a meeting and keep track of it.</p>

      <form
        onSubmit={submit}
        className="mb-8 rounded-2xl border border-line bg-white p-6 shadow-sm"
      >
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm text-gray-600">Person name *</label>
            <input className={input} name="personName" placeholder="Who is the meeting with?" value={form.personName} onChange={handle} required />
          </div>
          <div>
            <label className="mb-1 block text-sm text-gray-600">Subject *</label>
            <input className={input} name="subject" placeholder="What is it about?" value={form.subject} onChange={handle} required />
          </div>
          <div>
            <label className="mb-1 block text-sm text-gray-600">Date *</label>
            <input className={input} name="date" type="date" value={form.date} onChange={handle} required />
          </div>
          <div>
            <label className="mb-1 block text-sm text-gray-600">Time *</label>
            <input className={input} name="time" type="time" value={form.time} onChange={handle} required />
          </div>
          <div className="md:col-span-2">
            <label className="mb-1 block text-sm text-gray-600">Remarks</label>
            <textarea className={input} name="remarks" rows={3} placeholder="Any notes (optional)" value={form.remarks} onChange={handle} />
          </div>
        </div>

        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
        {success && <p className="mt-3 text-sm font-medium text-brand">{success}</p>}

        <button
          disabled={loading}
          className="mt-4 rounded-xl bg-brand px-6 py-3 font-semibold text-white hover:bg-brand-dark disabled:opacity-50"
        >
          {loading ? "Saving..." : "Add Meeting"}
        </button>
      </form>

      <div className="mb-4 flex gap-3">
        {[
          { key: "upcoming", label: "Upcoming", count: upcoming.length },
          { key: "past", label: "Past", count: past.length },
        ].map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`rounded-full border px-5 py-2 text-sm font-semibold ${
              filter === f.key
                ? "border-brand bg-brand text-white"
                : "border-line bg-white hover:bg-brand-soft"
            }`}
          >
            {f.label} {f.count}
          </button>
        ))}
      </div>

      <div className="overflow-x-auto rounded-2xl border border-line bg-white shadow-sm">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-line text-sm text-gray-500">
              <th className="px-6 py-4 font-medium">Person</th>
              <th className="px-6 py-4 font-medium">Date</th>
              <th className="px-6 py-4 font-medium">Time</th>
              <th className="px-6 py-4 font-medium">Subject</th>
              <th className="px-6 py-4 font-medium">Remarks</th>
              <th className="px-6 py-4 font-medium">Action</th>
            </tr>
          </thead>
          <tbody>
            {shown.map((m) => (
              <tr key={m.id} className="border-b border-line last:border-0">
                <td className="px-6 py-4 font-semibold">{m.personName}</td>
                <td className="px-6 py-4 text-gray-700">{formatDate(m.date)}</td>
                <td className="px-6 py-4 text-gray-700">{formatTime(m.time)}</td>
                <td className="px-6 py-4">{m.subject}</td>
                <td className="max-w-xs px-6 py-4 text-gray-600">{m.remarks}</td>
                <td className="px-6 py-4">
                  <button
                    onClick={() => remove(m.id)}
                    className="rounded-lg p-2 text-gray-500 hover:bg-red-50 hover:text-red-600"
                    aria-label="Delete meeting"
                  >
                    <Trash2 size={18} />
                  </button>
                </td>
              </tr>
            ))}
            {shown.length === 0 && (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                  No {filter} meetings.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}