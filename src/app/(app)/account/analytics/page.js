// src/app/(app)/account/analytics/page.js
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

function getPercentage(value, total) {
  if (!total) return 0;
  return Math.round((value / total) * 100);
}

function StatCard({ label, value, sub, accent = "blue" }) {
  const accents = {
    blue: "border-blue-500/20 from-blue-500/10",
    emerald: "border-emerald-500/20 from-emerald-500/10",
    purple: "border-purple-500/20 from-purple-500/10",
    amber: "border-amber-500/20 from-amber-500/10",
  };
  return (
    <div className={`rounded-2xl border bg-gradient-to-b ${accents[accent]} to-white/[0.02] p-6`}>
      <div className="text-xs font-black uppercase tracking-[0.18em] text-white/40">{label}</div>
      <div className="mt-3 text-4xl font-black tabular-nums text-white">{value}</div>
      {sub && <div className="mt-1 text-xs text-white/35">{sub}</div>}
    </div>
  );
}

function BarRow({ label, value, max, total }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  const share = getPercentage(value, total);
  return (
    <div className="group">
      <div className="mb-1.5 flex items-center justify-between gap-3">
        <span className="truncate text-sm text-white/70">{label}</span>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs text-white/35">{share}%</span>
          <span className="text-sm font-bold text-white">{formatNumber(value)}</span>
        </div>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/[0.06]">
        <div
          className="h-full rounded-full bg-gradient-to-r from-blue-500 to-blue-400 transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
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

  const totalShares = sharesOpened.length + shareCopies.length + shareNative.length + shareX.length;

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

  const topDevices = pickTop(devices);
  const topBrowsers = pickTop(browsers);
  const topCountries = pickTop(countries);
  const topReferrers = pickTop(referrers);
  const topLinks = pickTop(links, 10);

  const totalDeviceEvents = topDevices.reduce((s, [, v]) => s + v, 0);
  const totalBrowserEvents = topBrowsers.reduce((s, [, v]) => s + v, 0);
  const totalCountryEvents = topCountries.reduce((s, [, v]) => s + v, 0);
  const totalReferrerEvents = topReferrers.reduce((s, [, v]) => s + v, 0);
  const totalLinkEvents = topLinks.reduce((s, [, v]) => s + v, 0);

  const ctr = pageViews.length > 0
    ? ((clicks.length / pageViews.length) * 100).toFixed(1)
    : "0.0";

  return (
    <DashboardShell
      title="Analytics"
      subtitle="Privacy-safe profile analytics — last 30 days"
      activeTab="analytics"
    >
      <div className="space-y-6">

        {/* Key metrics */}
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Page views" value={formatNumber(pageViews.length)} sub="Last 30 days" accent="blue" />
          <StatCard label="Unique visitors" value={formatNumber(uniqueVisitors)} sub={`${getPercentage(uniqueVisitors, pageViews.length)}% of views`} accent="emerald" />
          <StatCard label="Outbound clicks" value={formatNumber(clicks.length)} sub={`${ctr}% click-through rate`} accent="purple" />
          <StatCard label="Total shares" value={formatNumber(totalShares)} sub="Across all share methods" accent="amber" />
        </div>

        {/* Share breakdown inline */}
        <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6">
          <h2 className="mb-5 text-base font-black uppercase tracking-[0.15em] text-white/50">Share breakdown</h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {[
              { label: "Opened", value: sharesOpened.length, color: "text-blue-300" },
              { label: "Link copied", value: shareCopies.length, color: "text-emerald-300" },
              { label: "Native share", value: shareNative.length, color: "text-purple-300" },
              { label: "Shared to X", value: shareX.length, color: "text-amber-300" },
            ].map(({ label, value, color }) => (
              <div key={label} className="rounded-xl border border-white/10 bg-black/20 p-4 text-center">
                <div className={`text-2xl font-black ${color}`}>{formatNumber(value)}</div>
                <div className="mt-1 text-xs text-white/40">{label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Audience grid */}
        <div className="grid gap-5 lg:grid-cols-2">

          {/* Devices */}
          <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-base font-black">Devices</h2>
              <span className="text-xs text-white/30">{formatNumber(totalDeviceEvents)} events</span>
            </div>
            <div className="space-y-4">
              {topDevices.length === 0 ? (
                <p className="text-sm text-white/30">No data yet.</p>
              ) : topDevices.map(([label, value]) => (
                <BarRow
                  key={label}
                  label={label.charAt(0).toUpperCase() + label.slice(1)}
                  value={value}
                  max={topDevices[0][1]}
                  total={totalDeviceEvents}
                />
              ))}
            </div>
          </div>

          {/* Browsers */}
          <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-base font-black">Browsers</h2>
              <span className="text-xs text-white/30">{formatNumber(totalBrowserEvents)} events</span>
            </div>
            <div className="space-y-4">
              {topBrowsers.length === 0 ? (
                <p className="text-sm text-white/30">No data yet.</p>
              ) : topBrowsers.map(([label, value]) => (
                <BarRow
                  key={label}
                  label={label.charAt(0).toUpperCase() + label.slice(1)}
                  value={value}
                  max={topBrowsers[0][1]}
                  total={totalBrowserEvents}
                />
              ))}
            </div>
          </div>

          {/* Countries */}
          <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-base font-black">Countries</h2>
              <span className="text-xs text-white/30">{formatNumber(totalCountryEvents)} events</span>
            </div>
            <div className="space-y-4">
              {topCountries.length === 0 ? (
                <p className="text-sm text-white/30">No data yet.</p>
              ) : topCountries.map(([label, value]) => (
                <BarRow
                  key={label}
                  label={label.toUpperCase()}
                  value={value}
                  max={topCountries[0][1]}
                  total={totalCountryEvents}
                />
              ))}
            </div>
          </div>

          {/* Referrers */}
          <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-base font-black">Referrers</h2>
              <span className="text-xs text-white/30">{formatNumber(totalReferrerEvents)} events</span>
            </div>
            <div className="space-y-4">
              {topReferrers.length === 0 ? (
                <p className="text-sm text-white/30">No data yet.</p>
              ) : topReferrers.map(([label, value]) => (
                <BarRow
                  key={label}
                  label={label}
                  value={value}
                  max={topReferrers[0][1]}
                  total={totalReferrerEvents}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Top links */}
        {topLinks.length > 0 && (
          <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-base font-black">Top clicked links</h2>
              <span className="text-xs text-white/30">{formatNumber(totalLinkEvents)} total clicks</span>
            </div>
            <div className="space-y-4">
              {topLinks.map(([label, value]) => (
                <BarRow
                  key={label}
                  label={label}
                  value={value}
                  max={topLinks[0][1]}
                  total={totalLinkEvents}
                />
              ))}
            </div>
          </div>
        )}

        {/* Empty state */}
        {events.length === 0 && (
          <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-10 text-center">
            <div className="text-4xl mb-3">📊</div>
            <h3 className="text-lg font-black text-white">No data yet</h3>
            <p className="mt-2 text-sm text-white/45">
              Analytics will appear here once people start visiting your profile.
            </p>
          </div>
        )}
      </div>
    </DashboardShell>
  );
}
