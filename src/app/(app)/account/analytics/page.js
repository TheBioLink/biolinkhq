// src/app/account/analytics/page.js
import DashboardShell from "@/components/dashboard/DashboardShell";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export default async function AnalyticsPage() {
  const session = await getServerSession(authOptions);

  if (!session) return null;

  return (
    <DashboardShell
      title="Analytics"
      subtitle="Track profile views, clicks and engagement."
      activeTab="analytics"
    >
      <div className="rounded-2xl border border-white/10 bg-white/5 p-8">
        <h2 className="text-xl font-extrabold mb-4">
          Analytics coming online
        </h2>

        <p className="text-gray-400">
          Your profile analytics will appear here once data is collected.
        </p>
      </div>
    </DashboardShell>
  );
}
