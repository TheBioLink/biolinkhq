import mongoose from "mongoose";
import { messageDb } from "@/libs/messageDb";

let TweetModel;

export async function getTweetModel() {
  const conn = await messageDb();

  if (!TweetModel) {
    const TweetSchema = new mongoose.Schema(
      {
        authorEmail: { type: String, required: true, lowercase: true, trim: true, index: true },
        authorUri: { type: String, required: true, trim: true, index: true },
        authorDisplayName: { type: String, default: "" },
        authorProfileImage: { type: String, default: "" },
        body: { type: String, required: true, trim: true, maxlength: 280 },
        likes: { type: [String], default: [] }, // array of emails who liked
        replyTo: { type: mongoose.Schema.Types.ObjectId, default: null, index: true }, // parent tweet id
        retweetOf: { type: mongoose.Schema.Types.ObjectId, default: null }, // original tweet id
        deleted: { type: Boolean, default: false },
      },
      { timestamps: true }
    );

    TweetSchema.index({ authorEmail: 1, createdAt: -1 });
    TweetSchema.index({ createdAt: -1 });
    TweetSchema.index({ replyTo: 1, createdAt: 1 });

    TweetModel = conn.models.Tweet || conn.model("Tweet", TweetSchema);
  }

  return TweetModel;
}
