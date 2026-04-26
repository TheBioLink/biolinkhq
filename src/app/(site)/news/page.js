import { getArticleModel } from "@/models/Article";

export default async function NewsPage() {
  const Article = await getArticleModel();

  const articles = await Article.find({ status: "published" })
    .sort({ createdAt: -1 })
    .lean();

  return (
    <main className="min-h-screen bg-[#0b0f14] text-white px-4 py-10">
      <div className="max-w-4xl mx-auto space-y-6">
        <h1 className="text-3xl font-black">News</h1>

        {articles.map((a) => (
          <a
            key={a._id}
            href={`/news/${a.slug}`}
            className="block rounded-2xl border border-white/10 p-5 hover:bg-white/5"
          >
            <h2 className="text-xl font-bold">{a.title}</h2>
            <p className="text-white/60 mt-1">{a.subtitle}</p>
          </a>
        ))}
      </div>
    </main>
  );
}
