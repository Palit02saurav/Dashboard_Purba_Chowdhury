const API = process.env.NEXT_API_URL;

async function request(path, options) {
  const res = await fetch(`${API}${path}`, {
    headers: { "Content-Type": "application/json" },
    cache: "no-store",
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || "Request failed");
  }
  return res.json();
}

export const api = {
  getWorkers: () => request("/workers"),
  addWorker: (data) =>
    request("/workers", { method: "POST", body: JSON.stringify(data) }),
  importWorkers: async (file) => {
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch(`${API}/workers/import`, { method: "POST", body: fd });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.message || "Import failed");
    return data;
  },
  downloadTemplate: async () => {
    const res = await fetch(`${API}/workers/template`);
    if (!res.ok) throw new Error("Could not download the template");
    return res.blob();
  },
  getCalendar: (year, month) => request(`/calendar?year=${year}&month=${month}`),
  getLeaves: () => request("/leaves"),
  addLeave: (data) =>
    request("/leaves", { method: "POST", body: JSON.stringify(data) }),
  deleteLeave: (id) => request(`/leaves/${id}`, { method: "DELETE" }),
  getMeetings: (date) =>request(`/meetings${date ? `?date=${date}` : ""}`),
  addMeeting: (data) =>
    request("/meetings", { method: "POST", body: JSON.stringify(data) }),
  deleteMeeting: (id) => request(`/meetings/${id}`, { method: "DELETE" }),
  updateWorker: (id, data) =>
    request(`/workers/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  deleteWorker: (id) => request(`/workers/${id}`, { method: "DELETE" }),
  getAttendance: (date) =>
    request(`/attendance${date ? `?date=${date}` : ""}`),
  markAttendance: (data) =>
    request("/attendance", { method: "POST", body: JSON.stringify(data) }),
};