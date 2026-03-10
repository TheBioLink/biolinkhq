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

export default async function SubscriptionPage() {
  const session = await getServerSession(authOptions);
  const email = normalizeEmail(session?.user?.email);

  if (!email) return null;

  await connectDb();

  let page = await Page.findOne({ owner: email });
  page = await ensurePermanentExclusiveForPage(page);

  const plainPage = page?.toObject ? page.toObject() : page;

  return (
    <DashboardShell
      title="Subscription"
      subtitle="Manage your plan, billing and cancellation."
      activeTab="subscription"
    >
      <PremiumTab page={plainPage} />
    </DashboardShell>
  );
}
