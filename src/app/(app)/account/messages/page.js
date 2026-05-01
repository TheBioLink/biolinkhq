import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import MessagesClient from "@/components/messages/MessagesClient";

export default async function MessagesPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <MessagesClient />
    </div>
  );
}
