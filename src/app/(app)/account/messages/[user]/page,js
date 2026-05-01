import DashboardShell from "@/components/dashboard/DashboardShell";
import MessagesClient from "@/components/messages/MessagesClient";

export default function UserMessagePage({ params }) {
  return (
    <DashboardShell
      title={`Chat with ${params.user}`}
      subtitle="Direct messages"
      activeTab="messages"
    >
      <MessagesClient username={params.user} />
    </DashboardShell>
  );
}
