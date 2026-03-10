// src/models/ProfileEvent.js
import { model, models, Schema } from "mongoose";

const ProfileEventSchema = new Schema(
  {
    owner: { type: String, required: true, index: true },
    uri: { type: String, required: true, index: true },

    type: {
      type: String,
      enum: [
        "page_view",
        "outbound_click",
        "share_open",
        "share_copy",
        "share_native",
        "share_x",
      ],
      required: true,
      index: true,
    },

    anonId: { type: String, default: "", index: true },
    target: { type: String, default: "" },
    referrerHost: { type: String, default: "" },
    country: { type: String, default: "" },
    deviceType: { type: String, default: "" },
    browser: { type: String, default: "" },
    os: { type: String, default: "" },
  },
  { timestamps: true }
);

ProfileEventSchema.index({ owner: 1, uri: 1, createdAt: -1 });

export const ProfileEvent =
  models?.ProfileEvent || model("ProfileEvent", ProfileEventSchema);
