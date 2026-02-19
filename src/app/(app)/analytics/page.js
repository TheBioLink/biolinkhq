import DashboardShell from "@/components/dashboard/DashboardShell";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import mongoose from "mongoose";
import { Page } from "@/models/Page";

export default async function AnalyticsPage() {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email;

  if (!email) return null;

  await mongoose.connect(process.env.MONGO_URI);
  const page = await Page.findOne({ owner: email }).lean();

  return (
    <DashboardShell
      title="Analytics"
      subtitle="Track views and clicks to understand what performs best."
    >
      <div className="grid md:grid-cols-3 gap-6">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <div className="text-sm text-gray-400">Views</div>
          <div className="mt-3 text-3xl font-extrabold">—</div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <div className="text-sm text-gray-400">Clicks</div>
          <div className="mt-3 text-3xl font-extrabold">—</div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <div className="text-sm text-gray-400">CTR</div>
          <div className="mt-3 text-3xl font-extrabold">—%</div>
        </div>
      </div>

      <section className="rounded-2xl border border-white/10 bg-white/5 p-8">
        <h2 className="text-xl font-extrabold mb-6">Top links</h2>

        <div className="text-gray-400 text-sm">
          Analytics table will appear here once tracking is connected.
        </div>
      </section>
    </DashboardShell>
  );
}
