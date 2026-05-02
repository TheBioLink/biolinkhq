// src/models/DiscordLink.js
// Stored in D_MONGO_URI — links a BiolinkHQ owner email to their Discord account

import mongoose from "mongoose";
import { connectDiscordDb } from "@/libs/discordDb";

const DiscordLinkSchema = new mongoose.Schema(
  {
    // BiolinkHQ owner email (from MONGO_URI users)
    ownerEmail: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    // BiolinkHQ page URI (for quick public lookup)
    pageUri: {
      type: String,
      lowercase: true,
      trim: true,
      default: "",
    },

    // Discord user data
    discordId: { type: String, required: true },
    discordUsername: { type: String, default: "" },       // e.g. "cooluser"
    discordGlobalName: { type: String, default: "" },     // display name
    discordAvatar: { type: String, default: "" },         // avatar hash
    discordAvatarUrl: { type: String, default: "" },      // full CDN url

    // OAuth tokens (kept private, never sent to public)
    accessToken: { type: String, default: "" },
    refreshToken: { type: String, default: "" },
    tokenExpiresAt: { type: Date, default: null },
    tokenScopes: { type: String, default: "" },

    // Presence / status (refreshed periodically)
    onlineStatus: {
      type: String,
      enum: ["online", "idle", "dnd", "offline", "unknown"],
      default: "unknown",
    },
    statusText: { type: String, default: "" },     // custom status message
    statusEmoji: { type: String, default: "" },    // custom status emoji

    // Privacy settings chosen by the user
    showDiscordId: { type: Boolean, default: false },
    showStatus: { type: Boolean, default: true },
    showUsername: { type: Boolean, default: true },

    lastStatusRefresh: { type: Date, default: null },
  },
  {
    timestamps: true,
  }
);

// We register on the discord connection, not the default mongoose connection
let DiscordLinkModel = null;

export async function getDiscordLinkModel() {
  if (DiscordLinkModel) return DiscordLinkModel;

  const conn = await connectDiscordDb();

  // Avoid "Cannot overwrite model once compiled" errors
  DiscordLinkModel =
    conn.models.DiscordLink ||
    conn.model("DiscordLink", DiscordLinkSchema);

  return DiscordLinkModel;
}
