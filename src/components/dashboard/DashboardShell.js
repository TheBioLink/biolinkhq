// src/components/dashboard/DashboardShell.js
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export default async function DashboardShell({ title, subtitle, children }) {
  // Ensure the user is authenticated (if required elsewhere)
  await getServerSession(authOptions);

  return (
    <div className="min-h-screen bg-[#060b14] text-white">
      <div className="mx-auto min-h-screen max-w-[1400px] px-8 py-10">
        <h1 className="text-5xl font-black">{title}</h1>
        {subtitle && <p className="mt-3 text-white/55">{subtitle}</p>}
        <div className="mt-10 space-y-8">{children}</div>
      </div>
    </div>
  );
}
