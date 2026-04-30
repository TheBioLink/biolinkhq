import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { getMessageModel } from "@/models/Message";
import { getMessageReportModel } from "@/models/MessageReport";
import { Page } from "@/models/Page";
import { User } from "@/models/User";
import { Ban } from "@/models/Ban";
import mongoose from "mongoose";

export const runtime = "nodejs";

const norm = (s) => (s || "").toLowerCase().trim();

async function connectMainDb() {
  if (mongoose.connection.readyState !== 1) {
    await mongoose.connect(process.env.MONGO_URI);
  }
}

async function getAdminContext(email) {
  await connectMainDb();
  const myPage = await Page.findOne({ owner: email }).lean();
  return { myPage, isAdmin: myPage?.uri === "itsnicbtw" };
}

export async function GET(req) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const Message = await getMessageModel();
  const MessageReport = await getMessageReportModel();

  const { searchParams } = new URL(req.url);
  const username = searchParams.get("user");

  const meEmail = norm(session.user.email);
  const { isAdmin } = await getAdminContext(meEmail);

  if (searchParams.get("admin") === "1") {
    if (!isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const reports = await MessageReport.find({ status: "open" })
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();
    return NextResponse.json({ reports });
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

    await connectMainDb();

    const meUser = await User.findOne({ email: meEmail }).select("blockedUsers").lean();
    const blockedSet = new Set((meUser?.blockedUsers || []).map(norm));

    const otherEmails = Array.from(latestByEmail.keys()).filter((email) => !blockedSet.has(email));

    const pages = await Page.find({ owner: { $in: otherEmails } })
      .select("uri owner displayName profileImage")
      .lean();

    const pageByOwner = new Map(pages.map((p) => [norm(p.owner), p]));

    const conversations = otherEmails.map((email) => {
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
    }).filter(Boolean);

    return NextResponse.json({ conversations });
  }

  await connectMainDb();

  const targetPage = await Page.findOne({ uri: username }).lean();
  if (!targetPage) return NextResponse.json({ messages: [] });

  const otherEmail = norm(targetPage.owner);

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
      id: m._id,
      body: m.body,
      isMine: m.fromEmail === meEmail,
      createdAt: m.createdAt,
    })),
  });
}

export async function POST(req) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const Message = await getMessageModel();

  const { username, body } = await req.json();

  await connectMainDb();

  const targetPage = await Page.findOne({ uri: username }).lean();
  if (!targetPage) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const meEmail = norm(session.user.email);
  const otherEmail = norm(targetPage.owner);

  await Message.create({
    fromEmail: meEmail,
    toEmail: otherEmail,
    body: body.trim(),
  });

  return NextResponse.json({ ok: true });
}
