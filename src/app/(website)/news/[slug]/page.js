"use client";

import { getArticleModel } from "@/models/Article";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function ArticlePage({ params }) {
  const { slug } = params;

  let article = null;

  try {
    const Article = await getArticleModel();
    article = await Article.findOne({ slug, status: "published" }).lean();
  } catch (error) {
    console.error("Article page failed:", error);
  }

  if (!article) {
    return <div className="p-10 text-white">Article not found or unavailable</div>;
  }

  return (
    <div className="space-y-6">
      {article.bannerImage && (
        <img src={article.bannerImage} alt="banner" className="w-full h-64 object-cover rounded-2xl" />
      )}

      <h1 className="text-4xl font-black">{article.title}</h1>
      <p className="text-white/60">{article.subtitle}</p>

      <div className="whitespace-pre-wrap text-white/90">
        {article.content}
      </div>
    </div>
  );
}
