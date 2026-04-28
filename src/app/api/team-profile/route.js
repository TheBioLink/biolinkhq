import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import mongoose from "mongoose";
import { Page } from "@/models/Page";
import { getTeamProfileModel } from "@/models/TeamProfile";

const norm = (value) => (value || "").toString().toLowerCase().trim();
const cleanText = (value, max = 500) => String(value || "").trim().slice(0, max);

async function connectMainDb() {
  if (mongoose.connection.readyState !== 1) {
    await mongoose.connect(process.env.MONGO_URI);
  }
}

async function getContext() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    return { error: "Unauthorized", status: 401 };
  }

  await connectMainDb();

  const email = norm(session.user.email);
  const page = await Page.findOne({ owner: email }).lean();
  const adminUsername = norm(process.env.TEAM_ADMIN_USERNAME || "itsnicbtw");

  return {
    email,
    page,
    isAdmin: norm(page?.uri) === adminUsername,
  };
}

export async function POST(req) {
  try {
    const ctx = await getContext();
    if (ctx.error) return NextResponse.json({ error: ctx.error }, { status: ctx.status });

    if (!ctx.page?.isTeam) {
      return NextResponse.json({ error: "Not a team profile" }, { status: 403 });
    }

    const data = await req.json();
    const TeamProfile = await getTeamProfileModel();

    const updated = await TeamProfile.findOneAndUpdate(
      { ownerEmail: ctx.email },
      {
        ownerEmail: ctx.email,
        tagline: cleanText(data.tagline, 80),
        description: cleanText(data.description, 500),
        game: cleanText(data.game, 60),
        region: cleanText(data.region, 60),
        recruiting: Boolean(data.recruiting),
        members: Array.isArray(data.members)
          ? data.members.slice(0, 50).map((member) => ({
              username: cleanText(member?.username, 40),
              role: cleanText(member?.role, 40),
            }))
          : [],
      },
      { upsert: true, new: true }
    );

    return NextResponse.json({ ok: true, team: updated });
  } catch (error) {
    console.error("Team profile save error:", error);
    return NextResponse.json({ error: "Failed to save team profile", details: error?.message }, { status: 500 });
  }
}

export async function PATCH(req) {
  try {
    const ctx = await getContext();
    if (ctx.error) return NextResponse.json({ error: ctx.error }, { status: ctx.status });
    if (!ctx.isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const body = await req.json();
    const targetEmail = norm(body.targetEmail);
    const targetUri = norm(body.targetUri);
    const isTeam = Boolean(body.isTeam);

    if (!targetEmail && !targetUri) {
      return NextResponse.json({ error: "Enter a target email or username" }, { status: 400 });
    }

    const query = targetEmail ? { owner: targetEmail } : { uri: targetUri };
    const targetPage = await Page.findOne(query);

    if (!targetPage) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    targetPage.isTeam = isTeam;
    await targetPage.save();

    if (isTeam) {
      const TeamProfile = await getTeamProfileModel();
      await TeamProfile.updateOne(
        { ownerEmail: norm(targetPage.owner) },
        { $setOnInsert: { ownerEmail: norm(targetPage.owner), members: [] } },
        { upsert: true }
      );
    }

    return NextResponse.json({
      ok: true,
      profile: {
        uri: targetPage.uri,
        owner: targetPage.owner,
        isTeam: targetPage.isTeam,
      },
    });
  } catch (error) {
    console.error("Team mark error:", error);
    return NextResponse.json({ error: "Failed to update team status", details: error?.message }, { status: 500 });
  }
}
