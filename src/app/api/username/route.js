import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { Page } from "@/models/Page";

export async function POST(req) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { username } = await req.json();
  const uri = (username || "").trim().toLowerCase();

  if (!uri || uri.length < 2) {
    return NextResponse.json({ error: "Invalid username" }, { status: 400 });
  }

  await mongoose.connect(process.env.MONGO_URI);

  const exists = await Page.findOne({ uri });
  if (exists) {
    return NextResponse.json(
      { error: "Username already taken" },
      { status: 409 }
    );
  }

  const owner = session.user.email;

  await Page.findOneAndUpdate(
    { owner },
    { owner, uri },
    { upsert: true, new: true }
  );

  return NextResponse.json({ ok: true, uri });
}
