import DashboardShell from "@/components/dashboard/DashboardShell";
import UsernameForm from "@/components/forms/UsernameForm";
import PageSettingsForm from "@/components/forms/PageSettingsForm";
import PageButtonsForm from "@/components/forms/PageButtonsForm";
import PageLinksForm from "@/components/forms/PageLinksForm";
import BanPanel from "@/components/admin/BanPanel";
import SponsorCreditsPanel from "@/components/dashboard/SponsorCreditsPanel";
import CreditsCard from "@/components/dashboard/CreditsCard";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import mongoose from "mongoose";
import { Page } from "@/models/Page";
import { isItsNic } from "@/libs/credits";
import Link from "next/link";

export default async function AccountPage() {
  const session = await getServerSession(authOptions);
  const email = (session?.user?.email || "").toLowerCase().trim();

  if (!email) return null;

  await mongoose.connect(process.env.MONGO_URI);
  const page = await Page.findOne({ owner: email }).lean();

  const username = page?.uri || "";
  const isFounderAdmin = email === "mrrunknown44@gmail.com";
  const isNic = isItsNic({ email, uri: page?.uri });

  if (!username) {
    return (
      <DashboardShell
        title="Create your page"
        subtitle="Choose a username to get started."
        activeTab="page"
      >
        <div className="space-y-6">
          <UsernameForm username="" />

          <div className="rounded-3xl border border-blue-400/20 bg-blue-500/10 p-6">
            <h2 className="text-2xl font-black text-white">Esports Identity</h2>
            <p className="mt-2 text-white/70">
              After creating your main BioLink username, you can unlock your separate esports profile.
            </p>
          </div>

          {isFounderAdmin ? <BanPanel /> : null}
        </div>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell
      title="My Page"
      subtitle="Manage your main BioLink profile."
      activeTab="page"
    >
      <div className="space-y-6">
        {isNic ? <CreditsCard /> : null}

        <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
          <h2 className="text-2xl font-black text-white">Profile</h2>
          <div className="mt-4">
            <UsernameForm username={username} />
          </div>

          <div className="mt-4">
            <Link
              href={`/${username}`}
              className="inline-flex rounded-2xl border border-white/10 bg-white/5 px-4 py-3 font-bold text-white hover:bg-white/10"
            >
              View public page →
            </Link>
          </div>
        </section>

        <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
          <h2 className="text-2xl font-black text-white">Esports Identity</h2>
          <p className="mt-2 text-white/60">
            Build a privacy-first esports profile for scouting, org discovery, and recruitment.
          </p>

          <div className="mt-4 rounded-2xl border border-amber-300/20 bg-amber-500/10 p-4 text-sm text-amber-200">
            Messaging is coming soon. You can still build and share your esports profile now.
          </div>

          <div className="mt-4">
            <Link
              href="/account/esports"
              className="inline-flex rounded-2xl bg-blue-600 px-4 py-3 font-bold text-white hover:bg-blue-500"
            >
              Open esports profile
            </Link>
          </div>
        </section>

        <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
          <h2 className="text-2xl font-black text-white">Page settings</h2>
          <div className="mt-4">
            <PageSettingsForm page={page} />
          </div>
        </section>

        <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
          <h2 className="text-2xl font-black text-white">Buttons</h2>
          <p className="mt-2 text-white/60">
            Small circular icons shown under your bio.
          </p>
          <div className="mt-4">
            <PageButtonsForm page={page} />
          </div>
        </section>

        <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
          <h2 className="text-2xl font-black text-white">Links</h2>
          <p className="mt-2 text-white/60">
            Clickable cards displayed on your public page.
          </p>
          <div className="mt-4">
            <PageLinksForm page={page} />
          </div>
        </section>

        {isNic ? <SponsorCreditsPanel /> : null}
        {isFounderAdmin ? <BanPanel /> : null}
      </div>
    </DashboardShell>
  );
}
