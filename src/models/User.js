import { model, models, Schema } from "mongoose";

const UserSchema = new Schema(
  {
    email: { type: String, required: true, unique: true, index: true },
    name: { type: String, default: "" },
    image: { type: String, default: "" },
    discordId: { type: String, default: "" },
    discordUsername: { type: String, default: "" },
    credits: { type: Number, default: 0, min: 0 },

    // Shared numeric ID used to link the main BioLink profile
    // to the esports identity profile stored in L_DB.
    psid: { type: Number, unique: true, sparse: true, index: true },
  },
  { timestamps: true }
);

export const User = models?.User || model("User", UserSchema);
