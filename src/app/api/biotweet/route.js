// src/app/api/biotweet/route.js
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { getTweetModel } from "@/models/Tweet";
import { Page } from "@/models/Page";
import mongoose from "mongoose";

export const runtime = "nodejs";

const norm = (s) => (s || "").toString().toLowerCase().trim();

async function connectMainDb() {
  if (mongoose.connection.readyState !== 1) {
    await mongoose.connect(process.env.MONGO_URI);
  }
}

async function getSessionPage(session) {
  if (!session?.user?.email) return null;
  await connectMainDb();
  return Page.findOne({ owner: norm(session.user.email) }).lean();
}

function serializeTweet(t, myEmail = "") {
  return {
    id: String(t._id),
    authorEmail: t.authorEmail,
    authorUri: t.authorUri,
    authorDisplayName: t.authorDisplayName || t.authorUri,
    authorProfileImage: t.authorProfileImage || "",
    body: t.body,
    likes: t.likes || [],
    likeCount: (t.likes || []).length,
    likedByMe: myEmail ? (t.likes || []).includes(myEmail) : false,
    replyTo: t.replyTo ? String(t.replyTo) : null,
    retweetOf: t.retweetOf ? String(t.retweetOf) : null,
    createdAt: t.createdAt,
  };
}

// GET /api/biotweet?feed=home&cursor=<id>&limit=20
// GET /api/biotweet?uri=<username>&cursor=<id>&limit=20
// GET /api/biotweet?id=<tweetId>        (single tweet + replies)
// GET /api/biotweet?q=<search>&cursor=  (full-text search)
export async function GET(req) {
  const session = await getServerSession(authOptions);
  const myEmail = norm(session?.user?.email || "");
  const Tweet = await getTweetModel();

  const { searchParams } = new URL(req.url);
  const feed = searchParams.get("feed");
  const uri = searchParams.get("uri");
  const id = searchParams.get("id");
  const q = searchParams.get("q")?.trim() || "";
  const cursor = searchParams.get("cursor");
  const limit = Math.min(Number(searchParams.get("limit") || 20), 50);

  // ── Single tweet + replies ──────────────────────────────────────────────────
  if (id) {
    const tweet = await Tweet.findById(id).lean();
    if (!tweet || tweet.deleted) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const replies = await Tweet.find({ replyTo: tweet._id, deleted: false })
      .sort({ createdAt: 1 })
      .lean();

    return NextResponse.json({
      ok: true,
      tweet: serializeTweet(tweet, myEmail),
      replies: replies.map((r) => serializeTweet(r, myEmail)),
    });
  }

  // ── Full-text search ────────────────────────────────────────────────────────
  if (q) {
    // Use a case-insensitive regex search across body, authorDisplayName, authorUri
    // For production you'd add a $text index on body; regex works well at small scale
    const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = new RegExp(escaped, "i");

    const searchQuery = {
      deleted: false,
      $or: [
        { body: regex },
        { authorDisplayName: regex },
        { authorUri: regex },
      ],
    };

    if (cursor) {
      try { searchQuery._id = { $lt: new mongoose.Types.ObjectId(cursor) }; } catch {}
    }

    const tweets = await Tweet.find(searchQuery)
      .sort({ _id: -1 })
      .limit(limit + 1)
      .lean();

    const hasMore = tweets.length > limit;
    const results = hasMore ? tweets.slice(0, limit) : tweets;

    return NextResponse.json({
      ok: true,
      tweets: results.map((t) => serializeTweet(t, myEmail)),
      nextCursor: hasMore ? String(results[results.length - 1]._id) : null,
      query: q,
    });
  }

  // ── Feed / profile ──────────────────────────────────────────────────────────
  const query = { deleted: false, replyTo: null };

  if (uri) {
    query.authorUri = norm(uri);
    delete query.replyTo; // show all tweets including replies on profile
  }

  if (cursor) {
    try {
      query._id = { $lt: new mongoose.Types.ObjectId(cursor) };
    } catch {}
  }

  const tweets = await Tweet.find(query)
    .sort({ _id: -1 })
    .limit(limit + 1)
    .lean();

  const hasMore = tweets.length > limit;
  const results = hasMore ? tweets.slice(0, limit) : tweets;
  const nextCursor = hasMore ? String(results[results.length - 1]._id) : null;

  return NextResponse.json({
    ok: true,
    tweets: results.map((t) => serializeTweet(t, myEmail)),
    nextCursor,
  });
}

// POST /api/biotweet  { body, replyTo? }
export async function POST(req) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const page = await getSessionPage(session);
  if (!page?.uri) {
    return NextResponse.json({ error: "Set a username first" }, { status: 400 });
  }

  const Tweet = await getTweetModel();
  const body = await req.json().catch(() => ({}));

  const text = String(body.body || "").trim().slice(0, 280);
  if (!text) {
    return NextResponse.json({ error: "Tweet cannot be empty" }, { status: 400 });
  }

  const replyTo = body.replyTo || null;
  if (replyTo) {
    const parent = await Tweet.findById(replyTo).lean();
    if (!parent || parent.deleted) {
      return NextResponse.json({ error: "Parent tweet not found" }, { status: 404 });
    }
  }

  const tweet = await Tweet.create({
    authorEmail: norm(session.user.email),
    authorUri: page.uri,
    authorDisplayName: page.displayName || page.uri,
    authorProfileImage: page.profileImage || "",
    body: text,
    replyTo: replyTo || null,
  });

  return NextResponse.json({ ok: true, tweet: serializeTweet(tweet.toObject(), norm(session.user.email)) });
}

// PATCH /api/biotweet  { action: "like"|"unlike"|"delete", id }
export async function PATCH(req) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const myEmail = norm(session.user.email);
  const Tweet = await getTweetModel();
  const body = await req.json().catch(() => ({}));
  const { action, id } = body;

  const tweet = await Tweet.findById(id);
  if (!tweet || tweet.deleted) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (action === "like") {
    if (!tweet.likes.includes(myEmail)) tweet.likes.push(myEmail);
    await tweet.save();
    return NextResponse.json({ ok: true, likeCount: tweet.likes.length });
  }

  if (action === "unlike") {
    tweet.likes = tweet.likes.filter((e) => e !== myEmail);
    await tweet.save();
    return NextResponse.json({ ok: true, likeCount: tweet.likes.length });
  }

  if (action === "delete") {
    if (tweet.authorEmail !== myEmail) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    tweet.deleted = true;
    await tweet.save();
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}
