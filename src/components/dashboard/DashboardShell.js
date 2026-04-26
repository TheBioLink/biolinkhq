import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { Page } from "@/models/Page";
import mongoose from "mongoose";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faFileLines,
  faChartLine,
  faArrowRightFromBracket,
  faCommentDots,
  faFlag,
} from "@fortawesome/free-solid-svg-icons";

function navClass(active) {
  return active
    ? "flex items-center gap-2 rounded-2xl px-4 py-3 text-blue-300 bg-blue-500/15 font-bold"
    : "flex items-center gap-2 rounded-2xl px-4 py-3 text-white/65 hover:bg-white/5 hover:text-white transition";
}

function mobileNavClass(active) {
  return active
    ? "flex min-w-[92px] flex-col items-center justify-center gap-1 rounded-2xl bg-blue-500/15 px-3 py-2 text-blue-300"
    : "flex min-w-[92px] flex-col items-center justify-center gap-1 rounded-2xl px-3 py-2 text-white/55 hover:bg-white/5 hover:text-white";
}

export default async function DashboardShell({ title, subtitle, activeTab = "page", children }) {
  const session = await getServerSession(authOptions);
  const email = (session?.user?.email || "").toLowerCase().trim();
  let page = null;
  if (email) {
    await mongoose.connect(process.env.MONGO_URI);
    page = await Page.findOne({ owner: email }).lean();
  }

  const isAdmin = page?.uri === "itsnicbtw";

  const links = [
    { href: "/account", label: "My Page", icon: faFileLines, tab: "page" },
    { href: "/account/messages", label: "Messages", icon: faCommentDots, tab: "messages" },
    { href: "/account/badges", label: "Badges", icon: faFlag, tab: "badges" },
    ...(isAdmin ? [{ href: "/account/articles", label: "Articles", icon: faFileLines, tab: "articles" }] : []),
    ...(isAdmin ? [{ href: "/account/reports", label: "Reports", icon: faFlag, tab: "reports" }] : []),
    { href: "/account/analytics", label: "Analytics", icon: faChartLine, tab: "analytics" },
  ];

  return (
    <div className="min-h-screen bg-[#0a0f1a] pb-24 text-white lg:pb-0">
      <div className="mx-auto flex max-w-7xl gap-6 px-3 py-4 sm:px-4 sm:py-6 lg:px-8">
        <aside className="hidden w-72 shrink-0 rounded-3xl border border-white/10 bg-white/5 p-5 lg:block">
          <nav className="space-y-2">
            {links.map((item) => (
              <Link key={item.href} href={item.href} className={navClass(activeTab === item.tab)}>
                <FontAwesomeIcon icon={item.icon} className="h-4 w-4" />
                <span>{item.label}</span>
              </Link>
            ))}

            <Link href="/api/auth/signout" className={navClass(false)}>
              <FontAwesomeIcon icon={faArrowRightFromBracket} className="h-4 w-4" />
              <span>Logout</span>
            </Link>
          </nav>
        </aside>

        <main className="min-w-0 flex-1 rounded-3xl border border-white/10 bg-white/5 p-4 sm:p-5 md:p-8">
          <h1 className="text-2xl font-black tracking-tight sm:text-3xl">{title}</h1>
          {subtitle && <p className="mt-2 text-sm text-white/60">{subtitle}</p>}
          <div className="mt-6 sm:mt-8">{children}</div>
        </main>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-white/10 bg-[#090d16]/95 px-2 py-2 shadow-2xl backdrop-blur-xl lg:hidden">
        <div className="flex gap-2 overflow-x-auto pb-1">
          {links.map((item) => (
            <Link key={item.href} href={item.href} className={mobileNavClass(activeTab === item.tab)}>
              <FontAwesomeIcon icon={item.icon} className="h-4 w-4" />
              <span className="text-[11px] font-bold">{item.label}</span>
            </Link>
          ))}
          <Link href="/api/auth/signout" className={mobileNavClass(false)}>
            <FontAwesomeIcon icon={faArrowRightFromBracket} className="h-4 w-4" />
            <span className="text-[11px] font-bold">Logout</span>
          </Link>
        </div>
      </nav>
    </div>
  );
}
