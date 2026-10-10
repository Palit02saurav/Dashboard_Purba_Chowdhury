import AttendanceList from "@/components/AttendanceList";

export default function DashboardPage() {
  return (
    <div>
      <h1 className="text-3xl font-bold">Dashboard</h1>
      <p className="mb-6 mt-1 text-gray-500">Mark attendance for today&apos;s workers.</p>
      <AttendanceList />
    </div>
  );
}