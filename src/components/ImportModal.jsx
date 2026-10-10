"use client";
import { useState } from "react";
import { api } from "@/lib/api";
import { Download, FileSpreadsheet } from "lucide-react";

export default function ImportModal({ onClose, onDone }) {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);

  const downloadTemplate = async () => {
    try {
      const blob = await api.downloadTemplate();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "workers-template.xlsx";
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err.message);
    }
  };

  const upload = async () => {
    if (!file) return setError("Please choose an .xlsx file first");
    setLoading(true);
    setError("");
    try {
      const data = await api.importWorkers(file);
      setResult(data);
      if (data.added > 0) onDone(); // refresh the list behind the popup
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg font-semibold">Bulk Import Workers</h2>
        <p className="mt-1 text-sm text-gray-500">
          Upload an Excel (.xlsx) file with columns: Name, Phone, Role, Daily Wage, Joining Date.
        </p>

        <button
          onClick={downloadTemplate}
          className="mt-4 flex items-center gap-2 rounded-xl border border-line px-4 py-2 text-sm font-medium text-brand hover:bg-brand-soft"
        >
          <Download size={16} /> Download template
        </button>

        <label className="mt-4 flex cursor-pointer items-center gap-3 rounded-xl border-2 border-dashed border-gray-300 px-4 py-5 hover:border-brand">
          <FileSpreadsheet className="text-brand" />
          <span className="text-sm text-gray-700">
            {file ? file.name : "Click to choose an .xlsx file"}
          </span>
          <input
            type="file"
            accept=".xlsx"
            className="hidden"
            onChange={(e) => {
              setFile(e.target.files[0] || null);
              setResult(null);
              setError("");
            }}
          />
        </label>

        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

        {result && (
          <div className="mt-4 rounded-xl bg-brand-soft p-4 text-sm">
            <p className="font-semibold text-brand">
              {result.added} worker{result.added === 1 ? "" : "s"} added
              {result.skipped.length > 0 && `, ${result.skipped.length} skipped`}
            </p>
            {result.skipped.length > 0 && (
              <ul className="mt-2 max-h-40 space-y-1 overflow-y-auto text-gray-700">
                {result.skipped.map((s, i) => (
                  <li key={i}>
                    Row {s.row}: {s.reason}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        <div className="mt-5 flex gap-2">
          <button
            onClick={upload}
            disabled={loading}
            className="rounded-xl bg-brand px-5 py-2.5 font-semibold text-white hover:bg-brand-dark disabled:opacity-50"
          >
            {loading ? "Importing..." : "Upload & Import"}
          </button>
          <button
            onClick={onClose}
            className="rounded-xl border px-5 py-2.5 hover:bg-gray-100"
          >
            {result ? "Close" : "Cancel"}
          </button>
        </div>
      </div>
    </div>
  );
}