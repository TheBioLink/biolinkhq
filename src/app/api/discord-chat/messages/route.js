// src/app/api/discord-chat/messages/route.js
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { getDiscordChatMessageModel } from "@/models/DiscordChatMessage";
import { getDiscordChannelModel } from "@/models/DiscordChannel";
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

function serializeMessage(msg, myEmail = "") {
  return {
    id: String(msg._id),
    channelSlug: msg.channelSlug,
    authorEmail: msg.authorEmail,
    authorUri: msg.authorUri,
    authorDisplayName: msg.authorDisplayName || msg.authorUri,
    authorProfileImage: msg.authorProfileImage || "",
    body: msg.body,
    reactions: (msg.reactions || []).map((r) => ({
      emoji: r.emoji,
      count: (r.users || []).length,
      reactedByMe: myEmail ? (r.users || []).includes(myEmail) : false,
    })),
    replyTo: msg.replyTo ? String(msg.replyTo) : null,
    replyToSnippet: msg.replyToSnippet || "",
    replyToAuthorUri: msg.replyToAuthorUri || "",
    deleted: msg.deleted || false,
    editedAt: msg.editedAt || null,
    createdAt: msg.createdAt,
    isMine: myEmail ? msg.authorEmail === myEmail : false,
  };
}

// GET /api/discord-chat/messages?channel=<slug>&cursor=<id>&limit=<n>
export async function GET(req) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const channelSlug = norm(searchParams.get("channel") || "general");
  const cursor = searchParams.get("cursor");
  const limit = Math.min(Number(searchParams.get("limit") || 50), 100);

  try {
    const Message = await getDiscordChatMessageModel();
    const myEmail = norm(session.user.email);

    const query = { channelSlug, deleted: false };
    if (cursor) {
      try {
        query._id = { $lt: new mongoose.Types.ObjectId(cursor) };
      } catch {}
    }

    const messages = await Message.find(query)
      .sort({ _id: -1 })
      .limit(limit + 1)
      .lean();

    const hasMore = messages.length > limit;
    const results = hasMore ? messages.slice(0, limit) : messages;

    // Return in chronological order (oldest first)
    results.reverse();

    return NextResponse.json({
      ok: true,
      messages: results.map((m) => serializeMessage(m, myEmail)),
      nextCursor: hasMore ? String(results[0]?._id) : null,
    });
  } catch (error) {
    console.error("Discord messages GET error:", error);
    return NextResponse.json({ ok: false, error: "Failed to load messages" }, { status: 500 });
  }
}

// POST /api/discord-chat/messages — send a message
export async function POST(req) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const page = await getSessionPage(session);
  if (!page?.uri) {
    return NextResponse.json({ error: "Set a username first" }, { status: 400 });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const channelSlug = norm(body.channelSlug || "general");
    const text = String(body.body || "").trim().slice(0, 2000);

    if (!text) {
      return NextResponse.json({ error: "Message cannot be empty" }, { status: 400 });
    }

    // Validate channel exists
    const Channel = await getDiscordChannelModel();
    const channel = await Channel.findOne({ slug: channelSlug }).lean();
    if (!channel) {
      return NextResponse.json({ error: "Channel not found" }, { status: 404 });
    }

    const Message = await getDiscordChatMessageModel();

    // Handle reply
    let replyToSnippet = "";
    let replyToAuthorUri = "";
    if (body.replyTo) {
      try {
        const parent = await Message.findById(body.replyTo).lean();
        if (parent && !parent.deleted) {
          replyToSnippet = String(parent.body || "").slice(0, 100);
          replyToAuthorUri = parent.authorUri || "";
        }
      } catch {}
    }

    const message = await Message.create({
      channelSlug,
      authorEmail: norm(session.user.email),
      authorUri: page.uri,
      authorDisplayName: page.displayName || page.uri,
      authorProfileImage: page.profileImage || "",
      body: text,
      replyTo: body.replyTo || null,
      replyToSnippet,
      replyToAuthorUri,
    });

    return NextResponse.json({
      ok: true,
      message: serializeMessage(message.toObject(), norm(session.user.email)),
    });
  } catch (error) {
    console.error("Discord messages POST error:", error);
    return NextResponse.json({ ok: false, error: "Failed to send message" }, { status: 500 });
  }
}

// PATCH /api/discord-chat/messages — edit or delete a message
export async function PATCH(req) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const myEmail = norm(session.user.email);

  try {
    const body = await req.json().catch(() => ({}));
    const { action, id } = body;

    const Message = await getDiscordChatMessageModel();
    const message = await Message.findById(id);

    if (!message || message.deleted) {
      return NextResponse.json({ error: "Message not found" }, { status: 404 });
    }

    if (action === "delete") {
      // Check ownership or admin
      await connectMainDb();
      const page = await Page.findOne({ owner: myEmail }).lean();
      const isAdmin = norm(page?.uri) === "itsnicbtw";

      if (message.authorEmail !== myEmail && !isAdmin) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }

      message.deleted = true;
      await message.save();
      return NextResponse.json({ ok: true });
    }

    if (action === "edit") {
      if (message.authorEmail !== myEmail) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }

      const newBody = String(body.body || "").trim().slice(0, 2000);
      if (!newBody) {
        return NextResponse.json({ error: "Message cannot be empty" }, { status: 400 });
      }

      message.body = newBody;
      message.editedAt = new Date();
      await message.save();

      return NextResponse.json({
        ok: true,
        message: serializeMessage(message.toObject(), myEmail),
      });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("Discord messages PATCH error:", error);
    return NextResponse.json({ ok: false, error: "Failed to update message" }, { status: 500 });
  }
}
