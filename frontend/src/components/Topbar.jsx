export default function Topbar() {
  return (
    <header className="flex items-center justify-between border-b border-line bg-white px-6 py-3">
      <div>
        <h1 className="text-xl font-bold leading-tight">Purba Dashboard</h1>
        <p className="text-sm text-gray-500">Attendance Panel</p>
      </div>
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-brand text-lg font-bold text-white">
          P
        </div>
        <div className="leading-tight">
          <p className="font-semibold">Purba</p>
          <p className="text-sm text-gray-500">Admin</p>
        </div>
      </div>
    </header>
  );
}