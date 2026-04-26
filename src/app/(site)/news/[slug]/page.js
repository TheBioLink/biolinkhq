import { getArticleModel } from "@/models/Article";

export default async function ArticlePage({ params }) {
  const { slug } = params;

  const Article = await getArticleModel();

  const article = await Article.findOne({ slug, status: "published" }).lean();

  if (!article) {
    return <div className="text-white p-10">Article not found</div>;
  }

  return (
    <main className="min-h-screen bg-[#0b0f14] text-white">
      {article.bannerImage && (
        <div className="h-64 w-full">
          <img src={article.bannerImage} alt="banner" className="w-full h-full object-cover" />
        </div>
      )}

      <div className="max-w-3xl mx-auto px-4 py-10">
        <h1 className="text-4xl font-black">{article.title}</h1>
        <p className="text-white/60 mt-2">{article.subtitle}</p>

        <div className="mt-6 whitespace-pre-wrap text-white/90">
          {article.content}
        </div>
      </div>
    </main>
  );
}
