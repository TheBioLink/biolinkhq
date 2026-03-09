// src/app/account/page.js
import DashboardShell from "@/components/dashboard/DashboardShell";
import UsernameForm from "@/components/forms/UsernameForm";
import BanPanel from "@/components/admin/BanPanel";
import AccountEditor from "@/components/dashboard/AccountEditor";

import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import mongoose from "mongoose";
import { Page } from "@/models/Page";

export default async function AccountPage() {
  const session = await getServerSession(authOptions);
  const email = (session?.user?.email || "").toLowerCase().trim();

  if (!email) return null;

  await mongoose.connect(process.env.MONGO_URI);
  const page = await Page.findOne({ owner: email }).lean();
  const username = page?.uri || "";

  const isFounderAdmin = email === "mrrunknown44@gmail.com";

  if (!username) {
    return (
      <DashboardShell
        title="Pick your username"
        subtitle="This becomes your public link."
      >
        <div className="rounded-2xl border border-white/10 bg-white/5 p-8">
          <UsernameForm desiredUsername="" />
        </div>

        {isFounderAdmin && <BanPanel />}
      </DashboardShell>
    );
  }

  return (
    <DashboardShell
      title="My Page"
      subtitle="Update your profile, buttons and links."
    >
      <AccountEditor page={page} user={session.user} />

      {isFounderAdmin && <BanPanel />}
    </DashboardShell>
  );
}
