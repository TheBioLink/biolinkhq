// src/app/api/stripe/checkout/route.js
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import stripe from "@/libs/stripe";
import {
  connectDb,
  ensurePermanentExclusiveForPage,
  findPageByOwner,
  normalizeEmail,
} from "@/libs/stripe-subscriptions";

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

    if (!["monthly", "annual"].includes(billing)) {
      return NextResponse.json(
        { error: "Invalid billing. Use monthly or annual." },
        { status: 400 }
      );
    }

    const email = normalizeEmail(session.user.email);

    await connectDb();

    let page = await findPageByOwner(email);

    if (!page) {
      return NextResponse.json(
        { error: "No page found for this account" },
        { status: 404 }
      );
    }

    page = await ensurePermanentExclusiveForPage(page);

    if (page?.permanentPlan === "exclusive") {
      return NextResponse.json(
        { error: "This account already has permanent Exclusive access." },
        { status: 400 }
      );
    }

    if (
      ["active", "trialing", "past_due"].includes(
        String(page?.stripeSubscriptionStatus || "").toLowerCase()
      )
    ) {
      return NextResponse.json(
        { error: "You already have a subscription. Manage it from your dashboard." },
        { status: 400 }
      );
    }

    const interval = billing === "annual" ? "year" : "month";
    const unitAmount =
      billing === "annual" ? plan.annualAmount : plan.monthlyAmount;

    const trialDays =
      plan.key === "premium" &&
      billing === "monthly" &&
      !page?.stripeTrialUsed
        ? plan.trialDays
        : 0;

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
        isTrial:
          trialDays > 0 && plan.key === "premium" && billing === "monthly"
            ? "true"
            : "false",
      },
      subscription_data: {
        metadata: {
          email,
          plan: plan.key,
          billing,
          isTrial:
            trialDays > 0 && plan.key === "premium" && billing === "monthly"
              ? "true"
              : "false",
        },
        ...(trialDays > 0 ? { trial_period_days: trialDays } : {}),
      },
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: "gbp",
            unit_amount: unitAmount,
            recurring: { interval },
            product_data: {
              name: `BiolinkHQ ${plan.name} ${billing === "annual" ? "Annual" : "Monthly"}`,
              description:
                trialDays > 0
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
