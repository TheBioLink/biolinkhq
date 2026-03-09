import { model, models, Schema } from "mongoose";

const PageSchema = new Schema(
  {
    uri: { type: String, required: true, min: 1, unique: true },
    owner: { type: String, required: true },

    // Profile info
    displayName: { type: String, default: "" },
    location: { type: String, default: "" },
    bio: { type: String, default: "" },

    // Images
    profileImage: { type: String, default: "" },
    bannerImage: { type: String, default: "" },

    // Background
    bgType: { type: String, default: "color" }, // 'color' | 'image'
    bgColor: { type: String, default: "#000" },
    bgImage: { type: String, default: "" },

    // Buttons
    buttons: { type: Object, default: {} },

    // Links
    links: {
      type: [
        {
          title: { type: String, default: "" },
          url: { type: String, default: "" },
        },
      ],
      default: [],
    },

    /* ---------------- STRIPE ---------------- */

    stripeCustomerId: { type: String, default: "" },

    stripeSubscriptionId: { type: String, default: "" },

    stripeSubscriptionStatus: { type: String, default: "" },

    stripeCurrentPlan: {
      type: String,
      enum: ["free", "basic", "premium", "exclusive"],
      default: "free",
    },

    stripeUnitAmount: { type: Number, default: 0 },

    stripeCurrency: { type: String, default: "gbp" },

    stripeInterval: { type: String, default: "month" },

    stripeCurrentPeriodEnd: { type: Date, default: null },

    stripeCancelAtPeriodEnd: { type: Boolean, default: false },

    stripeLastInvoiceId: { type: String, default: "" },

    stripeLastEventType: { type: String, default: "" },
  },
  { timestamps: true }
);

export const Page = models?.Page || model("Page", PageSchema);
