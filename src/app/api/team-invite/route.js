import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import mongoose from "mongoose";
import { Page } from "@/models/Page";
import { getTeamInviteModel, getTeamProfileModel } from "@/models/TeamProfile";
import { getBadgeModels } from "@/models/Badge";

const norm = (value) => (value || "").toString().toLowerCase().trim();
const cleanText = (value, max = 80) => String(value || "").trim().slice(0, max);

async function connectMainDb() {
  if (mongoose.connection.readyState !== 1) {
    await mongoose.connect(process.env.MONGO_URI);
  }
}

async function getCurrentPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return { error: "Unauthorized", status: 401 };

  await connectMainDb();

  const email = norm(session.user.email);
  const page = await Page.findOne({ owner: email }).lean();

  return { email, page };
}

export async function GET() {
  try {
    const ctx = await getCurrentPage();
    if (ctx.error) return NextResponse.json({ error: ctx.error }, { status: ctx.status });

    const TeamInvite = await getTeamInviteModel();
    const invites = await TeamInvite.find({ targetEmail: ctx.email, status: "pending" })
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({ ok: true, invites });
  } catch (error) {
    console.error("Team invite GET error:", error);
    return NextResponse.json({ error: "Failed to load invites", details: error?.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const ctx = await getCurrentPage();
    if (ctx.error) return NextResponse.json({ error: ctx.error }, { status: ctx.status });

    if (!ctx.page?.isTeam) {
      return NextResponse.json({ error: "Only team profiles can invite players" }, { status: 403 });
    }

    const body = await req.json();
    const targetUri = norm(body.targetUri);
    const role = cleanText(body.role || "Player", 40);

    if (!targetUri) {
      return NextResponse.json({ error: "Enter a player username" }, { status: 400 });
    }

    if (targetUri === norm(ctx.page.uri)) {
      return NextResponse.json({ error: "You cannot invite your own team profile" }, { status: 400 });
    }

    const targetPage = await Page.findOne({ uri: targetUri }).lean();
    if (!targetPage?.owner) {
      return NextResponse.json({ error: "Player profile not found" }, { status: 404 });
    }

    const TeamInvite = await getTeamInviteModel();

    const existing = await TeamInvite.findOne({
      teamOwnerEmail: ctx.email,
      targetEmail: norm(targetPage.owner),
      status: "pending",
    }).lean();

    if (existing) {
      return NextResponse.json({ error: "This player already has a pending invite" }, { status: 409 });
    }

    await TeamInvite.create({
      teamOwnerEmail: ctx.email,
      teamUri: ctx.page.uri,
      teamName: ctx.page.displayName || ctx.page.uri,
      teamLogo: ctx.page.profileImage || "",
      targetEmail: norm(targetPage.owner),
      targetUri: targetPage.uri,
      targetProfileUrl: `/${targetPage.uri}`,
      role,
      badgeTagline: `Verified player for ${ctx.page.displayName || ctx.page.uri}`,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Team invite POST error:", error);
    return NextResponse.json({ error: "Failed to send invite", details: error?.message }, { status: 500 });
  }
}

export async function PATCH(req) {
  try {
    const ctx = await getCurrentPage();
    if (ctx.error) return NextResponse.json({ error: ctx.error }, { status: ctx.status });

    const { inviteId, action } = await req.json();
    const TeamInvite = await getTeamInviteModel();
    const invite = await TeamInvite.findById(inviteId);

    if (!invite || invite.targetEmail !== ctx.email || invite.status !== "pending") {
      return NextResponse.json({ error: "Invite not found" }, { status: 404 });
    }

    if (action === "decline") {
      invite.status = "declined";
      invite.respondedAt = new Date();
      await invite.save();
      return NextResponse.json({ ok: true });
    }

    if (action !== "accept") {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    const TeamProfile = await getTeamProfileModel();

    const teamProfile = await TeamProfile.findOneAndUpdate(
      { ownerEmail: invite.teamOwnerEmail },
      { $setOnInsert: { ownerEmail: invite.teamOwnerEmail, members: [] } },
      { upsert: true, new: true }
    );

    const alreadyMember = teamProfile.members?.some(
      (member) => norm(member.ownerEmail) === ctx.email || norm(member.profileUri) === norm(ctx.page?.uri)
    );

    let badgeId = invite.badgeId || "";

    if (!alreadyMember) {
      const { BadgeModel, UserBadgeModel } = await getBadgeModels();
      const badgeKey = `team_player_${norm(invite.teamOwnerEmail)}`;

      let badge = await BadgeModel.findOne({ badgeKey });

      if (!badge) {
        badge = await BadgeModel.findOne({
          createdBy: invite.teamOwnerEmail,
          name: `${invite.teamName || invite.teamUri} Player`,
        });
      }

      if (!badge) {
        badge = await BadgeModel.create({
          name: `${invite.teamName || invite.teamUri} Player`,
          icon: invite.teamLogo || "",
          type: "private",
          createdBy: invite.teamOwnerEmail,
          badgeKey,
          tagline: invite.badgeTagline || `Verified player for ${invite.teamName || invite.teamUri}`,
          targetUri: invite.teamUri,
          targetUrl: `/${invite.teamUri}`,
          isActive: true,
          isCustom: false,
        });
      } else {
        badge.badgeKey = badge.badgeKey || badgeKey;
        badge.tagline = badge.tagline || invite.badgeTagline || `Verified player for ${invite.teamName || invite.teamUri}`;
        badge.targetUri = badge.targetUri || invite.teamUri;
        badge.targetUrl = badge.targetUrl || `/${invite.teamUri}`;
        if (!badge.icon && invite.teamLogo) badge.icon = invite.teamLogo;
        await badge.save();
      }

      badgeId = String(badge._id);

      await UserBadgeModel.updateOne(
        { badgeId: badge._id, ownerEmail: ctx.email },
        { $setOnInsert: { visible: true, grantedBy: invite.teamOwnerEmail } },
        { upsert: true }
      );

      await TeamProfile.updateOne(
        { ownerEmail: invite.teamOwnerEmail },
        {
          $push: {
            members: {
              username: ctx.page?.displayName || ctx.page?.uri || invite.targetUri,
              role: invite.role || "Player",
              ownerEmail: ctx.email,
              profileUri: ctx.page?.uri || invite.targetUri,
              profileUrl: `/${ctx.page?.uri || invite.targetUri}`,
              verified: true,
              badgeId,
              badgeTagline: invite.badgeTagline || `Verified player for ${invite.teamName || invite.teamUri}`,
              acceptedAt: new Date(),
            },
          },
        }
      );
    }

    invite.status = "accepted";
    invite.badgeId = badgeId;
    invite.respondedAt = new Date();
    await invite.save();

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Team invite PATCH error:", error);
    return NextResponse.json({ error: "Failed to respond to invite", details: error?.message }, { status: 500 });
  }
}
