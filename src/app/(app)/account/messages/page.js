import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import DashboardShell from "@/components/dashboard/DashboardShell";
import MessagesClient from "@/components/messages/MessagesClient";

export default async function MessagesPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  return (
    <DashboardShell title="Messages" subtitle="Chat with other users." activeTab="messages">
      <MessagesClient />
    </DashboardShell>
  );
}
