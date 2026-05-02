// src/app/api/discord/disconnect/route.js
// Removes the Discord link for the authenticated user

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { getDiscordLinkModel } from "@/models/DiscordLink";

export const runtime = "nodejs";

const norm = (s) => (s || "").toString().toLowerCase().trim();

export async function POST() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const ownerEmail = norm(session.user.email);

  try {
    const DiscordLink = await getDiscordLinkModel();

    const link = await DiscordLink.findOne({ ownerEmail }).lean();

    if (!link) {
      return NextResponse.json({ ok: true, message: "Not linked" });
    }

    // Attempt to revoke the token on Discord's side (best-effort)
    if (link.accessToken) {
      fetch("https://discord.com/api/oauth2/token/revoke", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          client_id: process.env.CLIENT_ID,
          client_secret: process.env.CLIENT_SECRET,
          token: link.accessToken,
        }),
      }).catch(() => {}); // fire-and-forget, don't block disconnect
    }

    await DiscordLink.deleteOne({ ownerEmail });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Discord disconnect error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// GET: returns the current linked Discord info for the dashboard
export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const ownerEmail = norm(session.user.email);

  try {
    const DiscordLink = await getDiscordLinkModel();
    const link = await DiscordLink.findOne({ ownerEmail }).lean();

    if (!link) {
      return NextResponse.json({ linked: false });
    }

    return NextResponse.json({
      linked: true,
      discordId: link.discordId,
      discordUsername: link.discordUsername,
      discordGlobalName: link.discordGlobalName,
      discordAvatarUrl: link.discordAvatarUrl,
      onlineStatus: link.onlineStatus,
      showStatus: link.showStatus,
      showUsername: link.showUsername,
      showDiscordId: link.showDiscordId,
      linkedAt: link.createdAt,
    });
  } catch (err) {
    console.error("Discord info GET error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
