// src/app/(app)/account/discord-chat/page.js
import DashboardShell from "@/components/dashboard/DashboardShell";
import DiscordChatClient from "@/components/discord-chat/DiscordChatClient";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import { Page } from "@/models/Page";
import mongoose from "mongoose";

export const metadata = { title: "Community Chat | BioLinkHQ" };

export default async function DiscordChatPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  if (mongoose.connection.readyState !== 1) {
    await mongoose.connect(process.env.MONGO_URI);
  }

  const page = await Page.findOne({
    owner: (session.user.email || "").toLowerCase().trim(),
  }).lean();

  const isAdmin = page?.uri === "itsnicbtw";

  return (
    <DashboardShell
      title="Community Chat"
      subtitle="Chat with other BioLinkHQ members in real-time."
      activeTab="discord-chat"
    >
      <DiscordChatClient
        myUri={page?.uri || ""}
        myDisplayName={page?.displayName || page?.uri || ""}
        myProfileImage={page?.profileImage || ""}
        isAdmin={isAdmin}
      />
    </DashboardShell>
  );
}
