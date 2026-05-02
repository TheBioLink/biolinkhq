import DashboardShell from "@/components/dashboard/DashboardShell";
import PromoCodePanel from "@/components/admin/PromoCodePanel";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { Page } from "@/models/Page";
import mongoose from "mongoose";
import Link from "next/link";

export const metadata = { title: "Promo Codes | BioLinkHQ" };

export default async function PromoPage() {
  const session = await getServerSession(authOptions);
  const email = (session?.user?.email || "").toLowerCase().trim();

  if (!email) return null;

  if (mongoose.connection.readyState !== 1) {
    await mongoose.connect(process.env.MONGO_URI);
  }

  const page = await Page.findOne({ owner: email }).lean();

  if (!page || page.uri !== "itsnicbtw") {
    return (
      <DashboardShell title="Promo Codes" subtitle="Restricted access" activeTab="promo">
        <div className="rounded-3xl border border-red-500/20 bg-red-500/5 p-8 text-center text-red-300">
          You do not have permission to manage promo codes.
        </div>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell
      title="Promo Codes"
      subtitle="Create and manage discount codes for subscriptions and badges."
      activeTab="promo"
    >
      <PromoCodePanel />
    </DashboardShell>
  );
}
