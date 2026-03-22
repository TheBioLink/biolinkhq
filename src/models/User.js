import { model, models, Schema } from "mongoose";

const SubscriptionSchema = new Schema(
  {
    status: {
      type: String,
      enum: ["trialing", "active", "past_due", "canceled", "expired"],
      default: "trialing",
    },

    trial_end: {
      type: Date,
      default: null,
    },

    current_period_end: {
      type: Date,
      default: null,
    },

    has_paid: {
      type: Boolean,
      default: false,
    },

    cancelled_at: {
      type: Date,
      default: null,
    },
  },
  { _id: false }
);

const UserSchema = new Schema(
  {
    email: { type: String, required: true, unique: true, index: true },
    name: { type: String, default: "" },
    image: { type: String, default: "" },
    discordId: { type: String, default: "" },
    discordUsername: { type: String, default: "" },
    credits: { type: Number, default: 0, min: 0 },

    psid: { type: Number, unique: true, sparse: true, index: true },

    // 🔥 ADD THIS
    subscription: {
      type: SubscriptionSchema,
      default: () => ({
        status: "trialing",
        trial_end: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7-day trial
        current_period_end: null,
        has_paid: false,
        cancelled_at: null,
      }),
    },
  },
  { timestamps: true }
);

export const User = models?.User || model("User", UserSchema);
