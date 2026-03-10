// src/app/account/analytics/page.js
import DashboardShell from "@/components/dashboard/DashboardShell";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { ProfileEvent } from "@/models/ProfileEvent";
import { connectDb, normalizeEmail } from "@/libs/analytics";

function daysAgo(days) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d;
}

function formatNumber(value) {
  return new Intl.NumberFormat("en-GB").format(value || 0);
}

function pickTop(map, limit = 5) {
  return Object.entries(map || {})
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit);
}

export default async function AnalyticsPage() {
  const session = await getServerSession(authOptions);
  const email = normalizeEmail(session?.user?.email);

  if (!email) return null;

  await connectDb();

  const since = daysAgo(30);

  const events = await ProfileEvent.find({
    owner: email,
    createdAt: { $gte: since },
  })
    .sort({ createdAt: -1 })
    .lean();

  const pageViews = events.filter((e) => e.type === "page_view");
  const clicks = events.filter((e) => e.type === "outbound_click");
  const sharesOpened = events.filter((e) => e.type === "share_open");
  const shareCopies = events.filter((e) => e.type === "share_copy");
  const shareNative = events.filter((e) => e.type === "share_native");
  const shareX = events.filter((e) => e.type === "share_x");

  const uniqueVisitors = new Set(
    pageViews.map((e) => e.anonId).filter(Boolean)
  ).size;

  const countries = {};
  const devices = {};
  const browsers = {};
  const referrers = {};
  const links = {};

  for (const event of events) {
    if (event.country) countries[event.country] = (countries[event.country] || 0) + 1;
    if (event.deviceType) devices[event.deviceType] = (devices[event.deviceType] || 0) + 1;
    if (event.browser) browsers[event.browser] = (browsers[event.browser] || 0) + 1;
    if (event.referrerHost) referrers[event.referrerHost] = (referrers[event.referrerHost] || 0) + 1;
    if (event.type === "outbound_click" && event.target) {
      links[event.target] = (links[event.target] || 0) + 1;
    }
  }

  return (
    <DashboardShell
      title="Analytics"
      subtitle="Privacy-safe profile analytics from the last 30 days."
      activeTab="analytics"
    >
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <div className="text-xs font-bold uppercase tracking-[0.18em] text-white/45">
            Page views
          </div>
          <div className="mt-2 text-3xl font-black">{formatNumber(pageViews.length)}</div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <div className="text-xs font-bold uppercase tracking-[0.18em] text-white/45">
            Unique visitors
          </div>
          <div className="mt-2 text-3xl font-black">{formatNumber(uniqueVisitors)}</div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <div className="text-xs font-bold uppercase tracking-[0.18em] text-white/45">
            Outbound clicks
          </div>
          <div className="mt-2 text-3xl font-black">{formatNumber(clicks.length)}</div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <div className="text-xs font-bold uppercase tracking-[0.18em] text-white/45">
            Shares
          </div>
          <div className="mt-2 text-3xl font-black">
            {formatNumber(
              sharesOpened.length + shareCopies.length + shareNative.length + shareX.length
            )}
          </div>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <h2 className="text-xl font-black">Devices</h2>
          <div className="mt-5 space-y-3">
            {pickTop(devices).map(([label, value]) => (
              <div key={label} className="flex items-center justify-between">
                <span className="capitalize text-white/70">{label}</span>
                <span className="font-bold">{formatNumber(value)}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <h2 className="text-xl font-black">Browsers</h2>
          <div className="mt-5 space-y-3">
            {pickTop(browsers).map(([label, value]) => (
              <div key={label} className="flex items-center justify-between">
                <span className="capitalize text-white/70">{label}</span>
                <span className="font-bold">{formatNumber(value)}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <h2 className="text-xl font-black">Countries</h2>
          <div className="mt-5 space-y-3">
            {pickTop(countries).map(([label, value]) => (
              <div key={label} className="flex items-center justify-between">
                <span className="uppercase text-white/70">{label}</span>
                <span className="font-bold">{formatNumber(value)}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <h2 className="text-xl font-black">Referrers</h2>
          <div className="mt-5 space-y-3">
            {pickTop(referrers).map(([label, value]) => (
              <div key={label} className="flex items-center justify-between gap-4">
                <span className="truncate text-white/70">{label}</span>
                <span className="font-bold">{formatNumber(value)}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-white/10 bg-white/5 p-6">
        <h2 className="text-xl font-black">Top clicked links</h2>
        <div className="mt-5 space-y-3">
          {pickTop(links, 10).map(([label, value]) => (
            <div key={label} className="flex items-center justify-between gap-4">
              <span className="truncate text-white/70">{label}</span>
              <span className="font-bold">{formatNumber(value)}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-white/10 bg-white/5 p-6">
        <h2 className="text-xl font-black">Share breakdown</h2>
        <div className="mt-5 grid gap-4 md:grid-cols-4">
          <div className="rounded-xl border border-white/10 bg-black/20 p-4">
            <div className="text-xs uppercase tracking-[0.18em] text-white/45">Opened</div>
            <div className="mt-2 text-2xl font-black">{formatNumber(sharesOpened.length)}</div>
          </div>
          <div className="rounded-xl border border-white/10 bg-black/20 p-4">
            <div className="text-xs uppercase tracking-[0.18em] text-white/45">Copied</div>
            <div className="mt-2 text-2xl font-black">{formatNumber(shareCopies.length)}</div>
          </div>
          <div className="rounded-xl border border-white/10 bg-black/20 p-4">
            <div className="text-xs uppercase tracking-[0.18em] text-white/45">Native</div>
            <div className="mt-2 text-2xl font-black">{formatNumber(shareNative.length)}</div>
          </div>
          <div className="rounded-xl border border-white/10 bg-black/20 p-4">
            <div className="text-xs uppercase tracking-[0.18em] text-white/45">X shares</div>
            <div className="mt-2 text-2xl font-black">{formatNumber(shareX.length)}</div>
          </div>
        </div>
      </section>
    </DashboardShell>
  );
}
