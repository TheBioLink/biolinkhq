import mongoose from "mongoose";

const { model, models, Schema } = mongoose;

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
    creditOriginUserId: { type: String, default: null },
  },
  { _id: false }
);

const UserSchema = new Schema(
  {
    email: { type: String, required: true, unique: true },
    name: String,

    credits: { type: Number, default: 0 },

    hasPaymentMethod: { type: Boolean, default: false },

    referralCode: String,
    referredBy: String,

    blockedUsers: {
      type: [String],
      default: [],
    },

    referralEarnings: [
      {
        referredUser: String,
        plan: String,
        timestamp: Date,
      },
    ],

    creditSubscriptions: [
      {
        startedAt: Date,
        plan: String,
        creditsUsed: Number,
      },
    ],

    subscription: {
      type: SubscriptionSchema,
      default: () => ({
        trial_end: new Date(Date.now() + 7 * 86400000),
      }),
    },
  },
  { timestamps: true }
);

export const User = models.User || model("User", UserSchema);
