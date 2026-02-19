import { model, models, Schema } from "mongoose";

const BanSchema = new Schema(
  {
    type: { type: String, enum: ["email", "uri"], required: true },
    identifier: { type: String, required: true }, // email or uri
    reason: { type: String, default: "" },
    bannedBy: { type: String, default: "" }, // admin email
  },
  { timestamps: true }
);

BanSchema.index({ type: 1, identifier: 1 }, { unique: true });

export const Ban = models?.Ban || model("Ban", BanSchema);
