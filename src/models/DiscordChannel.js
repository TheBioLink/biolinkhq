// src/models/DiscordChannel.js
import mongoose from "mongoose";
import { discordChatDb } from "@/libs/discordChatDb";

let DiscordChannelModel;

export async function getDiscordChannelModel() {
  const conn = await discordChatDb();

  if (!DiscordChannelModel) {
    const DiscordChannelSchema = new mongoose.Schema(
      {
        name: {
          type: String,
          required: true,
          trim: true,
          maxlength: 64,
        },
        slug: {
          type: String,
          required: true,
          unique: true,
          lowercase: true,
          trim: true,
          maxlength: 64,
        },
        description: {
          type: String,
          default: "",
          maxlength: 256,
        },
        emoji: {
          type: String,
          default: "💬",
          maxlength: 8,
        },
        createdBy: {
          type: String,
          default: "",
        },
        isDefault: {
          type: Boolean,
          default: false,
        },
        order: {
          type: Number,
          default: 0,
        },
      },
      { timestamps: true }
    );

    DiscordChannelModel =
      conn.models.DiscordChannel ||
      conn.model("DiscordChannel", DiscordChannelSchema);
  }

  return DiscordChannelModel;
}
