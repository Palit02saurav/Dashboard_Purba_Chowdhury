"use client";
import { useState } from "react";
import { api } from "@/lib/api";

const todayStr = () => new Date().toLocaleDateString("en-CA"); // YYYY-MM-DD

const emptyForm = () => ({
  name: "",
  phone: "",
  role: "",
  dailyWage: "",
  joiningDate: todayStr(),
});

export default function WorkerForm({ onAdded, onCancel, worker }) {
  const isEdit = !!worker;
  const [form, setForm] = useState(
    worker
      ? {
          name: worker.name || "",
          phone: worker.phone || "",
          role: worker.role || "",
          dailyWage: String(worker.dailyWage ?? ""),
          joiningDate: worker.joiningDate || todayStr(),
        }
      : emptyForm()
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handle = (e) => {
    const { name, value } = e.target;
    if (name === "phone") {
      const digits = value.replace(/\D/g, "").slice(0, 10);
      setForm({ ...form, phone: digits });
      return;
    }
    setForm({ ...form, [name]: value });
  };

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const payload = { ...form, dailyWage: Number(form.dailyWage) || 0 };
      if (isEdit) {
        await api.updateWorker(worker.id, payload);
      } else {
        await api.addWorker(payload);
      }
      setForm(emptyForm());
      onAdded();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

const input =
  "w-full rounded-xl border border-gray-300 px-3 py-2.5 outline-none focus:border-brand focus:ring-2 focus:ring-brand/20";

  return (
    <form onSubmit={submit} className="space-y-3">
      <h2 className="font-semibold">{isEdit ? "Edit Worker" : "Add Worker"}</h2>

      <input className={input} name="name" placeholder="Name *" value={form.name} onChange={handle} required />

      <input
        className={input}
        name="phone"
        type="tel"
        inputMode="numeric"
        maxLength={10}
        pattern="[0-9]{10}"
        title="Enter a 10 digit phone number"
        placeholder="Phone (10 digits)"
        value={form.phone}
        onChange={handle}
      />

      <input className={input} name="role" placeholder="Role (e.g. Mason)" value={form.role} onChange={handle} />
      <input className={input} name="dailyWage" type="number" placeholder="Daily wage" value={form.dailyWage} onChange={handle} />

      <div>
        <label htmlFor="joiningDate" className="mb-1 block text-sm text-gray-600">
          Joining date
        </label>
        <input
          id="joiningDate"
          className={input}
          name="joiningDate"
          type="date"
          value={form.joiningDate}
          onChange={handle}
        />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex gap-2">
        <button
          disabled={loading}
          className="rounded-xl bg-brand px-5 py-2.5 font-semibold text-white hover:bg-brand-dark disabled:opacity-50"
        >
          {loading ? "Saving..." : isEdit ? "Save Changes" : "Add Worker"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg border px-4 py-2 hover:bg-gray-100"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}