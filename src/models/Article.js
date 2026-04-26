import mongoose from "mongoose";
import { newsDb } from "@/libs/newsDb";

let ArticleModel;

export async function getArticleModel() {
  if (ArticleModel) return ArticleModel;

  const conn = await newsDb();

  const schema = new mongoose.Schema(
    {
      slugId: { type: String, required: true, index: true },
      slug: { type: String, required: true },
      title: String,
      content: String,
      createdBy: String,
    },
    { timestamps: true }
  );

  ArticleModel = conn.models.Article || conn.model("Article", schema);
  return ArticleModel;
}
