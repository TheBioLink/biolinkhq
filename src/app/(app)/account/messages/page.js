import DashboardShell from "@/components/dashboard/DashboardShell";
import MessagesClient from "@/components/messages/MessagesClient";

export default function MessagesPage() {
  return (
    <DashboardShell
      title="Messages"
      subtitle="Auto deletes in 1 hour"
      activeTab="messages"
    >
      <MessagesClient />
    </DashboardShell>
  );
}
