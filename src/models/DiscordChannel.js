// src/models/DiscordChannel.js
import mongoose from "mongoose";
import { discordChatDb } from "@/libs/discordChatDb";

let DiscordChannelModel;

export async function getDiscordChannelModel() {
  const conn = await discordChatDb();

  if (!DiscordChannelModel) {
    const DiscordChannelSchema = new mongoose.Schema(
      {
        // Which server this channel belongs to
        serverSlug: {
          type: String,
          lowercase: true,
          trim: true,
          index: true,
          default: "biolinkhq",
        },
        name: { type: String, required: true, trim: true, maxlength: 64 },
        slug: { type: String, required: true, lowercase: true, trim: true, maxlength: 64 },
        description: { type: String, default: "", maxlength: 256 },
        emoji: { type: String, default: "💬", maxlength: 8 },
        createdBy: { type: String, default: "" },
        isDefault: { type: Boolean, default: false },
        order: { type: Number, default: 0 },
      },
      { timestamps: true }
    );

    // Unique channel slug per server
    DiscordChannelSchema.index({ serverSlug: 1, slug: 1 }, { unique: true });
    DiscordChannelSchema.index({ serverSlug: 1, order: 1 });

    DiscordChannelModel =
      conn.models.DiscordChannel ||
      conn.model("DiscordChannel", DiscordChannelSchema);
  }

  return DiscordChannelModel;
}
