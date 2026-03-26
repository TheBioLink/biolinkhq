// src/app/account/page.js
import DashboardShell from "@/components/dashboard/DashboardShell";
import UsernameForm from "@/components/forms/UsernameForm";
import PageSettingsForm from "@/components/forms/PageSettingsForm";
import PageButtonsForm from "@/components/forms/PageButtonsForm";
import PageLinksForm from "@/components/forms/PageLinksForm";
import BanPanel from "@/components/admin/BanPanel";

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
        activeTab="page"
      >
        <div className="rounded-2xl border border-white/10 bg-white/5 p-8">
          <UsernameForm desiredUsername="" />
        </div>

        {isFounderAdmin ? <BanPanel /> : null}
      </DashboardShell>
    );
  }

  return (
    <DashboardShell
      title="My Page"
      subtitle="Update your profile, buttons and links."
      activeTab="page"
    >
      <section className="rounded-2xl border border-white/10 bg-white/5 p-8">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-xl font-extrabold">Profile</h2>

          <a
            href={`/${username}`}
            className="text-sm text-blue-400 underline hover:text-blue-300"
          >
            View public page →
          </a>
        </div>

        <PageSettingsForm page={page} user={session.user} />
      </section>

      <section className="rounded-2xl border border-white/10 bg-white/5 p-8">
        <h2 className="mb-3 text-xl font-extrabold">Buttons</h2>

        <p className="mb-6 text-sm text-gray-400">
          Small circular icons shown under your bio.
        </p>

        <PageButtonsForm page={page} />
      </section>

      <section className="rounded-2xl border border-white/10 bg-white/5 p-8">
        <h2 className="mb-3 text-xl font-extrabold">Links</h2>

        <p className="mb-6 text-sm text-gray-400">
          Clickable cards displayed on your public page.
        </p>

        <PageLinksForm page={page} />
      </section>

      {isFounderAdmin ? <BanPanel /> : null}
    </DashboardShell>
  );
}
