import mongoose from "mongoose";
import { badgeDb } from "@/libs/badgeDb";

let BadgeModel;
let UserBadgeModel;

export async function getBadgeModels() {
  const conn = await badgeDb();

  if (!BadgeModel) {
    const BadgeSchema = new mongoose.Schema(
      {
        name: { type: String, required: true, trim: true },
        icon: { type: String, default: "" },
        type: { type: String, enum: ["public", "private"], default: "public" },
        createdBy: { type: String, default: "" },
        claimLimit: { type: Number, default: 0 },
        claimEndsAt: { type: Date, default: null },
        isActive: { type: Boolean, default: true },
      },
      { timestamps: true }
    );

    const UserBadgeSchema = new mongoose.Schema(
      {
        badgeId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
        ownerEmail: { type: String, required: true, lowercase: true, trim: true, index: true },
        visible: { type: Boolean, default: true },
        grantedBy: { type: String, default: "" },
      },
      { timestamps: true }
    );

    UserBadgeSchema.index({ badgeId: 1, ownerEmail: 1 }, { unique: true });

    BadgeModel = conn.models.Badge || conn.model("Badge", BadgeSchema);
    UserBadgeModel = conn.models.UserBadge || conn.model("UserBadge", UserBadgeSchema);
  }

  return { BadgeModel, UserBadgeModel };
}
