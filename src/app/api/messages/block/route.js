import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import mongoose from "mongoose";
import { Page } from "@/models/Page";

const norm = (s) => (s || "").toString().toLowerCase().trim();

async function connectDb() {
  if (mongoose.connection.readyState !== 1) {
    await mongoose.connect(process.env.MONGO_URI);
  }
}

// Simple block schema inline
let BlockModel;
function getBlockModel() {
  if (BlockModel) return BlockModel;
  const schema = new mongoose.Schema({
    blockerEmail: { type: String, required: true },
    blockedEmail: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
  });
  schema.index({ blockerEmail: 1, blockedEmail: 1 }, { unique: true });
  BlockModel = mongoose.models.Block || mongoose.model("Block", schema);
  return BlockModel;
}

export async function POST(req) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await connectDb();
  const { username, action } = await req.json();
  const target = await Page.findOne({ uri: norm(username) }).lean();
  if (!target?.owner)
    return NextResponse.json({ error: "User not found" }, { status: 404 });

  const Block = getBlockModel();
  const blockerEmail = norm(session.user.email);
  const blockedEmail = norm(target.owner);

  if (action === "unblock") {
    await Block.deleteOne({ blockerEmail, blockedEmail });
    return NextResponse.json({ ok: true, blocked: false });
  }

  await Block.updateOne(
    { blockerEmail, blockedEmail },
    { $setOnInsert: { blockerEmail, blockedEmail } },
    { upsert: true }
  );
  return NextResponse.json({ ok: true, blocked: true });
}

export async function GET(req) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await connectDb();
  const Block = getBlockModel();
  const blockerEmail = norm(session.user.email);
  const blocks = await Block.find({ blockerEmail }).lean();
  return NextResponse.json({ blocked: blocks.map((b) => b.blockedEmail) });
}
