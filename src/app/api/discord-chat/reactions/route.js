// src/app/api/discord-chat/reactions/route.js
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { getDiscordChatMessageModel } from "@/models/DiscordChatMessage";
import { Page } from "@/models/Page";
import mongoose from "mongoose";

export const runtime = "nodejs";

const norm = (s) => (s || "").toString().toLowerCase().trim();

const ALLOWED_EMOJIS = ["👍","❤️","😂","😮","😢","😡","🔥","✅","💯","🎉","👀","🚀","💀","🤝","⭐"];

async function getSessionUri(session) {
  if (!session?.user?.email) return null;
  if (mongoose.connection.readyState !== 1) {
    await mongoose.connect(process.env.MONGO_URI);
  }
  const page = await Page.findOne({ owner: norm(session.user.email) }).lean();
  return page?.uri || null;
}

// POST /api/discord-chat/reactions — toggle a reaction on a message
export async function POST(req) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const myUri = await getSessionUri(session);
  if (!myUri) {
    return NextResponse.json({ error: "Set a username first" }, { status: 400 });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const { messageId, emoji } = body;

    if (!messageId || !emoji) {
      return NextResponse.json({ error: "Missing messageId or emoji" }, { status: 400 });
    }

    // Validate emoji is in allowed list
    if (!ALLOWED_EMOJIS.includes(emoji)) {
      return NextResponse.json({ error: "Emoji not allowed" }, { status: 400 });
    }

    const Message = await getDiscordChatMessageModel();
    const message = await Message.findById(messageId);

    if (!message || message.deleted) {
      return NextResponse.json({ error: "Message not found" }, { status: 404 });
    }

    // Find or create reaction slot
    let reaction = message.reactions.find((r) => r.emoji === emoji);

    if (!reaction) {
      // Add new reaction
      message.reactions.push({ emoji, users: [myUri] });
    } else {
      const idx = reaction.users.indexOf(myUri);
      if (idx === -1) {
        // User hasn't reacted — add
        if (reaction.users.length >= 50) {
          return NextResponse.json({ error: "Reaction limit reached" }, { status: 400 });
        }
        reaction.users.push(myUri);
      } else {
        // User already reacted — remove (toggle off)
        reaction.users.splice(idx, 1);
        // Clean up empty reaction slots
        if (reaction.users.length === 0) {
          message.reactions = message.reactions.filter((r) => r.emoji !== emoji);
        }
      }
    }

    await message.save();

    // Return updated reactions
    const updatedReactions = message.reactions.map((r) => ({
      emoji: r.emoji,
      count: r.users.length,
      reactedByMe: r.users.includes(myUri),
    }));

    return NextResponse.json({ ok: true, reactions: updatedReactions });
  } catch (error) {
    console.error("Discord reactions POST error:", error);
    return NextResponse.json({ ok: false, error: "Failed to toggle reaction" }, { status: 500 });
  }
}

// GET /api/discord-chat/reactions — export allowed emojis
export async function GET() {
  return NextResponse.json({ ok: true, emojis: ALLOWED_EMOJIS });
}
