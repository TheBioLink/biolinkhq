import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { Message } from "@/models/Message";
import { Page } from "@/models/Page";

export const runtime = "nodejs";

const norm = (s) => (s || "").toLowerCase().trim();

// SEARCH USERS BY USERNAME
export async function PUT(req) {
  await mongoose.connect(process.env.MONGO_URI);
  const { query } = await req.json();

  const users = await Page.find({
    uri: { $regex: query, $options: "i" },
  })
    .select("uri owner")
    .limit(10)
    .lean();

  return NextResponse.json({ users });
}

// GET MESSAGES
export async function GET(req) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await mongoose.connect(process.env.MONGO_URI);

  const { searchParams } = new URL(req.url);
  const username = searchParams.get("user");

  if (!username) return NextResponse.json({ messages: [] });

  const targetPage = await Page.findOne({ uri: username }).lean();
  if (!targetPage) return NextResponse.json({ messages: [] });

  const me = norm(session.user.email);
  const other = norm(targetPage.owner);

  const messages = await Message.find({
    $or: [
      { fromEmail: me, toEmail: other },
      { fromEmail: other, toEmail: me },
    ],
  })
    .sort({ createdAt: 1 })
    .limit(50)
    .lean();

  return NextResponse.json({ messages, target: username });
}

// SEND MESSAGE
export async function POST(req) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await mongoose.connect(process.env.MONGO_URI);

  const { username, body } = await req.json();

  const targetPage = await Page.findOne({ uri: username }).lean();
  if (!targetPage) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  await Message.create({
    fromEmail: norm(session.user.email),
    toEmail: norm(targetPage.owner),
    body,
  });

  return NextResponse.json({ ok: true });
}
