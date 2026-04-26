import { getArticleModel } from "@/models/Article";

export default async function ArticlePage({ params }) {
  const { slugId, slug } = params;

  const Article = await getArticleModel();

  const article = await Article.findOne({ slugId, slug }).lean();

  if (!article) {
    return <div className="text-white p-10">Article not found</div>;
  }

  return (
    <main className="min-h-screen bg-[#0b0f14] text-white px-4 py-10">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-black">{article.title}</h1>
        <div className="mt-4 text-white/70 text-sm">
          {new Date(article.createdAt).toLocaleString()}
        </div>

        <div className="mt-6 whitespace-pre-wrap text-white/90">
          {article.content}
        </div>
      </div>
    </main>
  );
}
