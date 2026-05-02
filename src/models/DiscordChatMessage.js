// src/models/DiscordChatMessage.js
// Messages are stored compressed (zlib deflate) to save DB space.
// Compression/decompression is handled transparently via mongoose virtuals + hooks.

import mongoose from "mongoose";
import zlib from "zlib";
import { discordChatDb } from "@/libs/discordChatDb";

let DiscordChatMessageModel;

// ── Compress/decompress helpers ─────────────────────────────────────────────

function compressBody(text) {
  if (!text) return Buffer.alloc(0);
  try {
    return zlib.deflateRawSync(Buffer.from(String(text), "utf8"), { level: 6 });
  } catch {
    return Buffer.from(String(text), "utf8");
  }
}

function decompressBody(buf) {
  if (!buf || buf.length === 0) return "";
  try {
    // Try deflate first (new format)
    return zlib.inflateRawSync(buf).toString("utf8");
  } catch {
    // Fallback: plain utf8 (legacy uncompressed rows)
    try {
      return buf.toString("utf8");
    } catch {
      return "";
    }
  }
}

export async function getDiscordChatMessageModel() {
  const conn = await discordChatDb();

  if (!DiscordChatMessageModel) {
    const ReactionSchema = new mongoose.Schema(
      {
        emoji: { type: String, required: true, maxlength: 8 },
        users: { type: [String], default: [] },
      },
      { _id: false }
    );

    const DiscordChatMessageSchema = new mongoose.Schema(
      {
        serverSlug: {
          type: String,
          lowercase: true,
          trim: true,
          index: true,
          default: "biolinkhq", // global server default
        },
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
        authorUri: { type: String, required: true, trim: true },
        authorDisplayName: { type: String, default: "" },
        authorProfileImage: { type: String, default: "" },

        // Stored as compressed binary (zlib deflate)
        bodyCompressed: { type: Buffer, default: null },

        reactions: { type: [ReactionSchema], default: [] },
        replyTo: {
          type: mongoose.Schema.Types.ObjectId,
          default: null,
          index: true,
        },
        replyToSnippet: { type: String, default: "", maxlength: 100 },
        replyToAuthorUri: { type: String, default: "" },
        deleted: { type: Boolean, default: false },
        editedAt: { type: Date, default: null },
      },
      {
        timestamps: true,
        // Don't persist 'body' — it's virtual
        toJSON: { virtuals: true },
        toObject: { virtuals: true },
      }
    );

    // Virtual: decompress body on read
    DiscordChatMessageSchema.virtual("body").get(function () {
      return decompressBody(this.bodyCompressed);
    });

    // Compress body before save
    DiscordChatMessageSchema.pre("save", function (next) {
      if (this._pendingBody !== undefined) {
        this.bodyCompressed = compressBody(this._pendingBody);
        delete this._pendingBody;
      }
      next();
    });

    // Static helper: create with a plain-text body
    DiscordChatMessageSchema.statics.createWithBody = async function (data) {
      const doc = new this(data);
      doc._pendingBody = String(data.body || "").trim().slice(0, 2000);
      await doc.save();
      return doc;
    };

    // Instance helper: update body
    DiscordChatMessageSchema.methods.setBody = function (text) {
      this._pendingBody = String(text || "").trim().slice(0, 2000);
    };

    DiscordChatMessageSchema.index({ serverSlug: 1, channelSlug: 1, createdAt: -1 });
    DiscordChatMessageSchema.index({ authorEmail: 1, createdAt: -1 });

    DiscordChatMessageModel =
      conn.models.DiscordChatMessage ||
      conn.model("DiscordChatMessage", DiscordChatMessageSchema);
  }

  return DiscordChatMessageModel;
}
