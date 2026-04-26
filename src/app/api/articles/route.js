import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { getArticleModel } from "@/models/Article";
import { Page } from "@/models/Page";
import mongoose from "mongoose";

const norm = (s) => (s || "").toLowerCase().trim();

async function isAdminUser(session) {
  if (!session?.user?.email) return false;
  await mongoose.connect(process.env.MONGO_URI);
  const page = await Page.findOne({ owner: norm(session.user.email) }).lean();
  return page?.uri === "itsnicbtw";
}

export async function GET() {
  const Article = await getArticleModel();
  const articles = await Article.find({ status: "published" }).sort({ createdAt: -1 }).lean();
  return NextResponse.json({ ok: true, articles });
}

export async function POST(req) {
  const session = await getServerSession(authOptions);
  if (!(await isAdminUser(session))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const Article = await getArticleModel();

  const slug = body.title.toLowerCase().replace(/[^a-z0-9]+/g, "-");

  const article = await Article.create({
    slug,
    title: body.title,
    subtitle: body.subtitle,
    bannerImage: body.bannerImage,
    content: body.content,
    status: "published",
    createdBy: session.user.email,
  });

  return NextResponse.json({ ok: true, article });
}

export async function PATCH(req) {
  const session = await getServerSession(authOptions);
  if (!(await isAdminUser(session))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id, ...updates } = await req.json();
  const Article = await getArticleModel();

  await Article.updateOne({ _id: id }, updates);

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
