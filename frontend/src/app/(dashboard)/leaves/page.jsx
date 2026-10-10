"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Trash2 } from "lucide-react";

const todayStr = () => new Date().toLocaleDateString("en-CA"); // YYYY-MM-DD

const emptyForm = () => ({
  workerId: "",
  fromDate: todayStr(),
  toDate: todayStr(),
  reason: "",
});

const formatDate = (d) => {
  if (!d) return "";
  const [y, m, day] = d.split("-");
  return `${day}/${m}/${y}`;
};

const dayCount = (from, to) =>
  Math.round((new Date(to) - new Date(from)) / 86400000) + 1;

const statusOf = (l, today) =>
  l.toDate < today ? "completed" : l.fromDate > today ? "upcoming" : "ongoing";

const STATUS_STYLE = {
  ongoing: { label: "On leave now", cls: "bg-red-50 text-red-600" },
  upcoming: { label: "Upcoming", cls: "bg-amber-50 text-amber-600" },
  completed: { label: "Completed", cls: "bg-gray-100 text-gray-500" },
};

const input =
  "w-full rounded-xl border border-gray-300 px-3 py-2.5 outline-none focus:border-brand focus:ring-2 focus:ring-brand/20";

export default function LeavesPage() {
  const [workers, setWorkers] = useState([]);
  const [leaves, setLeaves] = useState([]);
  const [form, setForm] = useState(emptyForm());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [filter, setFilter] = useState("current"); // current | past

  const load = async () => {
    const [w, l] = await Promise.all([api.getWorkers(), api.getLeaves()]);
    setWorkers(w);
    setLeaves(l);
  };
  useEffect(() => { load(); }, []);

  const handle = (e) => {
    const { name, value } = e.target;
    const next = { ...form, [name]: value };
    if (name === "fromDate" && next.toDate < value) next.toDate = value;
    setForm(next);
  };

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      await api.addLeave({ ...form, workerId: Number(form.workerId) });
      setForm(emptyForm());
      setSuccess("Leave added");
      setFilter("current");
      load();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const remove = async (id) => {
    if (!confirm("Remove this leave?")) return;
    await api.deleteLeave(id);
    load();
  };

  const today = todayStr();
  const current = leaves.filter((l) => l.toDate >= today).reverse(); // soonest first
  const past = leaves.filter((l) => l.toDate < today); // most recent first
  const shown = filter === "current" ? current : past;

  return (
    <div>
      <h1 className="text-3xl font-bold">Leave Manager</h1>
      <p className="mb-6 mt-1 text-gray-500">Add leave for a worker. It shows on the Calendar and Dashboard.</p>

      <form
        onSubmit={submit}
        className="mb-8 rounded-2xl border border-line bg-white p-6 shadow-sm"
      >
        <div className="grid gap-4 md:grid-cols-3">
          <div className="md:col-span-3">
            <label className="mb-1 block text-sm text-gray-600">Worker *</label>
            <select
              className={input}
              name="workerId"
              value={form.workerId}
              onChange={handle}
              required
            >
              <option value="" disabled>
                Select a worker
              </option>
              {workers.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name}
                  {w.role ? ` (${w.role})` : ""}
                </option>
              ))}
            </select>
            {workers.length === 0 && (
              <p className="mt-1 text-sm text-gray-500">Add workers first from the Workers tab.</p>
            )}
          </div>

          <div>
            <label className="mb-1 block text-sm text-gray-600">From *</label>
            <input className={input} type="date" name="fromDate" value={form.fromDate} onChange={handle} required />
          </div>
          <div>
            <label className="mb-1 block text-sm text-gray-600">To *</label>
            <input className={input} type="date" name="toDate" min={form.fromDate} value={form.toDate} onChange={handle} required />
          </div>
          <div>
            <label className="mb-1 block text-sm text-gray-600">Reason</label>
            <input className={input} name="reason" placeholder="e.g. Fever, family function" value={form.reason} onChange={handle} />
          </div>
        </div>

        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
        {success && <p className="mt-3 text-sm font-medium text-brand">{success}</p>}

        <button
          disabled={loading}
          className="mt-4 rounded-xl bg-brand px-6 py-3 font-semibold text-white hover:bg-brand-dark disabled:opacity-50"
        >
          {loading ? "Saving..." : "Add Leave"}
        </button>
      </form>

      <div className="mb-4 flex gap-3">
        {[
          { key: "current", label: "Current & upcoming", count: current.length },
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
              <th className="px-6 py-4 font-medium">Worker</th>
              <th className="px-6 py-4 font-medium">From</th>
              <th className="px-6 py-4 font-medium">To</th>
              <th className="px-6 py-4 font-medium">Days</th>
              <th className="px-6 py-4 font-medium">Reason</th>
              <th className="px-6 py-4 font-medium">Status</th>
              <th className="px-6 py-4 font-medium">Action</th>
            </tr>
          </thead>
          <tbody>
            {shown.map((l) => {
              const st = STATUS_STYLE[statusOf(l, today)];
              return (
                <tr key={l.id} className="border-b border-line last:border-0">
                  <td className="px-6 py-4 font-semibold">{l.Worker?.name || "Unknown"}</td>
                  <td className="px-6 py-4 text-gray-700">{formatDate(l.fromDate)}</td>
                  <td className="px-6 py-4 text-gray-700">{formatDate(l.toDate)}</td>
                  <td className="px-6 py-4 text-gray-700">{dayCount(l.fromDate, l.toDate)}</td>
                  <td className="max-w-xs px-6 py-4 text-gray-600">{l.reason}</td>
                  <td className="px-6 py-4">
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${st.cls}`}>
                      {st.label}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => remove(l.id)}
                      className="rounded-lg p-2 text-gray-500 hover:bg-red-50 hover:text-red-600"
                      aria-label="Remove leave"
                    >
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              );
            })}
            {shown.length === 0 && (
              <tr>
                <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                  No {filter === "current" ? "current or upcoming" : "past"} leaves.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}