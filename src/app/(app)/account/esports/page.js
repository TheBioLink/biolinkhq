import DashboardShell from "@/components/dashboard/DashboardShell";
import EsportsProfileForm from "@/components/forms/EsportsProfileForm";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import mongoose from "mongoose";
import { ensureUserPsid } from "@/lib/psid";
import { getLinkedProfileModel } from "@/models/LinkedProfile";

export default async function EsportsAccountPage() {
  const session = await getServerSession(authOptions);
  const email = (session?.user?.email || "").toLowerCase().trim();

  if (!email) return null;

  await mongoose.connect(process.env.MONGO_URI);
  const psid = await ensureUserPsid(email);

  const LinkedProfile = await getLinkedProfileModel();
  const profile = await LinkedProfile.findOne({ psid }).lean();

  return (
    <DashboardShell
      title="Esports Identity"
      subtitle="A privacy-first scouting profile linked to your BioLink account."
      activeTab="esports"
    >
      <EsportsProfileForm initialProfile={profile} psid={psid} />
    </DashboardShell>
  );
}
