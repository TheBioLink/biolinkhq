import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { getArticleModel } from "@/models/Article";
import { Page } from "@/models/Page";
import mongoose from "mongoose";

const norm = (s) => (s || "").toLowerCase().trim();

export async function GET() {
  const Article = await getArticleModel();
  const articles = await Article.find().sort({ createdAt: -1 }).limit(20).lean();
  return NextResponse.json({ ok: true, articles });
}

export async function POST(req) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await mongoose.connect(process.env.MONGO_URI);

  const email = norm(session.user.email);
  const page = await Page.findOne({ owner: email }).lean();

  if (page?.uri !== "itsnicbtw") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();

  const Article = await getArticleModel();

  const slug = (body.title || "").toLowerCase().replace(/[^a-z0-9]+/g, "-");

  const article = await Article.create({
    slugId: page.uri,
    slug,
    title: body.title,
    content: body.content,
    createdBy: email,
  });

  return NextResponse.json({ ok: true, article });
}
