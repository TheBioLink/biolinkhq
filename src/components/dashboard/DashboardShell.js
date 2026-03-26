// components/dashboard/DashboardShell.js

export default function DashboardShell({ title, children }) {
  return (
    <div className="min-h-screen bg-[#0b0f14] text-white">

      {/* TOP BAR */}
      <div className="sticky top-0 z-50 backdrop-blur-xl bg-black/40 border-b border-white/10">
        <div className="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">
          <h1 className="font-bold text-lg tracking-tight">
            {title}
          </h1>

          <div className="text-sm text-white/50">
            Dashboard
          </div>
        </div>
      </div>

      {/* CONTENT */}
      <div className="px-6 py-10">
        {children}
      </div>
    </div>
  );
}
