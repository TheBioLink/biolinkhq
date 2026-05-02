// src/app/(app)/account/biotweet/page.js
import DashboardShell from "@/components/dashboard/DashboardShell";
import BioTweetClient from "@/components/biotweet/BioTweetClient";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import { Page } from "@/models/Page";
import mongoose from "mongoose";

export const metadata = { title: "BioTweet | BioLinkHQ" };

export default async function BioTweetPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  if (mongoose.connection.readyState !== 1) {
    await mongoose.connect(process.env.MONGO_URI);
  }

  const page = await Page.findOne({ owner: session.user.email?.toLowerCase().trim() }).lean();

  return (
    <DashboardShell title="BioTweet" subtitle="The BiolinkHQ mini social feed." activeTab="biotweet">
      <BioTweetClient
        myUri={page?.uri || ""}
        myDisplayName={page?.displayName || page?.uri || ""}
        myProfileImage={page?.profileImage || ""}
      />
    </DashboardShell>
  );
}
