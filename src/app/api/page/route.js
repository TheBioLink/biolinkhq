import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { Page } from "@/models/Page";

export async function POST(req) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();

  await mongoose.connect(process.env.MONGO_URI);

  const owner = session.user.email;

  // if user is setting username/uri
  if (body.uri) {
    const uri = body.uri.trim().toLowerCase();
    const taken = await Page.findOne({ uri, owner: { $ne: owner } });
    if (taken) return NextResponse.json({ error: "Username already taken" }, { status: 409 });
  }

  const page = await Page.findOneAndUpdate(
    { owner },
    { owner, ...body },
    { upsert: true, new: true }
  );

  return NextResponse.json({ ok: true, page });
}
