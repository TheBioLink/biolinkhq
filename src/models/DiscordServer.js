// src/models/DiscordServer.js
import mongoose from "mongoose";
import { discordChatDb } from "@/libs/discordChatDb";

let DiscordServerModel;

export async function getDiscordServerModel() {
  const conn = await discordChatDb();

  if (!DiscordServerModel) {
    const DiscordServerSchema = new mongoose.Schema(
      {
        name: { type: String, required: true, trim: true, maxlength: 64 },
        slug: { type: String, required: true, unique: true, lowercase: true, trim: true, maxlength: 64 },
        description: { type: String, default: "", maxlength: 256 },
        icon: { type: String, default: "" },
        ownerEmail: { type: String, required: true, lowercase: true, trim: true, index: true },
        ownerUri: { type: String, default: "", trim: true },

        // Members: array of emails who have joined/been invited
        members: {
          type: [
            {
              email: { type: String, lowercase: true, trim: true },
              uri: { type: String, trim: true },
              joinedAt: { type: Date, default: Date.now },
              role: { type: String, enum: ["owner", "admin", "member"], default: "member" },
            },
          ],
          default: [],
        },

        // Pending invites
        invites: {
          type: [
            {
              toEmail: { type: String, lowercase: true, trim: true },
              toUri: { type: String, trim: true },
              invitedBy: { type: String, lowercase: true, trim: true },
              invitedAt: { type: Date, default: Date.now },
              status: { type: String, enum: ["pending", "accepted", "declined"], default: "pending" },
            },
          ],
          default: [],
        },

        // Is this the global BioLinkHQ server (force-join, no leave)
        isGlobal: { type: Boolean, default: false },

        // Is this server private (invite-only) or public (anyone can join)
        isPublic: { type: Boolean, default: true },

        order: { type: Number, default: 0 },
      },
      { timestamps: true }
    );

    DiscordServerSchema.index({ slug: 1 }, { unique: true });
    DiscordServerSchema.index({ ownerEmail: 1 });
    DiscordServerSchema.index({ "members.email": 1 });

    DiscordServerModel =
      conn.models.DiscordServer ||
      conn.model("DiscordServer", DiscordServerSchema);
  }

  return DiscordServerModel;
}
