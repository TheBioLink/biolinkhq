// src/app/api/discord-chat/channels/route.js
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { getDiscordChannelModel } from "@/models/DiscordChannel";
import { getDiscordServerModel } from "@/models/DiscordServer";
import { Page } from "@/models/Page";
import mongoose from "mongoose";

export const runtime = "nodejs";

const norm = (s) => (s || "").toString().toLowerCase().trim();

function slugify(name) {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64) || `channel-${Date.now()}`;
}

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

async function canManageServer(serverSlug, myEmail, myUri) {
  // itsnicbtw can manage any server
  if (isItsNic(myEmail, myUri)) return true;

  const Server = await getDiscordServerModel();
  const server = await Server.findOne({ slug: norm(serverSlug) }).lean();
  if (!server) return false;

  const member = (server.members || []).find((m) => norm(m.email) === norm(myEmail));
  return ["owner", "admin"].includes(member?.role);
}

function serializeChannel(ch) {
  return {
    id: String(ch._id),
    serverSlug: ch.serverSlug || "biolinkhq",
    name: ch.name,
    slug: ch.slug,
    description: ch.description || "",
    emoji: ch.emoji || "💬",
    isDefault: ch.isDefault || false,
    order: ch.order ?? 0,
    createdAt: ch.createdAt,
  };
}

// GET /api/discord-chat/channels?serverSlug=<slug>
export async function GET(req) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const serverSlug = norm(searchParams.get("serverSlug") || "biolinkhq");

  try {
    const Channel = await getDiscordChannelModel();
    let channels = await Channel.find({ serverSlug })
      .sort({ order: 1, createdAt: 1 })
      .lean();

    // Seed a default channel if none exist for this server
    if (channels.length === 0) {
      const seed = await Channel.create({
        serverSlug,
        name: "general",
        slug: "general",
        description: "General chat",
        emoji: "💬",
        isDefault: true,
        order: 0,
        createdBy: "system",
      });
      channels = [seed.toObject()];
    }

    return NextResponse.json({ ok: true, channels: channels.map(serializeChannel) });
  } catch (error) {
    console.error("Discord channels GET error:", error);
    return NextResponse.json({ ok: false, error: "Failed to load channels" }, { status: 500 });
  }
}

// POST /api/discord-chat/channels — create a channel
export async function POST(req) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const page = await getSessionPage(session);
  const myEmail = norm(session.user.email);
  const myUri = page?.uri || "";

  try {
    const body = await req.json().catch(() => ({}));
    const serverSlug = norm(body.serverSlug || "biolinkhq");

    if (!(await canManageServer(serverSlug, myEmail, myUri))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const name = String(body.name || "").trim().slice(0, 64);
    if (!name || name.length < 2) {
      return NextResponse.json({ error: "Channel name must be at least 2 characters" }, { status: 400 });
    }

    const slug = slugify(body.slug || name);
    const Channel = await getDiscordChannelModel();

    const existing = await Channel.findOne({ serverSlug, slug }).lean();
    if (existing) {
      return NextResponse.json({ error: "A channel with that name already exists" }, { status: 409 });
    }

    const count = await Channel.countDocuments({ serverSlug });

    const channel = await Channel.create({
      serverSlug,
      name,
      slug,
      description: String(body.description || "").trim().slice(0, 256),
      emoji: String(body.emoji || "💬").slice(0, 8),
      isDefault: false,
      order: count,
      createdBy: myEmail,
    });

    return NextResponse.json({ ok: true, channel: serializeChannel(channel.toObject()) });
  } catch (error) {
    console.error("Discord channels POST error:", error);
    return NextResponse.json({ ok: false, error: "Failed to create channel" }, { status: 500 });
  }
}

// DELETE /api/discord-chat/channels
export async function DELETE(req) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const page = await getSessionPage(session);
  const myEmail = norm(session.user.email);
  const myUri = page?.uri || "";

  try {
    const body = await req.json().catch(() => ({}));
    const serverSlug = norm(body.serverSlug || "biolinkhq");

    if (!(await canManageServer(serverSlug, myEmail, myUri))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const Channel = await getDiscordChannelModel();
    const channel = await Channel.findById(body.id);
    if (!channel || norm(channel.serverSlug) !== serverSlug) {
      return NextResponse.json({ error: "Channel not found" }, { status: 404 });
    }
    if (channel.isDefault) {
      return NextResponse.json({ error: "Cannot delete the default channel" }, { status: 400 });
    }

    await Channel.deleteOne({ _id: body.id });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Discord channels DELETE error:", error);
    return NextResponse.json({ ok: false, error: "Failed to delete channel" }, { status: 500 });
  }
}
