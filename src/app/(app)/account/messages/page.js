import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import MessagesClient from "@/components/messages/MessagesClient";

export default async function MessagesPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold mb-6">Messages</h1>
      <MessagesClient username={null} />
    </div>
  );
}
