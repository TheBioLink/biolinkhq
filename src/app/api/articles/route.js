import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { getArticleModel } from "@/models/Article";
import { Page } from "@/models/Page";
import mongoose from "mongoose";

const norm = (s) => (s || "").toString().toLowerCase().trim();
const clean = (s, max = 1000) => String(s || "").trim().slice(0, max);

function slugify(value) {
  return clean(value, 120)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || `article-${Date.now()}`;
}

function serializeArticle(article) {
  if (!article) return null;
  return {
    id: String(article._id),
    slug: article.slug || "",
    title: article.title || "",
    subtitle: article.subtitle || "",
    bannerImage: article.bannerImage || "",
    content: article.content || "",
    status: article.status || "published",
    createdAt: article.createdAt ? new Date(article.createdAt).toISOString() : null,
    updatedAt: article.updatedAt ? new Date(article.updatedAt).toISOString() : null,
  };
}

async function isAdminUser(session) {
  if (!session?.user?.email) return false;
  if (mongoose.connection.readyState !== 1) {
    await mongoose.connect(process.env.MONGO_URI);
  }
  const page = await Page.findOne({ owner: norm(session.user.email) }).lean();
  return norm(page?.uri) === "itsnicbtw";
}

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const slug = searchParams.get("slug");
    const Article = await getArticleModel();

    if (slug) {
      const article = await Article.findOne({ slug, status: "published" }).lean();
      return NextResponse.json({ ok: true, article: serializeArticle(article) });
    }

    const articles = await Article.find({ status: "published" }).sort({ createdAt: -1 }).lean();
    return NextResponse.json({ ok: true, articles: articles.map(serializeArticle) });
  } catch (error) {
    console.error("Articles GET error:", error);
    return NextResponse.json({ ok: false, error: "Failed to load articles" }, { status: 500 });
  }
}

export async function POST(req) {
  const session = await getServerSession(authOptions);
  if (!(await isAdminUser(session))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const Article = await getArticleModel();

  const title = clean(body.title, 140);
  const slug = slugify(body.slug || title);

  if (!title) return NextResponse.json({ error: "Title is required" }, { status: 400 });

  const article = await Article.create({
    slug,
    title,
    subtitle: clean(body.subtitle, 220),
    bannerImage: clean(body.bannerImage, 1000),
    content: clean(body.content, 50000),
    status: body.status === "draft" ? "draft" : "published",
    createdBy: session.user.email,
  });

  return NextResponse.json({ ok: true, article: serializeArticle(article) });
}

export async function PATCH(req) {
  const session = await getServerSession(authOptions);
  if (!(await isAdminUser(session))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const Article = await getArticleModel();

  const update = {
    title: clean(body.title, 140),
    subtitle: clean(body.subtitle, 220),
    bannerImage: clean(body.bannerImage, 1000),
    content: clean(body.content, 50000),
    status: body.status === "draft" ? "draft" : "published",
    updatedBy: session.user.email,
  };

  if (body.slug) update.slug = slugify(body.slug);

  await Article.updateOne({ _id: body.id }, { $set: update });

  return NextResponse.json({ ok: true });
}

export async function DELETE(req) {
  const session = await getServerSession(authOptions);
  if (!(await isAdminUser(session))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await req.json();
  const Article = await getArticleModel();

  await Article.deleteOne({ _id: id });

  return NextResponse.json({ ok: true });
}
