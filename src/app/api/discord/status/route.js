// src/app/api/discord/status/route.js
// GET  ?uri=<pageUri>  → public: returns safe Discord info for a profile page
// POST (authenticated) → refreshes the current user's Discord status from API

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { getDiscordLinkModel } from "@/models/DiscordLink";

export const runtime = "nodejs";

const norm = (s) => (s || "").toString().toLowerCase().trim();

// How long before we re-fetch presence from Discord (60 seconds)
const STATUS_TTL_MS = 60 * 1000;

// ── Token refresh helper ───────────────────────────────────────────────────
async function refreshAccessToken(link) {
  if (!link.refreshToken) return null;

  const res = await fetch("https://discord.com/api/oauth2/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: process.env.CLIENT_ID,
      client_secret: process.env.CLIENT_SECRET,
      grant_type: "refresh_token",
      refresh_token: link.refreshToken,
    }),
  });

  if (!res.ok) return null;

  const data = await res.json();
  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token || link.refreshToken,
    tokenExpiresAt: new Date(Date.now() + data.expires_in * 1000),
  };
}

// ── Fetch current Discord user (refreshes username/avatar too) ────────────
async function fetchDiscordUser(accessToken) {
  const res = await fetch("https://discord.com/api/users/@me", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) return null;
  return res.json();
}

// Note: Online presence (online/idle/dnd) is NOT available via the OAuth2 API
// — it requires a bot with the GUILD_PRESENCES intent in a shared server.
// Without a bot, we store "unknown" for onlineStatus but still show
// username, avatar, and custom status if the user has set one.
// Custom status IS available via /users/@me if the user is in a server
// the bot is in — but not via OAuth alone.
// We surface what we can: username, global name, avatar.

async function refreshDiscordData(link, DiscordLink) {
  try {
    let accessToken = link.accessToken;

    // Refresh token if expired or expiring in the next 5 minutes
    const isExpired =
      !link.tokenExpiresAt ||
      new Date(link.tokenExpiresAt) < new Date(Date.now() + 5 * 60 * 1000);

    if (isExpired) {
      const refreshed = await refreshAccessToken(link);
      if (!refreshed) {
        // Token refresh failed — mark as disconnected
        await DiscordLink.updateOne(
          { ownerEmail: link.ownerEmail },
          { $set: { accessToken: "", refreshToken: "", onlineStatus: "unknown" } }
        );
        return;
      }
      accessToken = refreshed.accessToken;
      await DiscordLink.updateOne(
        { ownerEmail: link.ownerEmail },
        {
          $set: {
            accessToken: refreshed.accessToken,
            refreshToken: refreshed.refreshToken,
            tokenExpiresAt: refreshed.tokenExpiresAt,
          },
        }
      );
    }

    // Fetch fresh user data (updates username/avatar)
    const discordUser = await fetchDiscordUser(accessToken);
    if (!discordUser) return;

    const discordAvatarHash = discordUser.avatar || "";
    const ext = discordAvatarHash.startsWith("a_") ? "gif" : "png";
    const discordAvatarUrl = discordAvatarHash
      ? `https://cdn.discordapp.com/avatars/${discordUser.id}/${discordAvatarHash}.${ext}?size=256`
      : "";

    await DiscordLink.updateOne(
      { ownerEmail: link.ownerEmail },
      {
        $set: {
          discordUsername: discordUser.username || link.discordUsername,
          discordGlobalName:
            discordUser.global_name || discordUser.username || link.discordGlobalName,
          discordAvatar: discordAvatarHash,
          discordAvatarUrl,
          lastStatusRefresh: new Date(),
        },
      }
    );
  } catch (err) {
    console.error("refreshDiscordData error:", err);
  }
}

// ── Public GET: returns safe info for a profile page ──────────────────────
export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const uri = norm(searchParams.get("uri") || "");

  if (!uri) {
    return NextResponse.json({ error: "Missing uri" }, { status: 400 });
  }

  try {
    const DiscordLink = await getDiscordLinkModel();
    const link = await DiscordLink.findOne({ pageUri: uri }).lean();

    if (!link) {
      return NextResponse.json({ linked: false });
    }

    // Refresh in background if stale (non-blocking)
    const isStale =
      !link.lastStatusRefresh ||
      Date.now() - new Date(link.lastStatusRefresh).getTime() > STATUS_TTL_MS;

    if (isStale && link.accessToken) {
      // Fire and forget — we return current cached data immediately
      refreshDiscordData(link, DiscordLink).catch(() => {});
    }

    // Build public-safe response
    const publicData = {
      linked: true,
      discordGlobalName: link.showUsername ? link.discordGlobalName : null,
      discordUsername: link.showUsername ? link.discordUsername : null,
      discordId: link.showDiscordId ? link.discordId : null,
      discordAvatarUrl: link.discordAvatarUrl || null,
      onlineStatus: link.showStatus ? link.onlineStatus : null,
      statusText: link.showStatus ? link.statusText : null,
      statusEmoji: link.showStatus ? link.statusEmoji : null,
    };

    return NextResponse.json(publicData);
  } catch (err) {
    console.error("Discord status GET error:", err);
    return NextResponse.json({ linked: false });
  }
}

// ── Authenticated POST: update privacy settings ───────────────────────────
export async function POST(req) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const ownerEmail = norm(session.user.email);

  try {
    const DiscordLink = await getDiscordLinkModel();
    const body = await req.json().catch(() => ({}));

    const update = {};

    if (typeof body.showStatus === "boolean") update.showStatus = body.showStatus;
    if (typeof body.showUsername === "boolean") update.showUsername = body.showUsername;
    if (typeof body.showDiscordId === "boolean") update.showDiscordId = body.showDiscordId;

    if (Object.keys(update).length === 0) {
      return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
    }

    await DiscordLink.updateOne({ ownerEmail }, { $set: update });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Discord status POST error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
