import mongoose from "mongoose";
import { teamDb } from "@/libs/teamDb";

let TeamProfileModel;

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
          },
        ],
      },
      { timestamps: true }
    );

    TeamProfileModel =
      conn.models.TeamProfile || conn.model("TeamProfile", schema);
  }

  return TeamProfileModel;
}
