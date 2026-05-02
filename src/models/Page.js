// src/models/Page.js
import { model, models, Schema } from "mongoose";

const CreditTransactionSchema = new Schema(
  {
    amount: { type: Number, required: true },
    type: {
      type: String,
      enum: ["grant", "spend", "refund"],
      required: true,
    },
    note: { type: String, default: "" },
    givenBy: { type: String, default: "" },
  },
  { timestamps: true }
);

const TeamMemberSchema = new Schema(
  {
    username: { type: String, default: "" },
    role: { type: String, default: "" },
  },
  { _id: false }
);

const TeamDataSchema = new Schema(
  {
    tagline: { type: String, default: "" },
    description: { type: String, default: "" },
    game: { type: String, default: "" },
    region: { type: String, default: "" },
    recruiting: { type: Boolean, default: false },
    members: { type: [TeamMemberSchema], default: [] },
  },
  { _id: false }
);

const PageSchema = new Schema(
  {
    // ================= BASIC =================
    uri: { type: String, required: true, min: 1, unique: true },
    owner: { type: String, required: true },

    displayName: { type: String, default: "" },
    location: { type: String, default: "" },
    bio: { type: String, default: "" },

    profileImage: { type: String, default: "" },
    bannerImage: { type: String, default: "" },

    bgType: { type: String, default: "color" },
    bgColor: { type: String, default: "#000" },
    bgImage: { type: String, default: "" },

    buttons: { type: Object, default: {} },

    links: {
      type: [
        {
          title: { type: String, default: "" },
          url: { type: String, default: "" },
        },
      ],
      default: [],
    },

    // ================= TEAM PROFILE SYSTEM =================
    isTeam: { type: Boolean, default: false },
    teamData: { type: TeamDataSchema, default: () => ({}) },

    // ================= 💰 CREDITS SYSTEM =================
    credits: { type: Number, default: 0 },

    creditTransactions: {
      type: [CreditTransactionSchema],
      default: [],
    },

    // who can GIVE credits (only itsnicbtw)
    isAdmin: { type: Boolean, default: false },

    // ================= 🔓 ONE-TIME UNLOCKS =================
    // Keys: custom_background, advanced_analytics, remove_branding, premium_themes
    oneTimeUnlocks: {
      type: [String],
      default: [],
    },

    // ================= 💳 STRIPE =================
    stripeCustomerId: { type: String, default: "" },
    stripeCheckoutSessionId: { type: String, default: "" },
    stripeSubscriptionId: { type: String, default: "" },
    stripeSubscriptionStatus: { type: String, default: "" },

    stripeCurrentPlan: {
      type: String,
      enum: ["free", "basic", "premium", "exclusive"],
      default: "free",
    },

    stripeBillingCycle: { type: String, default: "" },
    stripePriceId: { type: String, default: "" },
    stripeUnitAmount: { type: Number, default: 0 },
    stripeCurrency: { type: String, default: "gbp" },
    stripeInterval: { type: String, default: "month" },

    stripeTrialEndsAt: { type: Date, default: null },
    stripeTrialUsed: { type: Boolean, default: false },

    stripeCurrentPeriodEnd: { type: Date, default: null },
    stripeCancelAtPeriodEnd: { type: Boolean, default: false },

    stripeLastInvoiceId: { type: String, default: "" },
    stripeLastEventType: { type: String, default: "" },

    // ================= 🔒 SPECIAL ACCESS =================
    permanentPlan: {
      type: String,
      enum: ["", "exclusive"],
      default: "",
    },

    // ================= 📊 ANALYTICS =================
    totalViews: { type: Number, default: 0 },
    totalClicks: { type: Number, default: 0 },

    analytics: {
      type: [
        {
          date: { type: Date },
          views: { type: Number, default: 0 },
          clicks: { type: Number, default: 0 },
        },
      ],
      default: [],
    },
  },
  { timestamps: true }
);

export const Page = models?.Page || model("Page", PageSchema);
