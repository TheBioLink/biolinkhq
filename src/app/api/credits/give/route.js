// src/app/api/credits/give/route.js
import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { User } from "@/models/User";
import { Page } from "@/models/Page";
import { isItsNic, normalizeEmail } from "@/libs/credits";

export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await mongoose.connect(process.env.MONGO_URI);

    const giverEmail = normalizeEmail(session.user.email);
    const giverPage = await Page.findOne({ owner: giverEmail }).lean();

    if (!isItsNic({ email: giverEmail, uri: giverPage?.uri })) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const recipientEmail = normalizeEmail(body?.email);
    const amount = Number(body?.amount);

    if (!recipientEmail || !Number.isInteger(amount) || amount <= 0) {
      return NextResponse.json(
        { error: "Enter a valid email and whole-number credit amount" },
        { status: 400 }
      );
    }

    if (recipientEmail === giverEmail) {
      return NextResponse.json(
        { error: "You cannot give credits to yourself" },
        { status: 400 }
      );
    }

    const recipient = await User.findOne({ email: recipientEmail });

    if (!recipient) {
      return NextResponse.json(
        { error: "Recipient account not found" },
        { status: 404 }
      );
    }

    recipient.credits = Number(recipient.credits || 0) + amount;
    await recipient.save();

    return NextResponse.json({
      ok: true,
      recipientCredits: recipient.credits,
      recipientEmail: recipient.email,
      amount,
    });
  } catch (error) {
    console.error("Give credits error:", error);

    return NextResponse.json(
      {
        error: "Failed to give credits",
        details: error?.message || "Unknown error",
      },
      { status: 500 }
    );
  }
}
