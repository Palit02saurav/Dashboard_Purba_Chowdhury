import Sidebar from "@/components/Sidebar";
import Topbar from "@/components/Topbar";
import MeetingReminder from "@/components/MeetingReminder";

export default function DashboardLayout({ children }) {
  return (
    <div className="flex h-screen flex-col bg-background">
      <MeetingReminder />
      <Topbar />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-y-auto p-8">{children}</main>
      </div>
    </div>
  );
}