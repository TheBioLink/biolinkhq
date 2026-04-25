import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { Message } from "@/models/Message";

export const runtime = "nodejs";

function norm(s) {
  return (s || "").toLowerCase().trim();
}

export async function GET(req) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await mongoose.connect(process.env.MONGO_URI);

  const { searchParams } = new URL(req.url);
  const withUser = norm(searchParams.get("with"));
  const me = norm(session.user.email);

  const messages = await Message.find({
    $or: [
      { fromEmail: me, toEmail: withUser },
      { fromEmail: withUser, toEmail: me },
    ],
  }).sort({ createdAt: 1 }).limit(50).lean();

  return NextResponse.json({ messages });
}

export async function POST(req) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await mongoose.connect(process.env.MONGO_URI);

  const { toEmail, body } = await req.json();

  const message = await Message.create({
    fromEmail: norm(session.user.email),
    toEmail: norm(toEmail),
    body,
  });

  return NextResponse.json({ ok: true });
}
