"use client";
import { useRef, useState } from "react";
import {
  Banknote,
  Briefcase,
  CalendarDays,
  Camera,
  ChevronDown,
  FileText,
  Phone,
  User,
  UserPlus,
  X,
} from "lucide-react";
import { api } from "@/lib/api";

const todayStr = () => new Date().toLocaleDateString("en-CA"); // YYYY-MM-DD

const ROLES = [
  "Mason",
  "Carpenter",
  "Electrician",
  "Plumber",
  "Painter",
  "Helper",
  "Cleaner",
  "Supervisor",
  "Worker",
];

const emptyForm = () => ({
  name: "",
  phone: "",
  role: "",
  dailyWage: "",
  joiningDate: todayStr(),
  notes: "",
  photo: "",
});

// crops to a square and shrinks to 256px so it stays small in the database
const toAvatar = (file) =>
  new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const size = 256;
      const canvas = document.createElement("canvas");
      canvas.width = size;
      canvas.height = size;
      const min = Math.min(img.width, img.height);
      canvas
        .getContext("2d")
        .drawImage(img, (img.width - min) / 2, (img.height - min) / 2, min, min, 0, 0, size, size);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL("image/jpeg", 0.8));
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Could not read this image"));
    };
    img.src = url;
  });

const input =
  "w-full rounded-xl border border-gray-300 bg-white px-4 py-3 outline-none placeholder:text-gray-400 focus:border-brand focus:ring-2 focus:ring-brand/20";

function Label({ icon: Icon, children, required }) {
  return (
    <label className="mb-2 flex items-center gap-2 font-semibold text-gray-800">
      <Icon size={18} className="text-gray-600" />
      {children}
      {required && <span className="text-red-500">*</span>}
    </label>
  );
}

export default function WorkerForm({ onAdded, onCancel, worker }) {
  const isEdit = !!worker;
  const fileRef = useRef(null);
  const [form, setForm] = useState(
    worker
      ? {
          name: worker.name || "",
          phone: worker.phone || "",
          role: worker.role || "",
          dailyWage: String(worker.dailyWage ?? ""),
          joiningDate: worker.joiningDate || todayStr(),
          notes: worker.notes || "",
          photo: worker.photo || "",
        }
      : emptyForm()
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [photoError, setPhotoError] = useState("");

  // keep an old custom role selectable when editing
  const roles = form.role && !ROLES.includes(form.role) ? [form.role, ...ROLES] : ROLES;

  const handle = (e) => {
    const { name, value } = e.target;
    if (name === "phone") {
      setForm({ ...form, phone: value.replace(/\D/g, "").slice(0, 10) });
      return;
    }
    setForm({ ...form, [name]: value });
  };

  const pickPhoto = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setPhotoError("");
    if (!["image/jpeg", "image/png"].includes(file.type)) {
      setPhotoError("Only JPG or PNG allowed");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setPhotoError("Photo must be under 2MB");
      return;
    }
    try {
      setForm((f) => ({ ...f, photo: "" }));
      const photo = await toAvatar(file);
      setForm((f) => ({ ...f, photo }));
    } catch (err) {
      setPhotoError(err.message);
    }
  };

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const payload = {
        ...form,
        dailyWage: Number(form.dailyWage) || 0,
        photo: form.photo || null,
        notes: form.notes.trim() || null,
      };
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

  return (
    <form onSubmit={submit}>
      {/* Header */}
      <div className="flex items-start justify-between px-8 pb-2 pt-7">
        <div className="flex items-center gap-4">
          <div className="flex h-[60px] w-[60px] items-center justify-center rounded-2xl bg-brand-soft text-brand">
            <UserPlus size={28} />
          </div>
          <div>
            <h2 className="text-2xl font-bold leading-tight">
              {isEdit ? "Edit Worker" : "Add Worker"}
            </h2>
            <p className="text-gray-500">
              {isEdit ? "Update this worker's details" : "Add a new worker to your team"}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg p-2 text-gray-600 hover:bg-gray-100"
          aria-label="Close"
        >
          <X size={24} />
        </button>
      </div>

      {/* Body */}
      <div className="px-8 pb-6 pt-4">
        <div className="grid gap-6 md:grid-cols-[220px_1fr]">
          {/* Photo */}
          <div className="flex flex-col items-center">
            <div className="relative">
              <div className="flex h-[200px] w-[200px] items-center justify-center overflow-hidden rounded-full border-2 border-dashed border-gray-300 bg-gray-100">
                {form.photo ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={form.photo} alt="Worker" className="h-full w-full object-cover" />
                ) : (
                  <User size={90} className="text-gray-400" fill="currentColor" />
                )}
              </div>
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="absolute bottom-2 right-2 flex h-11 w-11 items-center justify-center rounded-full bg-brand text-white shadow hover:bg-brand-dark"
                aria-label="Upload photo"
              >
                <Camera size={20} />
              </button>
              <input
                ref={fileRef}
                type="file"
                accept="image/png,image/jpeg"
                className="hidden"
                onChange={pickPhoto}
              />
            </div>
            <p className="mt-3 font-semibold">Upload Photo</p>
            <p className="text-sm text-gray-500">JPG, PNG (Max 2MB)</p>
            {form.photo && (
              <button
                type="button"
                onClick={() => setForm({ ...form, photo: "" })}
                className="mt-1 text-sm text-red-600 hover:underline"
              >
                Remove photo
              </button>
            )}
            {photoError && <p className="mt-1 text-center text-sm text-red-600">{photoError}</p>}
          </div>

          {/* Name / Phone / Role */}
          <div className="space-y-5">
            <div>
              <Label icon={User} required>Name</Label>
              <input
                className={input}
                name="name"
                placeholder="Enter full name"
                value={form.name}
                onChange={handle}
                required
              />
            </div>

            <div>
              <Label icon={Phone} required>Phone Number</Label>
              <div className="flex overflow-hidden rounded-xl border border-gray-300 focus-within:border-brand focus-within:ring-2 focus-within:ring-brand/20">
                <div className="flex items-center gap-2 border-r border-gray-300 bg-gray-50 px-4">
                  <svg width="24" height="17" viewBox="0 0 22 16" className="rounded-sm">
                    <rect width="22" height="5.33" fill="#FF9933" />
                    <rect y="5.33" width="22" height="5.34" fill="#fff" />
                    <rect y="10.67" width="22" height="5.33" fill="#138808" />
                    <circle cx="11" cy="8" r="1.8" fill="none" stroke="#000080" strokeWidth="0.6" />
                  </svg>
                  <span className="font-medium">+91</span>
                  <ChevronDown size={16} className="text-gray-500" />
                </div>
                <input
                  className="w-full px-4 py-3 outline-none placeholder:text-gray-400"
                  name="phone"
                  type="tel"
                  inputMode="numeric"
                  maxLength={10}
                  pattern="[0-9]{10}"
                  title="Enter a 10 digit phone number"
                  placeholder="Enter 10 digit phone number"
                  value={form.phone}
                  onChange={handle}
                  required
                />
              </div>
            </div>

            <div>
              <Label icon={Briefcase} required>Role</Label>
              <div className="relative">
                <select
                  className={`${input} appearance-none pr-10 ${form.role ? "" : "text-gray-400"}`}
                  name="role"
                  value={form.role}
                  onChange={handle}
                  required
                >
                  <option value="" disabled>Select role</option>
                  {roles.map((r) => (
                    <option key={r} value={r} className="text-gray-900">{r}</option>
                  ))}
                </select>
                <ChevronDown
                  size={18}
                  className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-gray-700"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Wage / Joining date */}
        <div className="mt-5 grid gap-5 md:grid-cols-2">
          <div>
            <Label icon={Banknote} required>Daily Wage</Label>
            <div className="flex overflow-hidden rounded-xl border border-gray-300 focus-within:border-brand focus-within:ring-2 focus-within:ring-brand/20">
              <span className="flex items-center border-r border-gray-300 bg-gray-50 px-5 font-semibold">
                ₹
              </span>
              <input
                className="w-full px-4 py-3 outline-none placeholder:text-gray-400"
                name="dailyWage"
                type="number"
                min="0"
                placeholder="Enter daily wage"
                value={form.dailyWage}
                onChange={handle}
                required
              />
            </div>
          </div>
          <div>
            <Label icon={CalendarDays} required>Joining Date</Label>
            <input
              className={input}
              name="joiningDate"
              type="date"
              value={form.joiningDate}
              onChange={handle}
              required
            />
          </div>
        </div>

        {/* Notes */}
        <div className="mt-5">
          <Label icon={FileText}>Additional Notes (Optional)</Label>
          <textarea
            className={`${input} resize-y`}
            name="notes"
            rows={3}
            placeholder="Enter any additional information..."
            value={form.notes}
            onChange={handle}
          />
        </div>

        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
      </div>

      {/* Footer */}
      <div className="flex justify-end gap-3 border-t border-line px-8 py-5">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-xl border border-gray-300 px-8 py-3 font-semibold hover:bg-gray-100"
        >
          Cancel
        </button>
        <button
          disabled={loading}
          className="flex items-center gap-2 rounded-xl bg-brand px-7 py-3 font-semibold text-white hover:bg-brand-dark disabled:opacity-50"
        >
          <UserPlus size={20} />
          {loading ? "Saving..." : isEdit ? "Save Changes" : "Add Worker"}
        </button>
      </div>
    </form>
  );
}