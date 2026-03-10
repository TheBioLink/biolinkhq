// src/components/dashboard/DashboardShell.js
import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { Page } from "@/models/Page";
import mongoose from "mongoose";

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

  return (
    <div className="min-h-screen bg-[#060b14] text-white">
      <div className="mx-auto flex min-h-screen max-w-[1400px]">
        {/* Sidebar */}
        <aside className="w-[260px] border-r border-white/10 bg-white/[0.03] px-6 py-8">
          <div className="mb-8">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-indigo-500/80 text-4xl font-black">
              {(session?.user?.name || session?.user?.email || "U")
                .slice(0, 1)
                .toUpperCase()}
            </div>

            <div className="mt-5 text-lg font-bold">
              /{page?.uri || "account"}
            </div>
          </div>

          {/* NAVIGATION */}
          <nav className="space-y-2">
            <Link href="/account" className={navClass(activeTab === "page")}>
              My Page
            </Link>

            <Link
              href="/account/analytics"
              className={navClass(activeTab === "analytics")}
            >
              Analytics
            </Link>

            {showSubscription && (
              <Link
                href="/account/subscription"
                className={navClass(activeTab === "subscription")}
              >
                Subscription
              </Link>
            )}

            <Link href="/api/auth/signout" className={navClass(false)}>
              Logout
            </Link>
          </nav>

          <div className="mt-8 border-t border-white/10 pt-6">
            <Link
              href="/"
              className="text-sm text-white/55 hover:text-white transition"
            >
              ← Back to website
            </Link>
          </div>
        </aside>

        {/* MAIN */}
        <main className="flex-1 px-8 py-10">
          <h1 className="text-5xl font-black">{title}</h1>

          {subtitle && (
            <p className="mt-3 text-white/55">{subtitle}</p>
          )}

          <div className="mt-10 space-y-8">{children}</div>
        </main>
      </div>
    </div>
  );
}
