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

function computePageSubscriptionStatus(page) {
  const now = new Date();

  if (page.permanentPlan === "exclusive") return "active";

  const sub = {
    trial_end: page.stripeTrialEndsAt,
    current_period_end: page.stripeCurrentPeriodEnd,
    has_paid:
      ["active", "past_due"].includes(page.stripeSubscriptionStatus) ||
      page.stripeCurrentPlan !== "free",
    cancelled_at: page.stripeSubscriptionStatus === "canceled" ? now : null,
  };

  if (sub.cancelled_at) return "canceled";
  if (sub.trial_end && now < new Date(sub.trial_end)) return "trialing";
  if (!sub.has_paid && (!sub.trial_end || now > new Date(sub.trial_end))) return "expired";
  if (sub.has_paid && sub.current_period_end && now < new Date(sub.current_period_end)) return "active";
  if (sub.has_paid && sub.current_period_end && now > new Date(sub.current_period_end)) return "past_due";

  return "expired";
}

export default async function SubscriptionPage() {
  const session = await getServerSession(authOptions);
  const email = normalizeEmail(session?.user?.email);
  if (!email) return null;

  await connectDb();

  let page = await Page.findOne({ owner: email });
  page = await ensurePermanentExclusiveForPage(page);

  const plainPage = page?.toObject ? page.toObject() : page;
  const subscriptionStatus = computePageSubscriptionStatus(plainPage);
  const hasActiveSub = ["active", "trialing", "past_due"].includes(subscriptionStatus);

  return (
    <DashboardShell
      title="Subscription"
      subtitle="Manage your plan, billing, and features."
      activeTab="subscription"
    >
      <PremiumTab
        page={plainPage}
        hasActiveSub={hasActiveSub}
        subscriptionStatus={subscriptionStatus}
      />
    </DashboardShell>
  );
}
