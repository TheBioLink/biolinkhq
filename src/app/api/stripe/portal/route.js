// src/app/api/stripe/portal/route.js
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import mongoose from "mongoose";
import stripe from "@/libs/stripe";
import { Page } from "@/models/Page";

export const runtime = "nodejs";

function normalizeEmail(email) {
  return String(email || "").toLowerCase().trim();
}

export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await mongoose.connect(process.env.MONGO_URI);

    const page = await Page.findOne({
      owner: normalizeEmail(session.user.email),
    }).lean();

    if (!page?.stripeCustomerId || !page?.stripeSubscriptionId) {
      return NextResponse.json(
        { error: "No subscription found" },
        { status: 404 }
      );
    }

    if (
      !["active", "trialing", "past_due"].includes(
        String(page?.stripeSubscriptionStatus || "").toLowerCase()
      )
    ) {
      return NextResponse.json(
        { error: "Subscription is not eligible for billing management" },
        { status: 400 }
      );
    }

    const origin =
      process.env.NEXTAUTH_URL ||
      req.headers.get("origin") ||
      "http://localhost:3000";

    const portal = await stripe.billingPortal.sessions.create({
      customer: page.stripeCustomerId,
      return_url: `${origin}/account?tab=premium`,
    });

    return NextResponse.json({
      ok: true,
      url: portal.url,
    });
  } catch (error) {
    console.error("Stripe portal error:", error);

    return NextResponse.json(
      {
        error: "Failed to create billing portal session",
        details: error?.message || "Unknown error",
      },
      { status: 500 }
    );
  }
}
