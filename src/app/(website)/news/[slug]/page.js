import { getArticleModel } from "@/models/Article";

export default async function ArticlePage({ params }) {
  const { slug } = params;

  const Article = await getArticleModel();

  const article = await Article.findOne({ slug, status: "published" }).lean();

  if (!article) {
    return <div>Article not found</div>;
  }

  return (
    <div className="space-y-6">
      {article.bannerImage && (
        <img src={article.bannerImage} className="w-full h-64 object-cover rounded-2xl" />
      )}

      <h1 className="text-4xl font-black">{article.title}</h1>
      <p className="text-white/60">{article.subtitle}</p>

      <div className="whitespace-pre-wrap text-white/90">
        {article.content}
      </div>
    </div>
  );
}
