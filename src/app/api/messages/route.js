import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { getMessageModel } from "@/models/Message";
import { getMessageReportModel } from "@/models/MessageReport";
import { Page } from "@/models/Page";
import { User } from "@/models/User";
import mongoose from "mongoose";

export const runtime = "nodejs";

const norm = (s) => (s || "").toString().toLowerCase().trim();
const searchSafe = (s) => norm(s).replace(/[^a-z0-9_\- .]/g, "").slice(0, 40);

async function connectMainDb() {
  if (mongoose.connection.readyState !== 1) {
    await mongoose.connect(process.env.MONGO_URI);
  }
}

export async function PUT(req) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await connectMainDb();

  const { query } = await req.json();
  const q = searchSafe(query);
  if (!q) return NextResponse.json({ users: [] });

  const users = await Page.find({
    $or: [
      { uri: { $regex: q, $options: "i" } },
      { displayName: { $regex: q, $options: "i" } },
    ],
  })
    .select("uri displayName profileImage isTeam")
    .limit(10)
    .lean();

  return NextResponse.json({
    users: users.map((u) => ({
      uri: u.uri,
      username: u.uri,
      displayName: u.displayName || u.uri,
      profileImage: u.profileImage || "",
      isTeam: !!u.isTeam,
    })),
  });
}

export async function GET(req) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const Message = await getMessageModel();

  const { searchParams } = new URL(req.url);
  const username = searchParams.get("user");

  const meEmail = norm(session.user.email);

  if (!username) {
    const recent = await Message.find({
      $or: [{ fromEmail: meEmail }, { toEmail: meEmail }],
    })
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();

    const latest = new Map();

    for (const m of recent) {
      const other =
        m.fromEmail === meEmail ? m.toEmail : m.fromEmail;
      if (!latest.has(other)) latest.set(other, m);
    }

    await connectMainDb();

    const pages = await Page.find({
      owner: { $in: Array.from(latest.keys()) },
    })
      .select("uri owner displayName profileImage")
      .lean();

    const map = new Map(pages.map((p) => [norm(p.owner), p]));

    const conversations = Array.from(latest.keys())
      .map((email) => {
        const page = map.get(email);
        if (!page) return null;

        const msg = latest.get(email);

        return {
          uri: page.uri,
          username: page.uri,
          displayName: page.displayName || page.uri,
          profileImage: page.profileImage || "",
          lastMessage: msg.body,
          updatedAt: msg.createdAt,
        };
      })
      .filter(Boolean);

    return NextResponse.json({ conversations });
  }

  await connectMainDb();

  const target = await Page.findOne({ uri: norm(username) }).lean();
  if (!target) return NextResponse.json({ messages: [] });

  const otherEmail = norm(target.owner);

  const messages = await Message.find({
    $or: [
      { fromEmail: meEmail, toEmail: otherEmail },
      { fromEmail: otherEmail, toEmail: meEmail },
    ],
  })
    .sort({ createdAt: 1 })
    .limit(50)
    .lean();

  return NextResponse.json({
    messages: messages.map((m) => ({
      id: String(m._id),
      body: m.body,
      isMine: m.fromEmail === meEmail,
      createdAt: m.createdAt,
    })),
    target: {
      uri: target.uri,
      username: target.uri,
      displayName: target.displayName || target.uri,
      profileImage: target.profileImage || "",
    },
  });
}

export async function POST(req) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const Message = await getMessageModel();

  const { username, body } = await req.json();
  const clean = String(body || "").trim().slice(0, 1000);

  if (!username || !clean)
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });

  await connectMainDb();

  const target = await Page.findOne({ uri: norm(username) }).lean();
  if (!target)
    return NextResponse.json({ error: "User not found" }, { status: 404 });

  await Message.create({
    fromEmail: norm(session.user.email),
    toEmail: norm(target.owner),
    body: clean,
  });

  return NextResponse.json({ ok: true });
}
