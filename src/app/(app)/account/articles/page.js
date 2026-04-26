import DashboardShell from "@/components/dashboard/DashboardShell";
import ArticlesClient from "@/components/articles/ArticlesClient";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { Page } from "@/models/Page";
import { getServerSession } from "next-auth";
import mongoose from "mongoose";
import Link from "next/link";

const norm = (value) => (value || "").toString().toLowerCase().trim();

export const metadata = {
  title: "Articles | BioLinkHQ",
};

export default async function AccountArticlesPage() {
  const session = await getServerSession(authOptions);
  const email = norm(session?.user?.email);

  if (!email) {
    return null;
  }

  if (mongoose.connection.readyState !== 1) {
    await mongoose.connect(process.env.MONGO_URI);
  }

  const page = await Page.findOne({ owner: email }).lean();
  const isAdmin = norm(page?.uri) === "itsnicbtw";

  if (!isAdmin) {
    return (
      <DashboardShell
        title="Articles"
        subtitle="This area is restricted."
        activeTab="articles"
      >
        <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-8 text-white/70">
          <h2 className="text-2xl font-black text-white">Access denied</h2>
          <p className="mt-2 text-sm text-white/55">
            Only the itsnicbtw account can create, edit and remove news articles.
          </p>
          <Link
            href="/account"
            className="mt-5 inline-flex rounded-2xl bg-blue-600 px-5 py-3 text-sm font-black text-white hover:bg-blue-500"
          >
            Back to account
          </Link>
        </div>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell
      title="Articles"
      subtitle="Create, update, publish, draft and delete /news articles."
      activeTab="articles"
    >
      <ArticlesClient />
    </DashboardShell>
  );
}
