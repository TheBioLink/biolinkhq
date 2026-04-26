import mongoose from "mongoose";
import { newsDb } from "@/libs/newsDb";

let ArticleModel;

export async function getArticleModel() {
  if (ArticleModel) return ArticleModel;

  const conn = await newsDb();

  const schema = new mongoose.Schema(
    {
      slug: { type: String, required: true, unique: true, index: true },
      title: { type: String, required: true, trim: true },
      subtitle: { type: String, default: "" },
      bannerImage: { type: String, default: "" },
      content: { type: String, default: "" },
      status: { type: String, enum: ["draft", "published"], default: "published", index: true },
      createdBy: { type: String, default: "" },
      updatedBy: { type: String, default: "" },
    },
    { timestamps: true }
  );

  ArticleModel = conn.models.Article || conn.model("Article", schema);
  return ArticleModel;
}
