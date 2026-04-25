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
    .select("uri displayName profileImage")
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

  if (searchParams.get("blocked") === "1") {
    const meUser = await User.findOne({ email: meEmail }).select("blockedUsers").lean();
    const blockedEmails = (meUser?.blockedUsers || []).map(norm);

    const pages = await Page.find({ owner: { $in: blockedEmails } })
      .select("uri owner displayName profileImage")
      .lean();

    return NextResponse.json({
      blocked: pages.map((p) => ({
        username: p.uri,
        displayName: p.displayName || p.uri,
        profileImage: p.profileImage || "",
      })),
    });
  }

  if (!username) {
    const recent = await Message.find({
      $or: [{ fromEmail: meEmail }, { toEmail: meEmail }],
    })
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();

    const latestByEmail = new Map();

    for (const msg of recent) {
      const otherEmail = norm(msg.fromEmail === meEmail ? msg.toEmail : msg.fromEmail);
      if (!latestByEmail.has(otherEmail)) {
        latestByEmail.set(otherEmail, msg);
      }
    }

    const meUser = await User.findOne({ email: meEmail }).select("blockedUsers").lean();
    const blockedSet = new Set((meUser?.blockedUsers || []).map(norm));
    const otherEmails = Array.from(latestByEmail.keys()).filter((email) => !blockedSet.has(email));

    const pages = await Page.find({ owner: { $in: otherEmails } })
      .select("uri owner displayName profileImage")
      .lean();

    const pageByOwner = new Map(pages.map((p) => [norm(p.owner), p]));

    const conversations = otherEmails
      .map((email) => {
        const page = pageByOwner.get(email);
        const msg = latestByEmail.get(email);
        if (!page) return null;

        return {
          username: page.uri,
          displayName: page.displayName || page.uri,
          profileImage: page.profileImage || "",
          lastMessage: msg.body,
          isMine: msg.fromEmail === meEmail,
          updatedAt: msg.createdAt,
        };
      })
      .filter(Boolean);

    return NextResponse.json({ conversations });
  }

  const targetPage = await Page.findOne({ uri: username }).lean();
  if (!targetPage) return NextResponse.json({ messages: [] });

  const otherEmail = norm(targetPage.owner);

  const meUser = await User.findOne({ email: meEmail }).lean();
  if (meUser?.blockedUsers?.includes(otherEmail)) {
    return NextResponse.json({ messages: [], blocked: true });
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

  return NextResponse.json({
    messages: formatted,
    blocked: false,
    target: {
      username: targetPage.uri,
      displayName: targetPage.displayName || targetPage.uri,
      profileImage: targetPage.profileImage || "",
    },
  });
}

export async function POST(req) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await mongoose.connect(process.env.MONGO_URI);

  const { username, body } = await req.json();

  if (!username || !body?.trim()) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

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

  await Message.create({ fromEmail: meEmail, toEmail: otherEmail, body: body.trim() });

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
  if (!targetPage) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const meEmail = norm(session.user.email);
  const otherEmail = norm(targetPage.owner);

  if (action === "block") {
    await User.updateOne(
      { email: meEmail },
      { $addToSet: { blockedUsers: otherEmail } },
      { upsert: true }
    );
    return NextResponse.json({ ok: true });
  }

  if (action === "unblock") {
    await User.updateOne(
      { email: meEmail },
      { $pull: { blockedUsers: otherEmail } }
    );
    return NextResponse.json({ ok: true });
  }

  if (action === "report") {
    const recentMessages = await Message.find({
      $or: [
        { fromEmail: meEmail, toEmail: otherEmail },
        { fromEmail: otherEmail, toEmail: meEmail },
      ],
    })
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();

    await MessageReport.create({
      reporterEmail: meEmail,
      reporterUsername: (await Page.findOne({ owner: meEmail }).lean())?.uri || "",
      reportedEmail: otherEmail,
      reportedUsername: targetPage.uri,
      reason,
      recentMessages: recentMessages.reverse().map((m) => ({
        fromUsername: m.fromEmail === meEmail ? "reporter" : targetPage.uri,
        body: m.body,
        createdAt: m.createdAt,
      })),
    });
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ ok: false });
}
