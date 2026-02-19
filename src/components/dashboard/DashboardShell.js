import SidebarNav from "@/components/dashboard/SidebarNav";
import MobileTopbar from "@/components/dashboard/MobileTopbar";

export default function DashboardShell({ username, title, subtitle, children }) {
  return (
    <div className="min-h-screen bg-[#0b0f14] text-gray-100">
      <MobileTopbar username={username} />

      <div className="max-w-6xl mx-auto px-4 py-6 md:py-10">
        <div className="flex gap-6">
          <SidebarNav username={username} />

          <main className="flex-1 min-w-0">
            <header className="mb-6 md:mb-8">
              <h1 className="text-2xl md:text-3xl font-extrabold">{title}</h1>
              {subtitle && (
                <p className="text-gray-400 mt-2 max-w-2xl">{subtitle}</p>
              )}
            </header>

            <div className="space-y-6">{children}</div>
          </main>
        </div>
      </div>
    </div>
  );
}
