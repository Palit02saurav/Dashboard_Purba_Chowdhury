"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Users, CalendarPlus, CalendarDays, CalendarOff } from "lucide-react";
const links = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/workers", label: "Workers", icon: Users },
  { href: "/meetings", label: "Add Meeting", icon: CalendarPlus },
  { href: "/calendar", label: "Calendars", icon: CalendarDays },
  { href: "/leaves", label: "Leave Manager", icon: CalendarOff },
];
export default function Sidebar() {
  const pathname = usePathname();
  return (
    <aside className="w-64 border-r bg-white p-4 space-y-2">
      {links.map((l) => {
        const active = pathname === l.href;
        const Icon = l.icon;
        return (
          <Link
            key={l.href}
            href={l.href}
            className={`flex items-center gap-3 rounded-xl px-4 py-3 font-semibold transition ${
              active
                ? "bg-brand text-white"
                : "text-gray-800 hover:bg-brand-soft hover:text-brand"
            }`}
          >
            <Icon size={20} />
            {l.label}
          </Link>
        );
      })}
    </aside>
  );
}