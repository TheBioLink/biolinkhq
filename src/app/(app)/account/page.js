import DashboardShell from "@/components/dashboard/DashboardShell";

// import your existing components:
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

  // If your auth redirects elsewhere, keep your existing logic.
  if (!email) {
    return (
      <DashboardShell
        username=""
        title="My Page"
        subtitle="Sign in to manage your page."
      >
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <p className="text-gray-300">You must be signed in.</p>
        </div>
      </DashboardShell>
    );
  }

  await mongoose.connect(process.env.MONGO_URI);
  const page = await Page.findOne({ owner: email }).lean();

  const username = page?.uri || "";

  // If no username yet, show the username picker in a clean card
  if (!username) {
    return (
      <DashboardShell
        username=""
        title="Pick your username"
        subtitle="This becomes your public link."
      >
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <UsernameForm desiredUsername="" />
        </div>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell
      username={username}
      title="My Page"
      subtitle="Update your profile, buttons, and links. Changes are live instantly."
    >
      <section className="rounded-2xl border border-white/10 bg-white/5 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-extrabold">Profile</h2>
          <a
            href={`/${username}`}
            className="text-sm text-blue-400 hover:text-blue-300 underline"
          >
            View public page →
          </a>
        </div>
        <PageSettingsForm page={page} user={session.user} />
      </section>

      <section className="rounded-2xl border border-white/10 bg-white/5 p-6">
        <h2 className="text-lg font-extrabold mb-4">Buttons</h2>
        <p className="text-sm text-gray-400 mb-4">
          These show as small round icons under your bio.
        </p>
        <PageButtonsForm page={page} />
      </section>

      <section className="rounded-2xl border border-white/10 bg-white/5 p-6">
        <h2 className="text-lg font-extrabold mb-4">Links</h2>
        <p className="text-sm text-gray-400 mb-4">
          These show as link cards on your public page.
        </p>
        <PageLinksForm page={page} />
      </section>
    </DashboardShell>
  );
}
