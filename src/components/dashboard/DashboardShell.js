// src/components/dashboard/DashboardShell.js
import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import mongoose from "mongoose";
import { Page } from "@/models/Page";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faFileLines,
  faChartLine,
  faArrowRightFromBracket,
  faBird,
  faFlag,
  faCrown,
  faTag,
} from "@fortawesome/free-solid-svg-icons";

function navClass(active) {
  return active
    ? "flex items-center gap-2 rounded-2xl px-4 py-3 text-blue-300 bg-blue-500/15 font-bold"
    : "flex items-center gap-2 rounded-2xl px-4 py-3 text-white/65 hover:bg-white/5 hover:text-white transition";
}

function mobileNavClass(active) {
  return active
    ? "flex min-w-[72px] flex-col items-center justify-center gap-1 rounded-2xl bg-blue-500/15 px-3 py-2 text-blue-300 text-xs font-bold"
    : "flex min-w-[72px] flex-col items-center justify-center gap-1 rounded-2xl px-3 py-2 text-white/55 hover:bg-white/5 hover:text-white text-xs transition";
}

// Bird icon SVG as a component since fa-bird may not be in free solid
function BirdIcon({ className = "h-4 w-4" }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor">
      <path d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z" />
    </svg>
  );
}

export default async function DashboardShell({
  title,
  subtitle,
  activeTab = "page",
  children,
}) {
  const session = await getServerSession(authOptions);
  const email = (session?.user?.email || "").toLowerCase().trim();

  let page = null;
  if (email) {
    if (mongoose.connection.readyState !== 1) {
      await mongoose.connect(process.env.MONGO_URI);
    }
    page = await Page.findOne({ owner: email }).lean();
  }

  const isAdmin = page?.uri === "itsnicbtw";

  const links = [
    { href: "/account", label: "My Page", icon: faFileLines, tab: "page", useFA: true },
    { href: "/account/biotweet", label: "BioTweet", icon: null, tab: "biotweet", useFA: false },
    { href: "/account/badges", label: "Badges", icon: faFlag, tab: "badges", useFA: true },
    { href: "/account/analytics", label: "Analytics", icon: faChartLine, tab: "analytics", useFA: true },
    { href: "/account/subscription", label: "Subscription", icon: faCrown, tab: "subscription", useFA: true },
    ...(isAdmin
      ? [
          { href: "/account/articles", label: "Articles", icon: faFileLines, tab: "articles", useFA: true },
          { href: "/account/reports", label: "Reports", icon: faFlag, tab: "reports", useFA: true },
          { href: "/account/promo", label: "Promo Codes", icon: faTag, tab: "promo", useFA: true },
        ]
      : []),
  ];

  const profileHref = page?.uri ? "/" + page.uri : "/account";

  return (
    <div className="min-h-screen bg-[#0a0f1a] pb-24 text-white lg:pb-0">
      <div className="mx-auto flex max-w-7xl gap-6 px-3 py-4 sm:px-4 sm:py-6 lg:px-8">

        {/* Desktop Sidebar */}
        <aside className="hidden w-64 shrink-0 lg:block">
          <div className="sticky top-6 rounded-3xl border border-white/10 bg-white/5 p-5">

            {session?.user && (
              <div className="mb-5 flex items-center gap-3 px-2">
                {session.user.image && (
                  <img
                    src={session.user.image}
                    alt=""
                    className="h-9 w-9 rounded-full object-cover ring-1 ring-white/10"
                  />
                )}
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-white">
                    {session.user.name || page?.uri || ""}
                  </p>
                  {page?.uri && (
                    <p className="truncate text-xs text-white/40">
                      {"@" + page.uri}
                    </p>
                  )}
                </div>
              </div>
            )}

            <nav className="space-y-1">
              {links.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={navClass(activeTab === item.tab)}
                >
                  {item.useFA ? (
                    <FontAwesomeIcon icon={item.icon} className="h-4 w-4 shrink-0" />
                  ) : (
                    <BirdIcon className="h-4 w-4 shrink-0" />
                  )}
                  <span>{item.label}</span>
                </Link>
              ))}

              <div className="my-2 border-t border-white/10" />

              {page?.uri && (
                <a
                  href={profileHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={navClass(false)}
                >
                  <FontAwesomeIcon icon={faFileLines} className="h-4 w-4 shrink-0" />
                  <span>View Profile</span>
                </a>
              )}

              <Link href="/api/auth/signout" className={navClass(false)}>
                <FontAwesomeIcon icon={faArrowRightFromBracket} className="h-4 w-4 shrink-0" />
                <span>Logout</span>
              </Link>
            </nav>
          </div>
        </aside>

        {/* Main content */}
        <main className="min-w-0 flex-1 rounded-3xl border border-white/10 bg-white/5 p-4 sm:p-5 md:p-8">
          <h1 className="text-2xl font-black tracking-tight sm:text-3xl">
            {title}
          </h1>
          {subtitle && (
            <p className="mt-2 text-sm text-white/60">{subtitle}</p>
          )}
          <div className="mt-6 sm:mt-8">{children}</div>
        </main>
      </div>

      {/* Mobile bottom nav */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 flex items-center justify-around border-t border-white/10 bg-[#0a0f1a]/95 px-2 py-2 backdrop-blur-xl lg:hidden">
        {links.slice(0, 5).map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={mobileNavClass(activeTab === item.tab)}
          >
            {item.useFA ? (
              <FontAwesomeIcon icon={item.icon} className="h-5 w-5" />
            ) : (
              <BirdIcon className="h-5 w-5" />
            )}
            <span>{item.label}</span>
          </Link>
        ))}
        <Link href="/api/auth/signout" className={mobileNavClass(false)}>
          <FontAwesomeIcon icon={faArrowRightFromBracket} className="h-5 w-5" />
          <span>Logout</span>
        </Link>
      </nav>
    </div>
  );
}
