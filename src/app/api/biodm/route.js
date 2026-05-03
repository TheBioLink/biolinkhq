// src/app/api/biodm/route.js
// Ephemeral DM system - messages expire after 24 hours
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { Page } from "@/models/Page";
import mongoose from "mongoose";

export const runtime = "nodejs";

const norm = (s) => (s || "").toString().toLowerCase().trim();
const DM_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

// Inline model to avoid extra file
function getDMModel() {
  if (mongoose.models.BioDM) return mongoose.models.BioDM;
  const schema = new mongoose.Schema(
    {
      fromUri: { type: String, required: true, index: true },
      toUri: { type: String, required: true, index: true },
      fromEmail: { type: String, required: true },
      toEmail: { type: String, required: true },
      body: { type: String, required: true, maxlength: 1000 },
      readAt: { type: Date, default: null },
      expiresAt: { type: Date, required: true, index: { expireAfterSeconds: 0 } },
    },
    { timestamps: true }
  );
  schema.index({ fromUri: 1, toUri: 1, createdAt: -1 });
  schema.index({ toUri: 1, readAt: 1 });
  return mongoose.model("BioDM", schema);
}

async function connectDb() {
  if (mongoose.connection.readyState !== 1) {
    await mongoose.connect(process.env.MONGO_URI);
  }
}

async function getSessionPage(session) {
  if (!session?.user?.email) return null;
  await connectDb();
  return Page.findOne({ owner: norm(session.user.email) }).lean();
}

// GET /api/biodm?threads=1          → list conversation threads
// GET /api/biodm?with=<uri>          → messages with a specific user
// GET /api/biodm?unread=1            → unread count
export async function GET(req) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await connectDb();
  const page = await getSessionPage(session);
  if (!page?.uri) {
    return NextResponse.json({ error: "Set a username first" }, { status: 400 });
  }

  const { searchParams } = new URL(req.url);
  const myUri = page.uri;
  const DM = getDMModel();

  // Unread count
  if (searchParams.get("unread") === "1") {
    const count = await DM.countDocuments({
      toUri: myUri,
      readAt: null,
      expiresAt: { $gt: new Date() },
    });
    return NextResponse.json({ ok: true, unread: count });
  }

  // Messages with a specific user
  const withUri = searchParams.get("with");
  if (withUri) {
    // Mark messages as read
    await DM.updateMany(
      { fromUri: withUri, toUri: myUri, readAt: null },
      { $set: { readAt: new Date() } }
    );

    const messages = await DM.find({
      $or: [
        { fromUri: myUri, toUri: withUri },
        { fromUri: withUri, toUri: myUri },
      ],
      expiresAt: { $gt: new Date() },
    })
      .sort({ createdAt: 1 })
      .limit(100)
      .lean();

    // Get the other user's page info
    const otherPage = await Page.findOne({ uri: norm(withUri) })
      .select("uri displayName profileImage")
      .lean();

    return NextResponse.json({
      ok: true,
      messages: messages.map((m) => ({
        id: String(m._id),
        body: m.body,
        mine: m.fromUri === myUri,
        createdAt: m.createdAt,
        expiresAt: m.expiresAt,
      })),
      with: otherPage
        ? {
            uri: otherPage.uri,
            displayName: otherPage.displayName || otherPage.uri,
            profileImage: otherPage.profileImage || "",
          }
        : { uri: withUri, displayName: withUri, profileImage: "" },
    });
  }

  // Thread list
  if (searchParams.get("threads") === "1") {
    const recentDMs = await DM.find({
      $or: [{ fromUri: myUri }, { toUri: myUri }],
      expiresAt: { $gt: new Date() },
    })
      .sort({ createdAt: -1 })
      .limit(200)
      .lean();

    // Build thread map
    const threadMap = new Map();
    for (const dm of recentDMs) {
      const otherUri = dm.fromUri === myUri ? dm.toUri : dm.fromUri;
      if (!threadMap.has(otherUri)) {
        const unread = await DM.countDocuments({
          fromUri: otherUri,
          toUri: myUri,
          readAt: null,
          expiresAt: { $gt: new Date() },
        });
        const otherPage = await Page.findOne({ uri: otherUri })
          .select("uri displayName profileImage")
          .lean();
        threadMap.set(otherUri, {
          withUri: otherUri,
          withDisplayName: otherPage?.displayName || otherUri,
          withProfileImage: otherPage?.profileImage || "",
          lastMessage: {
            body: dm.body,
            mine: dm.fromUri === myUri,
            createdAt: dm.createdAt,
          },
          unreadCount: unread,
        });
      }
    }

    return NextResponse.json({
      ok: true,
      threads: Array.from(threadMap.values()),
    });
  }

  return NextResponse.json({ ok: true, threads: [] });
}

// POST /api/biodm  { toUri, body }
export async function POST(req) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await connectDb();
  const page = await getSessionPage(session);
  if (!page?.uri) {
    return NextResponse.json({ error: "Set a username first" }, { status: 400 });
  }

  const body = await req.json().catch(() => ({}));
  const toUri = norm(body.toUri || "").replace(/^@/, "");
  const text = String(body.body || "").trim().slice(0, 1000);

  if (!toUri || !text) {
    return NextResponse.json({ error: "Missing toUri or body" }, { status: 400 });
  }

  const targetPage = await Page.findOne({ uri: toUri }).lean();
  if (!targetPage?.owner) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const DM = getDMModel();
  const expiresAt = new Date(Date.now() + DM_TTL_MS);

  const dm = await DM.create({
    fromUri: page.uri,
    toUri,
    fromEmail: norm(session.user.email),
    toEmail: norm(targetPage.owner),
    body: text,
    expiresAt,
  });

  return NextResponse.json({
    ok: true,
    message: {
      id: String(dm._id),
      body: dm.body,
      mine: true,
      createdAt: dm.createdAt,
      expiresAt: dm.expiresAt,
    },
  });
}
