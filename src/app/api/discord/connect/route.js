// src/app/api/discord/connect/route.js
// Redirects the authenticated user to Discord's OAuth2 authorization page

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export const runtime = "nodejs";

export async function GET(req) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const clientId = process.env.CLIENT_ID;

  if (!clientId) {
    return NextResponse.json(
      { error: "Discord CLIENT_ID not configured" },
      { status: 500 }
    );
  }

  const baseUrl =
    process.env.NEXTAUTH_URL ||
    req.headers.get("origin") ||
    "http://biolinkhq.lol";

  const redirectUri = `${baseUrl}/api/discord/callback`;

  // Scopes:
  //   identify  → basic profile (id, username, avatar, global_name)
  //   guilds.members.read (optional) — not needed for this feature
  // We intentionally do NOT request "bot" or "guilds" scope
  const scopes = ["identify"].join(" ");

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: scopes,
    // Pass the user's email as state so we know who to link on callback
    state: Buffer.from(session.user.email).toString("base64"),
  });

  const discordAuthUrl = `https://discord.com/oauth2/authorize?${params.toString()}`;

  return NextResponse.redirect(discordAuthUrl);
}
