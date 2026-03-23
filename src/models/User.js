import mongoose from "mongoose";

const { model, models, Schema } = mongoose;

// 🔥 Subscription schema
const SubscriptionSchema = new Schema(
  {
    status: {
      type: String,
      enum: ["trialing", "active", "past_due", "canceled", "expired"],
      default: "trialing",
    },

    trial_end: Date,
    current_period_end: Date,

    has_paid: { type: Boolean, default: false },
    cancelled_at: Date,

    startedWithCredits: { type: Boolean, default: false },
  },
  { _id: false }
);

const UserSchema = new Schema(
  {
    email: { type: String, required: true, unique: true, index: true },
    name: { type: String, default: "" },
    image: { type: String, default: "" },

    discordId: String,
    discordUsername: String,

    credits: { type: Number, default: 0 },

    psid: { type: Number, unique: true, sparse: true, index: true },

    // 💳 billing
    hasPaymentMethod: { type: Boolean, default: false },

    // 🔗 referrals
    referralCode: { type: String, unique: true, sparse: true },
    referredBy: { type: String, default: null },

    referralEarnings: [
      {
        referredUser: String,
        plan: String,
        timestamp: Date,
      },
    ],

    // 💰 credit-based subscriptions
    creditSubscriptions: [
      {
        startedAt: Date,
        plan: String,
        creditsUsed: Number,
      },
    ],

    // 🔥 subscription
    subscription: {
      type: SubscriptionSchema,
      default: () => ({
        status: "trialing",
        trial_end: new Date(Date.now() + 7 * 86400000),
        has_paid: false,
        startedWithCredits: false,
      }),
    },
  },
  { timestamps: true }
);

export const User = models.User || model("User", UserSchema);
