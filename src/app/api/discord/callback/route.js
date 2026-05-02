// src/app/api/discord/callback/route.js
// Handles the OAuth2 callback from Discord, exchanges code for tokens,
// fetches the Discord user profile, and stores everything in D_MONGO_URI

import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { Page } from "@/models/Page";
import { getDiscordLinkModel } from "@/models/DiscordLink";

export const runtime = "nodejs";

const norm = (s) => (s || "").toString().toLowerCase().trim();

function buildAvatarUrl(discordId, avatarHash) {
  if (!avatarHash) return "";
  const ext = avatarHash.startsWith("a_") ? "gif" : "png";
  return `https://cdn.discordapp.com/avatars/${discordId}/${avatarHash}.${ext}?size=256`;
}

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");

  const baseUrl =
    process.env.NEXTAUTH_URL ||
    req.headers.get("origin") ||
    "http://biolinkhq.lol";

  // User denied access on Discord's side
  if (error) {
    return NextResponse.redirect(`${baseUrl}/account?discord=denied`);
  }

  if (!code || !state) {
    return NextResponse.redirect(`${baseUrl}/account?discord=error&reason=missing_params`);
  }

  // Decode the owner email from state
  let ownerEmail;
  try {
    ownerEmail = norm(Buffer.from(state, "base64").toString("utf8"));
  } catch {
    return NextResponse.redirect(`${baseUrl}/account?discord=error&reason=bad_state`);
  }

  if (!ownerEmail) {
    return NextResponse.redirect(`${baseUrl}/account?discord=error&reason=no_email`);
  }

  const clientId = process.env.CLIENT_ID;
  const clientSecret = process.env.CLIENT_SECRET;
  const redirectUri = `${baseUrl}/api/discord/callback`;

  if (!clientId || !clientSecret) {
    return NextResponse.redirect(`${baseUrl}/account?discord=error&reason=missing_env`);
  }

  try {
    // ── 1. Exchange code for access token ──────────────────────────────────
    const tokenRes = await fetch("https://discord.com/api/oauth2/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        grant_type: "authorization_code",
        code,
        redirect_uri: redirectUri,
      }),
    });

    if (!tokenRes.ok) {
      const errText = await tokenRes.text().catch(() => "unknown");
      console.error("Discord token exchange failed:", errText);
      return NextResponse.redirect(`${baseUrl}/account?discord=error&reason=token_exchange`);
    }

    const tokenData = await tokenRes.json();
    const {
      access_token: accessToken,
      refresh_token: refreshToken,
      expires_in: expiresIn,
      scope: tokenScopes,
    } = tokenData;

    const tokenExpiresAt = new Date(Date.now() + expiresIn * 1000);

    // ── 2. Fetch Discord user profile ──────────────────────────────────────
    const userRes = await fetch("https://discord.com/api/users/@me", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!userRes.ok) {
      return NextResponse.redirect(`${baseUrl}/account?discord=error&reason=fetch_user`);
    }

    const discordUser = await userRes.json();

    const discordId = discordUser.id;
    const discordUsername = discordUser.username || "";
    const discordGlobalName = discordUser.global_name || discordUser.username || "";
    const discordAvatarHash = discordUser.avatar || "";
    const discordAvatarUrl = buildAvatarUrl(discordId, discordAvatarHash);

    // ── 3. Look up the page URI for this owner (from MONGO_URI) ───────────
    if (mongoose.connection.readyState !== 1) {
      await mongoose.connect(process.env.MONGO_URI);
    }

    const page = await Page.findOne({ owner: ownerEmail }).lean();
    const pageUri = page?.uri || "";

    // ── 4. Check if this discordId is already linked to a DIFFERENT account ──
    const DiscordLink = await getDiscordLinkModel();

    const existingOtherLink = await DiscordLink.findOne({
      discordId,
      ownerEmail: { $ne: ownerEmail },
    }).lean();

    if (existingOtherLink) {
      return NextResponse.redirect(
        `${baseUrl}/account?discord=error&reason=already_linked_to_another_account`
      );
    }

    // ── 5. Upsert the DiscordLink document in D_MONGO_URI ─────────────────
    await DiscordLink.findOneAndUpdate(
      { ownerEmail },
      {
        $set: {
          ownerEmail,
          pageUri,
          discordId,
          discordUsername,
          discordGlobalName,
          discordAvatar: discordAvatarHash,
          discordAvatarUrl,
          accessToken,
          refreshToken,
          tokenExpiresAt,
          tokenScopes: tokenScopes || "",
          // Reset status so it refreshes on next public view
          onlineStatus: "unknown",
          lastStatusRefresh: null,
        },
      },
      { upsert: true, new: true }
    );

    return NextResponse.redirect(`${baseUrl}/account?discord=connected`);
  } catch (err) {
    console.error("Discord callback error:", err);
    return NextResponse.redirect(`${baseUrl}/account?discord=error&reason=server_error`);
  }
}
