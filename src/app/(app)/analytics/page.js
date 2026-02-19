import DashboardShell from "@/components/dashboard/DashboardShell";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

import mongoose from "mongoose";
import { Page } from "@/models/Page";

export default async function AnalyticsPage() {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email;

  if (!email) {
    return (
      <DashboardShell
        username=""
        title="Analytics"
        subtitle="Sign in to view analytics."
      >
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <p className="text-gray-300">You must be signed in.</p>
        </div>
      </DashboardShell>
    );
  }

  await mongoose.connect(process.env.MONGO_URI);
  const page = await Page.findOne({ owner: email }).lean();
  const username = page?.uri || "";

  return (
    <DashboardShell
      username={username}
      title="Analytics"
      subtitle="Track views and clicks to understand what performs best."
    >
      <div className="grid md:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
          <div className="text-sm text-gray-400">Views</div>
          <div className="mt-2 text-3xl font-extrabold">—</div>
          <div className="mt-2 text-xs text-gray-500">
            Hook this to your click/view collection.
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
          <div className="text-sm text-gray-400">Clicks</div>
          <div className="mt-2 text-3xl font-extrabold">—</div>
          <div className="mt-2 text-xs text-gray-500">
            Total link taps across your page.
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
          <div className="text-sm text-gray-400">CTR</div>
          <div className="mt-2 text-3xl font-extrabold">—%</div>
          <div className="mt-2 text-xs text-gray-500">
            Clicks ÷ Views.
          </div>
        </div>
      </div>

      <section className="rounded-2xl border border-white/10 bg-white/5 p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-extrabold">Top links</h2>
          <div className="text-sm text-gray-400">Last 30 days</div>
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-gray-400">
              <tr className="border-b border-white/10">
                <th className="text-left py-3 pr-4 font-semibold">Link</th>
                <th className="text-right py-3 pl-4 font-semibold">Clicks</th>
              </tr>
            </thead>
            <tbody className="text-gray-200">
              <tr className="border-b border-white/10">
                <td className="py-3 pr-4">
                  <div className="font-semibold">—</div>
                  <div className="text-xs text-gray-500 truncate max-w-[520px]">
                    —
                  </div>
                </td>
                <td className="py-3 pl-4 text-right font-bold">—</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-2xl border border-white/10 bg-white/5 p-6">
        <h2 className="text-lg font-extrabold">Coming next</h2>
        <ul className="mt-3 text-sm text-gray-300 space-y-2">
          <li>• Views over time graph</li>
          <li>• Clicks by link</li>
          <li>• Referrers (where visitors came from)</li>
        </ul>
      </section>
    </DashboardShell>
  );
}
