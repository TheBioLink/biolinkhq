import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { Page } from "@/models/Page";
import mongoose from "mongoose";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faFileLines,
  faChartLine,
  faCreditCard,
  faArrowRightFromBracket,
  faArrowLeft,
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
  const showSubscription =
    page?.permanentPlan === "exclusive" ||
    ["active", "trialing", "past_due"].includes(
      String(page?.stripeSubscriptionStatus || "").toLowerCase()
    );
  const avatarLetter = (
    session?.user?.name ||
    session?.user?.email ||
    "U"
  )
    .slice(0, 1)
    .toUpperCase();

  return (
    <div className="min-h-screen bg-[#0a0f1a] text-white">
      <div className="mx-auto flex max-w-7xl gap-6 px-4 py-6 lg:px-8">
        <aside className="hidden w-72 shrink-0 rounded-3xl border border-white/10 bg-white/5 p-5 lg:block">
          <div className="mb-6 flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-500/15 text-lg font-black text-blue-300">
              {avatarLetter}
            </div>
            <div>
              <p className="text-sm font-bold text-white">
                {session?.user?.name || "Account"}
              </p>
              <p className="text-xs text-white/50">/{page?.uri || "account"}</p>
            </div>
          </div>
          <nav className="space-y-2">
            <Link href="/account" className={navClass(activeTab === "page")}>
              <FontAwesomeIcon icon={faFileLines} className="h-4 w-4" />
              <span>My Page</span>
            </Link>

            {showSubscription ? (
              <Link
                href="/account/subscriptions"
                className={navClass(activeTab === "subscriptions")}
              >
                <FontAwesomeIcon icon={faCreditCard} className="h-4 w-4" />
                <span>Subscriptions</span>
              </Link>
            ) : null}

            <Link
              href="/account/analytics"
              className={navClass(activeTab === "analytics")}
            >
              <FontAwesomeIcon icon={faChartLine} className="h-4 w-4" />
              <span>Analytics</span>
            </Link>

            <Link href="/api/auth/signout" className={navClass(false)}>
              <FontAwesomeIcon
                icon={faArrowRightFromBracket}
                className="h-4 w-4"
              />
              <span>Logout</span>
            </Link>
          </nav>
          <div className="mt-6 border-t border-white/10 pt-6">
            <Link
              href="/"
              className="flex items-center gap-3 rounded-xl px-4 py-3 text-white/60 hover:bg-white/5 hover:text-white transition"
            >
              <FontAwesomeIcon icon={faArrowLeft} className="h-4 w-4" />
              <span>Back to website</span>
            </Link>
          </div>
        </aside>
        <main className="min-w-0 flex-1 rounded-3xl border border-white/10 bg-white/5 p-5 md:p-8">
          <h1 className="text-3xl font-black tracking-tight">{title}</h1>
          {subtitle ? (
            <p className="mt-2 text-sm text-white/60">{subtitle}</p>
          ) : null}
          <div className="mt-8">{children}</div>
        </main>
      </div>
    </div>
  );
}
