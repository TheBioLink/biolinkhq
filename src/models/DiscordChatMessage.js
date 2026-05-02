// src/models/DiscordChatMessage.js
import mongoose from "mongoose";
import { discordChatDb } from "@/libs/discordChatDb";

let DiscordChatMessageModel;

export async function getDiscordChatMessageModel() {
  const conn = await discordChatDb();

  if (!DiscordChatMessageModel) {
    const ReactionSchema = new mongoose.Schema(
      {
        emoji: { type: String, required: true, maxlength: 8 },
        // array of ownerUris who reacted
        users: { type: [String], default: [] },
      },
      { _id: false }
    );

    const DiscordChatMessageSchema = new mongoose.Schema(
      {
        channelSlug: {
          type: String,
          required: true,
          lowercase: true,
          trim: true,
          index: true,
        },
        authorEmail: {
          type: String,
          required: true,
          lowercase: true,
          trim: true,
          index: true,
        },
        authorUri: {
          type: String,
          required: true,
          trim: true,
        },
        authorDisplayName: {
          type: String,
          default: "",
        },
        authorProfileImage: {
          type: String,
          default: "",
        },
        body: {
          type: String,
          required: true,
          trim: true,
          maxlength: 2000,
        },
        reactions: {
          type: [ReactionSchema],
          default: [],
        },
        replyTo: {
          type: mongoose.Schema.Types.ObjectId,
          default: null,
          index: true,
        },
        replyToSnippet: {
          type: String,
          default: "",
          maxlength: 100,
        },
        replyToAuthorUri: {
          type: String,
          default: "",
        },
        deleted: {
          type: Boolean,
          default: false,
        },
        editedAt: {
          type: Date,
          default: null,
        },
      },
      { timestamps: true }
    );

    DiscordChatMessageSchema.index({ channelSlug: 1, createdAt: -1 });
    DiscordChatMessageSchema.index({ authorEmail: 1, createdAt: -1 });

    DiscordChatMessageModel =
      conn.models.DiscordChatMessage ||
      conn.model("DiscordChatMessage", DiscordChatMessageSchema);
  }

  return DiscordChatMessageModel;
}
