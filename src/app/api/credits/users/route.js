// src/app/api/credits/users/route.js
import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { User } from "@/models/User";
import { Page } from "@/models/Page";
import { isItsNic, normalizeEmail } from "@/libs/credits";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await mongoose.connect(process.env.MONGO_URI);

    const email = normalizeEmail(session.user.email);
    const page = await Page.findOne({ owner: email }).lean();

    if (!isItsNic({ email, uri: page?.uri })) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const users = await User.find({})
      .sort({ createdAt: -1 })
      .select("_id email discordUsername discordId credits createdAt")
      .lean();

    return NextResponse.json({
      ok: true,
      users,
    });
  } catch (error) {
    console.error("Credits users list error:", error);

    return NextResponse.json(
      {
        error: "Failed to load users",
        details: error?.message || "Unknown error",
      },
      { status: 500 }
    );
  }
}
