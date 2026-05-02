// src/app/api/discord-chat/channels/route.js
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { getDiscordChannelModel } from "@/models/DiscordChannel";
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

async function isAdmin(session) {
  if (!session?.user?.email) return false;
  await connectMainDb();
  const page = await Page.findOne({ owner: norm(session.user.email) }).lean();
  return norm(page?.uri) === "itsnicbtw";
}

function serializeChannel(ch) {
  return {
    id: String(ch._id),
    name: ch.name,
    slug: ch.slug,
    description: ch.description || "",
    emoji: ch.emoji || "💬",
    isDefault: ch.isDefault || false,
    order: ch.order ?? 0,
    createdAt: ch.createdAt,
  };
}

// GET /api/discord-chat/channels — list all channels
export async function GET() {
  try {
    const Channel = await getDiscordChannelModel();
    const channels = await Channel.find({})
      .sort({ order: 1, createdAt: 1 })
      .lean();

    // Seed a default channel if none exist
    if (channels.length === 0) {
      const seed = await Channel.create({
        name: "general",
        slug: "general",
        description: "General chat for everyone",
        emoji: "💬",
        isDefault: true,
        order: 0,
        createdBy: "system",
      });
      return NextResponse.json({ ok: true, channels: [serializeChannel(seed)] });
    }

    return NextResponse.json({ ok: true, channels: channels.map(serializeChannel) });
  } catch (error) {
    console.error("Discord channels GET error:", error);
    return NextResponse.json({ ok: false, error: "Failed to load channels" }, { status: 500 });
  }
}

// POST /api/discord-chat/channels — create a channel (admin only)
export async function POST(req) {
  const session = await getServerSession(authOptions);
  if (!(await isAdmin(session))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const name = String(body.name || "").trim().slice(0, 64);
    if (!name || name.length < 2) {
      return NextResponse.json({ error: "Channel name must be at least 2 characters" }, { status: 400 });
    }

    const slug = slugify(body.slug || name);
    const Channel = await getDiscordChannelModel();

    const existing = await Channel.findOne({ slug }).lean();
    if (existing) {
      return NextResponse.json({ error: "A channel with that name already exists" }, { status: 409 });
    }

    const count = await Channel.countDocuments();

    const channel = await Channel.create({
      name,
      slug,
      description: String(body.description || "").trim().slice(0, 256),
      emoji: String(body.emoji || "💬").slice(0, 8),
      isDefault: body.isDefault === true && count === 0,
      order: count,
      createdBy: norm(session.user.email),
    });

    return NextResponse.json({ ok: true, channel: serializeChannel(channel) });
  } catch (error) {
    console.error("Discord channels POST error:", error);
    return NextResponse.json({ ok: false, error: "Failed to create channel" }, { status: 500 });
  }
}

// DELETE /api/discord-chat/channels — delete a channel (admin only)
export async function DELETE(req) {
  const session = await getServerSession(authOptions);
  if (!(await isAdmin(session))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const { id } = await req.json().catch(() => ({}));
    const Channel = await getDiscordChannelModel();

    const channel = await Channel.findById(id);
    if (!channel) {
      return NextResponse.json({ error: "Channel not found" }, { status: 404 });
    }
    if (channel.isDefault) {
      return NextResponse.json({ error: "Cannot delete the default channel" }, { status: 400 });
    }

    await Channel.deleteOne({ _id: id });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Discord channels DELETE error:", error);
    return NextResponse.json({ ok: false, error: "Failed to delete channel" }, { status: 500 });
  }
}
