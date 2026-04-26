import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import mongoose from "mongoose";
import { Page } from "@/models/Page";
import DashboardShell from "@/components/dashboard/DashboardShell";
import ReportsClient from "@/components/messages/ReportsClient";

export default async function ReportsPage() {
  const session = await getServerSession(authOptions);
  const email = (session?.user?.email || "").toLowerCase().trim();

  await mongoose.connect(process.env.MONGO_URI);
  const page = await Page.findOne({ owner: email }).lean();

  if (!page || page.uri !== "itsnicbtw") {
    return (
      <DashboardShell title="Reports" subtitle="Restricted access">
        <div className="rounded-3xl border border-red-500/20 bg-red-500/5 p-8 text-center text-red-300">
          You do not have permission to view reports.
        </div>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell
      title="Reports"
      subtitle="Moderation panel for message reports"
      activeTab="reports"
    >
      <ReportsClient />
    </DashboardShell>
  );
}
