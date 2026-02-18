import { model, models, Schema } from "mongoose";

const PageSchema = new Schema(
  {
    uri: { type: String, required: true, min: 1, unique: true },
    owner: { type: String, required: true },

    // Profile info
    displayName: { type: String, default: "" },
    location: { type: String, default: "" },
    bio: { type: String, default: "" },

    // NEW: Profile + Banner Images
    profileImage: { type: String, default: "" },
    bannerImage: { type: String, default: "" },

    // Background
    bgType: { type: String, default: "color" }, // 'color' | 'image'
    bgColor: { type: String, default: "#000" },
    bgImage: { type: String, default: "" },

    // Buttons (legacy object structure preserved)
    buttons: { type: Object, default: {} },

    // FIXED: Links should be an array, not Object
    links: {
      type: [
        {
          title: { type: String, default: "" },
          url: { type: String, default: "" },
        },
      ],
      default: [],
    },
  },
  { timestamps: true }
);

export const Page = models?.Page || model("Page", PageSchema);
