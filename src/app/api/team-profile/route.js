import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import mongoose from "mongoose";
import { Page } from "@/models/Page";
import { getTeamProfileModel } from "@/models/TeamProfile";

export async function POST(req) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const email = session.user.email.toLowerCase();

  await mongoose.connect(process.env.MONGO_URI);

  const page = await Page.findOne({ owner: email });

  if (!page?.isTeam) {
    return NextResponse.json({ error: "Not a team profile" }, { status: 403 });
  }

  const data = await req.json();

  const TeamProfile = await getTeamProfileModel();

  const updated = await TeamProfile.findOneAndUpdate(
    { ownerEmail: email },
    {
      ownerEmail: email,
      tagline: data.tagline || "",
      description: data.description || "",
      game: data.game || "",
      region: data.region || "",
      recruiting: Boolean(data.recruiting),
      members: Array.isArray(data.members) ? data.members : [],
    },
    { upsert: true, new: true }
  );

  return NextResponse.json({ ok: true, team: updated });
}

export async function PATCH(req) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (session.user.email !== "mrrunknown44@gmail.com") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { targetEmail, isTeam } = await req.json();

  await mongoose.connect(process.env.MONGO_URI);

  await Page.updateOne(
    { owner: targetEmail },
    { $set: { isTeam: Boolean(isTeam) } }
  );

  return NextResponse.json({ ok: true });
}
