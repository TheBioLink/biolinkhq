// src/app/api/stripe/checkout/route.js
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import stripe from "@/libs/stripe";
import mongoose from "mongoose";
import { Page } from "@/models/Page";

const PLANS = {
  basic: {
    key: "basic",
    name: "Basic",
    monthlyAmount: 500,
    annualAmount: 5000,
    trialDays: 0,
  },
  premium: {
    key: "premium",
    name: "Premium",
    monthlyAmount: 2000,
    annualAmount: 20000,
    trialDays: 7,
  },
  exclusive: {
    key: "exclusive",
    name: "Exclusive",
    monthlyAmount: 10000,
    annualAmount: 100000,
    trialDays: 0,
  },
};

function normalizeEmail(email) {
  return String(email || "").toLowerCase().trim();
}

function getBaseUrl(req) {
  return (
    process.env.NEXTAUTH_URL ||
    req.headers.get("origin") ||
    "http://localhost:3000"
  );
}

export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const planKey = String(body?.plan || "").toLowerCase().trim();
    const billing = String(body?.billing || "monthly").toLowerCase().trim();

    const plan = PLANS[planKey];

    if (!plan) {
      return NextResponse.json(
        { error: "Invalid plan. Use basic, premium, or exclusive." },
        { status: 400 }
      );
    }

    if (billing !== "monthly" && billing !== "annual") {
      return NextResponse.json(
        { error: "Invalid billing. Use monthly or annual." },
        { status: 400 }
      );
    }

    const email = normalizeEmail(session.user.email);

    await mongoose.connect(process.env.MONGO_URI);

    const existingPage = await Page.findOne({ owner: email }).lean();

    if (
      existingPage?.stripeSubscriptionStatus &&
      ["active", "trialing", "past_due"].includes(existingPage.stripeSubscriptionStatus)
    ) {
      return NextResponse.json(
        { error: "You already have a subscription. Manage it from your dashboard." },
        { status: 400 }
      );
    }

    const interval = billing === "annual" ? "year" : "month";
    const unitAmount =
      billing === "annual" ? plan.annualAmount : plan.monthlyAmount;

    const baseUrl = getBaseUrl(req);

    const checkoutSession = await stripe.checkout.sessions.create({
      mode: "subscription",
      success_url: `${baseUrl}/account?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/pricing?checkout=cancelled`,
      customer_email: email,
      billing_address_collection: "auto",
      allow_promotion_codes: true,
      metadata: {
        email,
        plan: plan.key,
        billing,
      },
      subscription_data: {
        metadata: {
          email,
          plan: plan.key,
          billing,
        },
        ...(plan.key === "premium" && billing === "monthly"
          ? { trial_period_days: plan.trialDays }
          : {}),
      },
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: "gbp",
            unit_amount: unitAmount,
            recurring: {
              interval,
            },
            product_data: {
              name: `BiolinkHQ ${plan.name} ${billing === "annual" ? "Annual" : "Monthly"}`,
              description:
                plan.key === "premium" && billing === "monthly"
                  ? "Premium monthly subscription with a 7-day free trial"
                  : `${plan.name} ${billing} subscription`,
              metadata: {
                plan: plan.key,
                billing,
              },
            },
          },
        },
      ],
    });

    return NextResponse.json({
      ok: true,
      url: checkoutSession.url,
      id: checkoutSession.id,
    });
  } catch (error) {
    console.error("Stripe checkout error:", error);

    return NextResponse.json(
      {
        error: "Failed to create checkout session",
        details: error?.message || "Unknown error",
      },
      { status: 500 }
    );
  }
}
