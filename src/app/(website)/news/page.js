"use client";

import { getArticleModel } from "@/models/Article";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function NewsPage() {
  let articles = [];
  let loadError = false;

  try {
    const Article = await getArticleModel();

    articles = await Article.find({ status: "published" })
      .sort({ createdAt: -1 })
      .lean();
  } catch (error) {
    console.error("News page failed to load articles:", error);
    loadError = true;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-black">News</h1>

      {loadError && (
        <div className="rounded-2xl border border-yellow-500/20 bg-yellow-500/10 p-4 text-sm text-yellow-100">
          News is temporarily unavailable. Please check back shortly.
        </div>
      )}

      {!loadError && articles.length === 0 && (
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 text-white/50">
          No articles have been published yet.
        </div>
      )}

      {articles.map((a) => (
        <a
          key={String(a._id)}
          href={`/news/${a.slug}`}
          className="block rounded-2xl border border-white/10 p-5 hover:bg-white/5"
        >
          <h2 className="text-xl font-bold">{a.title}</h2>
          <p className="text-white/60 mt-1">{a.subtitle}</p>
        </a>
      ))}
    </div>
  );
}
