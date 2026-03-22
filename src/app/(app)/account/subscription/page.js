// src/app/account/subscription/page.js
import DashboardShell from "@/components/dashboard/DashboardShell";
import PremiumTab from "@/components/dashboard/PremiumTab";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { Page } from "@/models/Page";
import {
  connectDb,
  ensurePermanentExclusiveForPage,
  normalizeEmail,
} from "@/libs/stripe-subscriptions";

/**
 * Compute the actual subscription status for a Page
 * Adapts logic from computeSubscriptionStatus
 */
function computePageSubscriptionStatus(page) {
  const now = new Date();

  // Permanent exclusive plan → always active
  if (page.permanentPlan === "exclusive") return "active";

  const sub = {
    trial_end: page.stripeTrialEndsAt,
    current_period_end: page.stripeCurrentPeriodEnd,
    has_paid:
      ["active", "past_due"].includes(page.stripeSubscriptionStatus) ||
      page.stripeCurrentPlan !== "free",
    cancelled_at: page.stripeSubscriptionStatus === "canceled" ? now : null,
  };

  // Cancelled always wins
  if (sub.cancelled_at) return "canceled";

  // Trial still active
  if (sub.trial_end && now < new Date(sub.trial_end)) return "trialing";

  // Trial ended and not paid → expired
  if (!sub.has_paid && (!sub.trial_end || now > new Date(sub.trial_end))) return "expired";

  // Paid + still within current period → active
  if (sub.has_paid && sub.current_period_end && now < new Date(sub.current_period_end))
    return "active";

  // Paid but period expired → past_due
  if (sub.has_paid && sub.current_period_end && now > new Date(sub.current_period_end))
    return "past_due";

  // Fallback
  return "expired";
}

export default async function SubscriptionPage() {
  const session = await getServerSession(authOptions);
  const email = normalizeEmail(session?.user?.email);
  if (!email) return null;

  await connectDb();

  // Fetch page and ensure permanent exclusive plan if applicable
  let page = await Page.findOne({ owner: email });
  page = await ensurePermanentExclusiveForPage(page);

  const plainPage = page?.toObject ? page.toObject() : page;

  // Compute real subscription status
  const subscriptionStatus = computePageSubscriptionStatus(plainPage);

  // Determine whether to show active subscription or renew prompt
  const hasActiveSub = ["active", "trialing", "past_due"].includes(subscriptionStatus);

  return (
    <DashboardShell
      title="Subscription"
      subtitle="Manage your plan, billing and cancellation."
      activeTab="subscriptions"
    >
      <PremiumTab
        page={plainPage}
        hasActiveSub={hasActiveSub}
        subscriptionStatus={subscriptionStatus} // pass down for renew UI
      />
    </DashboardShell>
  );
}
