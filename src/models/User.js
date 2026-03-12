// src/models/User.js
import { model, models, Schema } from "mongoose";

const UserSchema = new Schema(
  {
    email: { type: String, required: true, unique: true },

    name: { type: String, default: "" },
    image: { type: String, default: "" },

    discordId: { type: String, default: "" },
    discordUsername: { type: String, default: "" },

    credits: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true }
);

export const User = models?.User || model("User", UserSchema);
