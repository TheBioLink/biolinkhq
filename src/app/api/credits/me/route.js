import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { User } from "@/models/User";
import { normalizeEmail } from "@/libs/credits";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await mongoose.connect(process.env.MONGO_URI);

    const email = normalizeEmail(session.user.email);
    const user = await User.findOne({ email }).select("credits").lean();

    return NextResponse.json({
      ok: true,
      credits: Number(user?.credits || 0),
    });
  } catch (error) {
    console.error("Load credits error:", error);

    return NextResponse.json(
      {
        error: "Failed to load credits",
        details: error?.message || "Unknown error",
      },
      { status: 500 }
    );
  }
}
