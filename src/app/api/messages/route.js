import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { Message } from "@/models/Message";
import { Page } from "@/models/Page";
import { User } from "@/models/User";
import { MessageReport } from "@/models/MessageReport";

export const runtime = "nodejs";

const norm = (s) => (s || "").toLowerCase().trim();

export async function PUT(req) {
  await mongoose.connect(process.env.MONGO_URI);
  const { query } = await req.json();

  if (!query) return NextResponse.json({ users: [] });

  const users = await Page.find({ uri: { $regex: query, $options: "i" } })
    .select("uri displayName")
    .limit(10)
    .lean();

  return NextResponse.json({ users });
}

export async function GET(req) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await mongoose.connect(process.env.MONGO_URI);

  const { searchParams } = new URL(req.url);
  const username = searchParams.get("user");

  const meEmail = norm(session.user.email);
  const myPage = await Page.findOne({ owner: meEmail }).lean();

  if (searchParams.get("admin") === "1" && myPage?.uri === "itsnicbtw") {
    const reports = await MessageReport.find({ status: "open" })
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();
    return NextResponse.json({ reports });
  }

  if (!username) return NextResponse.json({ messages: [] });

  const targetPage = await Page.findOne({ uri: username }).lean();
  if (!targetPage) return NextResponse.json({ messages: [] });

  const otherEmail = norm(targetPage.owner);

  const meUser = await User.findOne({ email: meEmail }).lean();
  if (meUser?.blockedUsers?.includes(otherEmail)) {
    return NextResponse.json({ messages: [] });
  }

  const messages = await Message.find({
    $or: [
      { fromEmail: meEmail, toEmail: otherEmail },
      { fromEmail: otherEmail, toEmail: meEmail },
    ],
  })
    .sort({ createdAt: 1 })
    .limit(50)
    .lean();

  const formatted = messages.map((m) => ({
    id: m._id,
    body: m.body,
    isMine: m.fromEmail === meEmail,
    createdAt: m.createdAt,
  }));

  return NextResponse.json({ messages: formatted, target: username });
}

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

  const meEmail = norm(session.user.email);
  const otherEmail = norm(targetPage.owner);

  const meUser = await User.findOne({ email: meEmail }).lean();
  if (meUser?.blockedUsers?.includes(otherEmail)) {
    return NextResponse.json({ error: "User blocked" }, { status: 403 });
  }

  await Message.create({ fromEmail: meEmail, toEmail: otherEmail, body });

  return NextResponse.json({ ok: true });
}

export async function PATCH(req) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await mongoose.connect(process.env.MONGO_URI);

  const { action, username, reason } = await req.json();

  const targetPage = await Page.findOne({ uri: username }).lean();
  if (!targetPage) return NextResponse.json({ error: "User not found" });

  const meEmail = norm(session.user.email);
  const otherEmail = norm(targetPage.owner);

  if (action === "block") {
    await User.updateOne(
      { email: meEmail },
      { $addToSet: { blockedUsers: otherEmail } }
    );
    return NextResponse.json({ ok: true });
  }

  if (action === "report") {
    await MessageReport.create({
      reporterEmail: meEmail,
      reporterUsername: username,
      reportedEmail: otherEmail,
      reportedUsername: username,
      reason,
    });
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ ok: false });
}
