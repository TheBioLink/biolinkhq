// src/app/api/discord-chat/messages/route.js
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { getDiscordChatMessageModel } from "@/models/DiscordChatMessage";
import { getDiscordChannelModel } from "@/models/DiscordChannel";
import { getDiscordServerModel } from "@/models/DiscordServer";
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

function isItsNic(email, uri) {
  return norm(email) === "mrrunknown44@gmail.com" || norm(uri) === "itsnicbtw";
}

async function isMemberOfServer(serverSlug, email) {
  if (!email) return false;
  if (serverSlug === "biolinkhq") return true; // global — everyone is a member
  const Server = await getDiscordServerModel();
  const server = await Server.findOne({ slug: norm(serverSlug) }).lean();
  if (!server) return false;
  return (server.members || []).some((m) => norm(m.email) === norm(email));
}

function serializeMessage(msg, myEmail = "") {
  return {
    id: String(msg._id),
    serverSlug: msg.serverSlug || "biolinkhq",
    channelSlug: msg.channelSlug,
    authorEmail: msg.authorEmail,
    authorUri: msg.authorUri,
    authorDisplayName: msg.authorDisplayName || msg.authorUri,
    authorProfileImage: msg.authorProfileImage || "",
    // body is a virtual that decompresses bodyCompressed
    body: msg.body || "",
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

// GET /api/discord-chat/messages?serverSlug=<slug>&channel=<slug>&cursor=<id>&limit=<n>
export async function GET(req) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const serverSlug = norm(searchParams.get("serverSlug") || "biolinkhq");
  const channelSlug = norm(searchParams.get("channel") || "general");
  const cursor = searchParams.get("cursor");
  const limit = Math.min(Number(searchParams.get("limit") || 50), 100);

  const myEmail = norm(session.user.email);

  // Verify membership
  if (!(await isMemberOfServer(serverSlug, myEmail))) {
    return NextResponse.json({ error: "Not a member of this server" }, { status: 403 });
  }

  try {
    const Message = await getDiscordChatMessageModel();

    const query = { serverSlug, channelSlug, deleted: false };
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

    // Reverse to chronological order
    results.reverse();

    // Manually decompress — lean() doesn't apply virtuals
    const { decompressBodyLean } = await import("@/libs/discordCompression");
    const serialized = results.map((m) => serializeMessage(
      { ...m, body: decompressBodyLean(m.bodyCompressed) },
      myEmail
    ));

    return NextResponse.json({
      ok: true,
      messages: serialized,
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

  const myEmail = norm(session.user.email);

  try {
    const body = await req.json().catch(() => ({}));
    const serverSlug = norm(body.serverSlug || "biolinkhq");
    const channelSlug = norm(body.channelSlug || "general");
    const text = String(body.body || "").trim().slice(0, 2000);

    if (!text) {
      return NextResponse.json({ error: "Message cannot be empty" }, { status: 400 });
    }

    // Membership check
    if (!(await isMemberOfServer(serverSlug, myEmail))) {
      return NextResponse.json({ error: "Not a member of this server" }, { status: 403 });
    }

    // Validate channel
    const Channel = await getDiscordChannelModel();
    const channel = await Channel.findOne({ serverSlug, slug: channelSlug }).lean();
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
          const { decompressBodyLean } = await import("@/libs/discordCompression");
          replyToSnippet = String(decompressBodyLean(parent.bodyCompressed) || "").slice(0, 100);
          replyToAuthorUri = parent.authorUri || "";
        }
      } catch {}
    }

    // Create with compression
    const message = await Message.createWithBody({
      serverSlug,
      channelSlug,
      authorEmail: myEmail,
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
      message: serializeMessage(
        { ...message.toObject(), body: text },
        myEmail
      ),
    });
  } catch (error) {
    console.error("Discord messages POST error:", error);
    return NextResponse.json({ ok: false, error: "Failed to send message" }, { status: 500 });
  }
}

// PATCH /api/discord-chat/messages — edit or delete
export async function PATCH(req) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const myEmail = norm(session.user.email);
  const page = await getSessionPage(session);
  const myUri = page?.uri || "";

  try {
    const body = await req.json().catch(() => ({}));
    const { action, id } = body;

    const Message = await getDiscordChatMessageModel();
    const message = await Message.findById(id);

    if (!message || message.deleted) {
      return NextResponse.json({ error: "Message not found" }, { status: 404 });
    }

    if (action === "delete") {
      const admin = isItsNic(myEmail, myUri);
      // Server owner can also delete
      let isServerOwner = false;
      try {
        const Server = await getDiscordServerModel();
        const server = await Server.findOne({ slug: message.serverSlug }).lean();
        isServerOwner = server && norm(server.ownerEmail) === myEmail;
      } catch {}

      if (message.authorEmail !== myEmail && !admin && !isServerOwner) {
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

      message.setBody(newBody);
      message.editedAt = new Date();
      await message.save();

      return NextResponse.json({
        ok: true,
        message: serializeMessage({ ...message.toObject(), body: newBody }, myEmail),
      });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("Discord messages PATCH error:", error);
    return NextResponse.json({ ok: false, error: "Failed to update message" }, { status: 500 });
  }
}
