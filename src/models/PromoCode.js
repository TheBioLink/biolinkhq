import { model, models, Schema } from "mongoose";

const PromoCodeSchema = new Schema(
  {
    code: { type: String, required: true, unique: true, uppercase: true, trim: true },
    description: { type: String, default: "" },

    // What the promo applies to
    appliesTo: {
      type: [String],
      enum: ["badges", "basic", "premium", "exclusive", "all_subscriptions", "all"],
      default: ["all"],
    },

    // Discount
    discountPercent: { type: Number, required: true, min: 0, max: 99 },

    // Usage limits
    maxUses: { type: Number, default: 0 }, // 0 = unlimited
    usedCount: { type: Number, default: 0 },

    // Per-user limit
    maxUsesPerUser: { type: Number, default: 1 },

    // Expiry
    expiresAt: { type: Date, default: null },

    // Active toggle
    active: { type: Boolean, default: true },

    // Who created it
    createdBy: { type: String, default: "itsnicbtw" },

    // Track who used it
    usages: [
      {
        userEmail: { type: String, default: "" },
        usedAt: { type: Date, default: Date.now },
        appliedTo: { type: String, default: "" },
        discountAmount: { type: Number, default: 0 },
      },
    ],
  },
  { timestamps: true }
);

export const PromoCode = models?.PromoCode || model("PromoCode", PromoCodeSchema);
