import mongoose from "mongoose";
import { badgeDb } from "@/libs/badgeDb";

let BadgeModel;
let UserBadgeModel;

export async function getBadgeModels() {
  const conn = await badgeDb();

  if (!BadgeModel) {
    const BadgeSchema = new mongoose.Schema({
      name: String,
      icon: String,
      type: { type: String, enum: ["public", "private"], default: "public" },
      createdBy: String,
    }, { timestamps: true });

    const UserBadgeSchema = new mongoose.Schema({
      badgeId: mongoose.Schema.Types.ObjectId,
      ownerEmail: String,
      visible: { type: Boolean, default: true },
    }, { timestamps: true });

    BadgeModel = conn.model("Badge", BadgeSchema);
    UserBadgeModel = conn.model("UserBadge", UserBadgeSchema);
  }

  return { BadgeModel, UserBadgeModel };
}
