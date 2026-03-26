import DashboardShell from "@/components/dashboard/DashboardShell";
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

  if (!email) return null;

  await mongoose.connect(process.env.MONGO_URI);

  const page = await Page.findOne({ owner: email }).lean();

  if (!page?.uri) {
    return (
      <DashboardShell title="Pick username">
        <UsernameForm />
      </DashboardShell>
    );
  }

  return (
    <DashboardShell title="My Page">
      <PageSettingsForm page={page} user={session.user} />
      <PageButtonsForm page={page} />
      <PageLinksForm page={page} />
    </DashboardShell>
  );
}
