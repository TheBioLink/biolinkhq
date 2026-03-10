// src/components/dashboard/DashboardShell.js
import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

function navClass(active) {
  return active
    ? "flex items-center gap-3 rounded-xl px-4 py-3 text-blue-400 bg-blue-500/10 font-bold"
    : "flex items-center gap-3 rounded-xl px-4 py-3 text-white/70 hover:bg-white/5";
}

export default async function DashboardShell({
  title,
  subtitle,
  activeTab = "page",
  children,
}) {
  await getServerSession(authOptions);

  return (
    <div className="min-h-screen bg-[#060b14] text-white">
      <div className="mx-auto flex min-h-screen max-w-[1400px]">
        {/* Restored sidebar with only one nav item */}
        <aside className="w-[260px] border-r border-white/10 bg-white/[0.03] px-6 py-8">
          <nav className="space-y-2">
            <Link href="/account" className={navClass(activeTab === "page")}>
              My Page
            </Link>
          </nav>
        </aside>

        <main className="flex-1 px-8 py-10">
          <h1 className="text-5xl font-black">{title}</h1>
          {subtitle && <p className="mt-3 text-white/55">{subtitle}</p>}
          <div className="mt-10 space-y-8">{children}</div>
        </main>
      </div>
    </div>
  );
}
