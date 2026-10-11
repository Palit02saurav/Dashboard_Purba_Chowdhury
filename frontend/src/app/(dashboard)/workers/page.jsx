"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import WorkerForm from "@/components/WorkerForm";
import ImportModal from "@/components/ImportModal";
import { MoreVertical, Pencil, Trash2, Upload } from "lucide-react";

const formatDate = (d) => {
  if (!d) return "";
  const [y, m, day] = d.split("-");
  return `${day}/${m}/${y}`;
};

export default function WorkersPage() {
  const [workers, setWorkers] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingWorker, setEditingWorker] = useState(null);
  const [menu, setMenu] = useState(null); // { worker, top, right }
  const [showImport, setShowImport] = useState(false);

  const load = async () => setWorkers(await api.getWorkers());
  useEffect(() => { load(); }, []);

  // close popup with the Escape key
  useEffect(() => {
    if (!showForm) return;
    const onKey = (e) => e.key === "Escape" && setShowForm(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [showForm]);

  const remove = async (id) => {
    if (!confirm("Remove this worker?")) return;
    await api.deleteWorker(id);
    load();
  };

  const handleAdded = () => {
    setShowForm(false);
    load();
  };

  const openAdd = () => {
    setEditingWorker(null);
    setShowForm(true);
  };

  const openEdit = (worker) => {
    setMenu(null);
    setEditingWorker(worker);
    setShowForm(true);
  };

  const openMenu = (e, worker) => {
    e.stopPropagation();
    if (menu?.worker.id === worker.id) {
      setMenu(null);
      return;
    }
    const r = e.currentTarget.getBoundingClientRect();
    setMenu({ worker, top: r.bottom + 4, right: window.innerWidth - r.right });
  };

  // close the three-dot menu on outside click or scroll
  useEffect(() => {
    if (!menu) return;
    const close = () => setMenu(null);
    window.addEventListener("click", close);
    window.addEventListener("scroll", close, true);
    return () => {
      window.removeEventListener("click", close);
      window.removeEventListener("scroll", close, true);
    };
  }, [menu]);

  return (
    <div>
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold">Workers</h1>
          <p className="mt-1 text-gray-500">Manage everyone working with you.</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setShowImport(true)}
            className="flex items-center gap-2 rounded-xl border border-brand bg-white px-5 py-3 font-semibold text-brand hover:bg-brand-soft"
          >
            <Upload size={18} /> Bulk Import
          </button>
          <button
            onClick={openAdd}
            className="rounded-xl bg-brand px-5 py-3 font-semibold text-white hover:bg-brand-dark"
          >
            + Add Worker
          </button>
        </div>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-line bg-white shadow-sm">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-line text-sm text-gray-500">
              <th className="px-6 py-4 font-medium">Name</th>
              <th className="px-6 py-4 font-medium">Phone</th>
              <th className="px-6 py-4 font-medium">Role</th>
              <th className="px-6 py-4 font-medium">Joined</th>
              <th className="px-6 py-4 font-medium">Action</th>
            </tr>
          </thead>
          <tbody>
            {workers.map((w) => (
              <tr key={w.id} className="border-b border-line last:border-0">
                <td className="px-6 py-4 font-semibold">{w.name}</td>
                <td className="px-6 py-4 text-gray-700">{w.phone}</td>
                <td className="px-6 py-4">
                  {w.role && (
                    <span className="rounded-full bg-brand-soft px-3 py-1 text-sm font-semibold text-brand">
                      {w.role}
                    </span>
                  )}
                </td>
                <td className="px-6 py-4 text-gray-700">{formatDate(w.joiningDate)}</td>
                <td className="px-6 py-4">
                  <button
                    onClick={(e) => openMenu(e, w)}
                    className="rounded-lg p-2 text-gray-600 hover:bg-gray-100"
                    aria-label="Actions"
                  >
                    <MoreVertical size={20} />
                  </button>
                </td>
              </tr>
            ))}
            {workers.length === 0 && (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                  No workers yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Bulk import popup */}
      {showImport && (
        <ImportModal onClose={() => setShowImport(false)} onDone={load} />
      )}

      {/* Three-dot dropdown */}
      {menu && (
        <div
          className="fixed z-40 w-36 overflow-hidden rounded-xl border border-line bg-white py-1 shadow-lg"
          style={{ top: menu.top, right: menu.right }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={() => openEdit(menu.worker)}
            className="flex w-full items-center gap-2 px-4 py-2 text-sm hover:bg-brand-soft hover:text-brand"
          >
            <Pencil size={16} /> Edit
          </button>
          <button
            onClick={() => {
              const id = menu.worker.id;
              setMenu(null);
              remove(id);
            }}
            className="flex w-full items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
          >
            <Trash2 size={16} /> Remove
          </button>
        </div>
      )}

      {/* Popup (add / edit) */}
      {showForm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={() => setShowForm(false)}
        >
          <div
            className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <WorkerForm
              key={editingWorker?.id ?? "new"}
              worker={editingWorker}
              onAdded={handleAdded}
              onCancel={() => setShowForm(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
}