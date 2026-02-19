import mongoose from "mongoose";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { Ban } from "@/models/Ban";

// simple normalize
const norm = (s) => (s || "").toString().trim().toLowerCase();

function deny(msg = "Forbidden") {
  return NextResponse.json({ error: msg }, { status: 403 });
}

export async function GET() {
  await mongoose.connect(process.env.MONGO_URI);
  const bans = await Ban.find({}).sort({ createdAt: -1 }).lean();
  return NextResponse.json({ bans });
}

export async function POST(req) {
  const session = await getServerSession(authOptions);
  const adminEmail = norm(session?.user?.email);

  // Only allow your founder/admin account to use this endpoint
  if (adminEmail !== "mrrunknown44@gmail.com") return deny("Not allowed");

  const body = await req.json().catch(() => ({}));
  const pass = norm(body?.passcode);

  if (!process.env.BAN_PASS_CODE) return deny("BAN_PASS_CODE not set");
  if (pass !== norm(process.env.BAN_PASS_CODE)) return deny("Wrong passcode");

  const action = norm(body?.action); // "ban" | "unban"
  const type = norm(body?.type); // "email" | "uri"
  const identifier = norm(body?.identifier);
  const reason = (body?.reason || "").toString().trim();

  if (!["ban", "unban"].includes(action)) {
    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  }
  if (!["email", "uri"].includes(type)) {
    return NextResponse.json({ error: "Invalid type" }, { status: 400 });
  }
  if (!identifier) {
    return NextResponse.json({ error: "Missing identifier" }, { status: 400 });
  }

  await mongoose.connect(process.env.MONGO_URI);

  if (action === "ban") {
    const doc = await Ban.findOneAndUpdate(
      { type, identifier },
      { $set: { reason, bannedBy: adminEmail } },
      { upsert: true, new: true }
    ).lean();

    return NextResponse.json({ ok: true, ban: doc });
  }

  // unban
  await Ban.deleteOne({ type, identifier });
  return NextResponse.json({ ok: true });
}
