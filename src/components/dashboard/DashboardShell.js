// src/components/dashboard/DashboardShell.js
import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { Page } from "@/models/Page";
import { connectDb, ensurePermanentExclusiveForPage } from "@/libs/stripe-subscriptions";

function itemClass(active) {
  return active
    ? "flex items-center gap-3 rounded-xl px-4 py-3 text-blue-400 bg-blue-500/10 font-bold"
    : "flex items-center gap-3 rounded-xl px-4 py-3 text-white/75 hover:bg-white/5";
}

export default async function DashboardShell({
  title,
  subtitle,
  activeTab = "page",
  children,
}) {
  const session = await getServerSession(authOptions);
  const email = String(session?.user?.email || "").toLowerCase().trim();

  let page = null;
  if (email) {
    await connectDb();
    page = await Page.findOne({ owner: email });
    page = await ensurePermanentExclusiveForPage(page);
  }

  const showSubscriptionTab =
    page?.permanentPlan === "exclusive" ||
    ["active", "trialing", "past_due"].includes(
      String(page?.stripeSubscriptionStatus || "").toLowerCase()
    );

  return (
    <div className="min-h-screen bg-[#060b14] text-white">
      <div className="mx-auto flex min-h-screen max-w-[1400px]">
        <aside className="w-[260px] border-r border-white/10 bg-white/[0.03] px-6 py-8">
          <div className="mb-8">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-indigo-500/80 text-4xl font-black">
              {(session?.user?.name || session?.user?.email || "U").slice(0, 1).toUpperCase()}
            </div>
            <div className="mt-5 text-lg font-bold">
              /{page?.uri || "account"}
            </div>
          </div>

          <nav className="space-y-2">
            <Link href="/account" className={itemClass(activeTab === "page")}>
              My Page
            </Link>

            <Link
              href="/account/analytics"
              className={itemClass(activeTab === "analytics")}
            >
              Analytics
            </Link>

            {showSubscriptionTab ? (
              <Link
                href="/account/subscription"
                className={itemClass(activeTab === "subscription")}
              >
                Subscription
              </Link>
            ) : null}
          </nav>

          <div className="mt-8 border-t border-white/10 pt-6">
            <Link href="/" className="text-sm text-white/55 hover:text-white">
              ← Back to website
            </Link>
          </div>
        </aside>

        <main className="flex-1 px-8 py-10">
          <h1 className="text-5xl font-black">{title}</h1>
          {subtitle ? (
            <p className="mt-3 text-white/55">{subtitle}</p>
          ) : null}
          <div className="mt-10 space-y-8">{children}</div>
        </main>
      </div>
    </div>
  );
}
