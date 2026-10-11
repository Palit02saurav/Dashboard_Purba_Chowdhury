"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, LogOut, User, X } from "lucide-react";
import { getUser, signOut } from "@/lib/auth";

export default function Topbar() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [open, setOpen] = useState(false);
  const [showProfile, setShowProfile] = useState(false);

  useEffect(() => {
    setUser(getUser());
  }, []);

  // close the dropdown on outside click or Escape
  useEffect(() => {
    if (!open) return;
    const close = () => setOpen(false);
    const onKey = (e) => e.key === "Escape" && setOpen(false);
    window.addEventListener("click", close);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("click", close);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const logout = () => {
    signOut();
    router.replace("/login");
  };

  const name = user?.name || "Admin";
  const email = user?.email || "";
  const initial = name.charAt(0).toUpperCase();

  return (
    <header className="relative z-40 flex items-center justify-between border-b border-line bg-white px-6 py-3">
      <div>
        <h1 className="text-xl font-bold leading-tight">Business Dashboard</h1>
        <p className="text-sm text-gray-500">Super Admin Panel</p>
      </div>

      <div className="relative">
        <button
          onClick={(e) => {
            e.stopPropagation();
            setOpen((o) => !o);
          }}
          className="flex items-center gap-3 rounded-xl px-2 py-1 hover:bg-gray-50"
        >
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-brand text-lg font-bold text-white">
            {initial}
          </div>
          <div className="text-left leading-tight">
            <p className="font-semibold">{name}</p>
            <p className="text-sm text-gray-500">Admin</p>
          </div>
          <ChevronDown
            size={18}
            className={`text-gray-500 transition ${open ? "rotate-180" : ""}`}
          />
        </button>

        {open && (
          <div className="absolute right-0 top-full z-50 mt-2 w-64 overflow-hidden rounded-xl border border-line bg-white shadow-lg">
            <div className="border-b border-line px-4 py-3">
              <p className="font-semibold">{name}</p>
              {email && <p className="truncate text-sm text-gray-500">{email}</p>}
            </div>
            <button
              onClick={() => {
                setOpen(false);
                setShowProfile(true);
              }}
              className="flex w-full items-center gap-3 px-4 py-3 text-sm hover:bg-brand-soft hover:text-brand"
            >
              <User size={18} /> My Profile
            </button>
            <button
              onClick={logout}
              className="flex w-full items-center gap-3 px-4 py-3 text-sm text-red-600 hover:bg-red-50"
            >
              <LogOut size={18} /> Logout
            </button>
          </div>
        )}
      </div>

      {/* Profile popup */}
      {showProfile && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={() => setShowProfile(false)}
        >
          <div
            className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between">
              <h2 className="text-xl font-bold">My Profile</h2>
              <button
                onClick={() => setShowProfile(false)}
                className="rounded-lg p-2 text-gray-500 hover:bg-gray-100"
                aria-label="Close"
              >
                <X size={20} />
              </button>
            </div>

            <div className="mt-5 flex flex-col items-center">
              <div className="flex h-24 w-24 items-center justify-center rounded-full bg-brand text-4xl font-bold text-white">
                {initial}
              </div>
              <p className="mt-3 text-lg font-semibold">{name}</p>
              <span className="mt-1 rounded-full bg-brand-soft px-3 py-0.5 text-sm font-semibold text-brand">
                Admin
              </span>
            </div>

            <div className="mt-5 divide-y rounded-xl border border-line text-sm">
              <div className="flex justify-between px-4 py-3">
                <span className="text-gray-500">Name</span>
                <span className="font-medium">{name}</span>
              </div>
              <div className="flex justify-between gap-4 px-4 py-3">
                <span className="text-gray-500">Email</span>
                <span className="truncate font-medium">{email || "-"}</span>
              </div>
              <div className="flex justify-between px-4 py-3">
                <span className="text-gray-500">Role</span>
                <span className="font-medium">Admin</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}