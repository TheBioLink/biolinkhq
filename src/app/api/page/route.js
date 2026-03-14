import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import mongoose from "mongoose";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { Page } from "@/models/Page";

// simple username sanitizer
function sanitizeUri(input) {
  return (input || "")
    .toString()
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, "")
    .slice(0, 30);
}

export async function POST(req) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const owner = session.user.email;
  const body = await req.json();

  await mongoose.connect(process.env.MONGO_URI);

  // If updating username/uri, enforce uniqueness
  if (body?.uri) {
    const uri = sanitizeUri(body.uri);
    if (!uri || uri.length < 2) {
      return NextResponse.json({ error: "Invalid username" }, { status: 400 });
    }

    const taken = await Page.findOne({ uri, owner: { $ne: owner } });
    if (taken) {
      return NextResponse.json({ error: "Username already taken" }, { status: 409 });
    }

    body.uri = uri;
  }

  // Security: never allow changing owner via client
  delete body.owner;
  delete body._id;

  const page = await Page.findOneAndUpdate(
    { owner },
    { owner, ...body },
    { upsert: true, new: true }
  );

  return NextResponse.json({ ok: true, page });
}
