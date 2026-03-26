// src/app/account/page.js

import DashboardShell from "@/components/dashboard/DashboardShell";
import UsernameForm from "@/components/forms/UsernameForm";
import PageSettingsForm from "@/components/forms/PageSettingsForm";
import PageButtonsForm from "@/components/forms/PageButtonsForm";
import PageLinksForm from "@/components/forms/PageLinksForm";

import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import mongoose from "mongoose";
import { Page } from "@/models/Page";

export default async function AccountPage() {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email;

  if (!email) return null;

  await mongoose.connect(process.env.MONGO_URI);

  const page = await Page.findOne({ owner: email }).lean();
  const username = page?.uri;

  if (!username) {
    return (
      <DashboardShell title="Create your page">
        <div className="max-w-xl mx-auto">
          <UsernameForm />
        </div>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell title="Dashboard">
      <div className="max-w-5xl mx-auto space-y-8">

        {/* HEADER */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight">
              Your Page
            </h1>
            <p className="text-white/50 mt-1">
              Manage your profile, design and links
            </p>
          </div>

          <a
            href={`/${username}`}
            target="_blank"
            className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 transition text-sm"
          >
            View Page →
          </a>
        </div>

        {/* PROFILE */}
        <Card title="Profile" desc="Your name, bio and avatar">
          <PageSettingsForm page={page} user={session.user} />
        </Card>

        {/* DESIGN */}
        <Card title="Design" desc="Customize your page appearance">
          <PageSettingsForm page={page} user={session.user} />
        </Card>

        {/* BUTTONS */}
        <Card title="Buttons" desc="Social icons under your bio">
          <PageButtonsForm page={page} />
        </Card>

        {/* LINKS */}
        <Card title="Links" desc="Cards shown on your page">
          <PageLinksForm page={page} />
        </Card>
      </div>
    </DashboardShell>
  );
}

function Card({ title, desc, children }) {
  return (
    <section className="rounded-3xl border border-white/10 bg-gradient-to-b from-white/5 to-white/[0.02] p-6 shadow-xl">
      <div className="mb-6">
        <h2 className="text-xl font-bold">{title}</h2>
        <p className="text-sm text-white/50">{desc}</p>
      </div>

      {children}
    </section>
  );
}
