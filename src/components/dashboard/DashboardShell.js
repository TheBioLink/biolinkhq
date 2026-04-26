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
    ? "flex items-center gap-3 rounded-xl px-4 py-3 text-blue-400 bg-blue-500/10 font-bold"
    : "flex items-center gap-3 rounded-xl px-4 py-3 text-white/70 hover:bg-white/5 hover:text-white transition";
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
    await mongoose.connect(process.env.MONGO_URI);
    page = await Page.findOne({ owner: email }).lean();
  }

  const isAdmin = page?.uri === "itsnicbtw";

  return (
    <div className="min-h-screen bg-[#0a0f1a] text-white">
      <div className="mx-auto flex max-w-7xl gap-6 px-4 py-6 lg:px-8">
        <aside className="hidden w-72 shrink-0 rounded-3xl border border-white/10 bg-white/5 p-5 lg:block">
          <nav className="space-y-2">
            <Link href="/account" className={navClass(activeTab === "page")}> 
              <FontAwesomeIcon icon={faFileLines} className="h-4 w-4" />
              <span>My Page</span>
            </Link>

            <Link href="/account/messages" className={navClass(activeTab === "messages")}>
              <FontAwesomeIcon icon={faCommentDots} className="h-4 w-4" />
              <span>Messages</span>
            </Link>

            {isAdmin && (
              <Link href="/account/reports" className={navClass(activeTab === "reports")}>
                <FontAwesomeIcon icon={faFlag} className="h-4 w-4" />
                <span>Reports</span>
              </Link>
            )}

            <Link href="/account/analytics" className={navClass(activeTab === "analytics")}> 
              <FontAwesomeIcon icon={faChartLine} className="h-4 w-4" />
              <span>Analytics</span>
            </Link>

            <Link href="/api/auth/signout" className={navClass(false)}>
              <FontAwesomeIcon icon={faArrowRightFromBracket} className="h-4 w-4" />
              <span>Logout</span>
            </Link>
          </nav>
        </aside>
        <main className="min-w-0 flex-1 rounded-3xl border border-white/10 bg-white/5 p-5 md:p-8">
          <h1 className="text-3xl font-black tracking-tight">{title}</h1>
          {subtitle && <p className="mt-2 text-sm text-white/60">{subtitle}</p>}
          <div className="mt-8">{children}</div>
        </main>
      </div>
    </div>
  );
}
