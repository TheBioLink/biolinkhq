import mongoose from "mongoose";
import { teamDb } from "@/libs/teamDb";

let TeamProfileModel;
let TeamInviteModel;

export async function getTeamProfileModel() {
  const conn = await teamDb();

  if (!TeamProfileModel) {
    const schema = new mongoose.Schema(
      {
        ownerEmail: { type: String, required: true, index: true },
        tagline: String,
        description: String,
        game: String,
        region: String,
        recruiting: Boolean,
        members: [
          {
            username: String,
            role: String,
            ownerEmail: String,
            profileUri: String,
            verified: { type: Boolean, default: false },
            badgeId: String,
            acceptedAt: Date,
          },
        ],
      },
      { timestamps: true }
    );

    TeamProfileModel = conn.models.TeamProfile || conn.model("TeamProfile", schema);
  }

  return TeamProfileModel;
}

export async function getTeamInviteModel() {
  const conn = await teamDb();

  if (!TeamInviteModel) {
    const schema = new mongoose.Schema(
      {
        teamOwnerEmail: { type: String, required: true, index: true },
        teamUri: { type: String, required: true, index: true },
        teamName: { type: String, default: "" },
        teamLogo: { type: String, default: "" },
        targetEmail: { type: String, required: true, index: true },
        targetUri: { type: String, required: true, index: true },
        role: { type: String, default: "Player" },
        status: {
          type: String,
          enum: ["pending", "accepted", "declined", "cancelled"],
          default: "pending",
          index: true,
        },
        badgeId: { type: String, default: "" },
        respondedAt: Date,
      },
      { timestamps: true }
    );

    schema.index({ teamOwnerEmail: 1, targetEmail: 1, status: 1 });

    TeamInviteModel = conn.models.TeamInvite || conn.model("TeamInvite", schema);
  }

  return TeamInviteModel;
}
