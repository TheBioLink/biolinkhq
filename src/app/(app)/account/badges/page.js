import BadgesClient from "@/components/badges/BadgesClient";
import DashboardShell from "@/components/dashboard/DashboardShell";

export default function BadgesPage(){
  return (
    <DashboardShell title="Badges" activeTab="badges">
      <BadgesClient />
    </DashboardShell>
  );
}
