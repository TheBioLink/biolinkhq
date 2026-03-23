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
import { User } from "@/models/User";

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
    const paymentOption = String(body?.paymentOption || "card").toLowerCase().trim();

    const plan = PLANS[planKey];

    if (!plan) {
      return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
    }

    const email = normalizeEmail(session.user.email);

    await connectDb();

    let page = await findPageByOwner(email);

    if (!page) {
      return NextResponse.json({ error: "No page found" }, { status: 404 });
    }

    page = await ensurePermanentExclusiveForPage(page);

    const user = await User.findOne({ email });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const unitAmount =
      billing === "annual" ? plan.annualAmount : plan.monthlyAmount;

    // 💰 CREDIT LOGIC (FINAL)
    const userCredits = Number(user.credits || 0);

    const periodsCovered = Math.floor(userCredits / unitAmount);

    const useCredits = paymentOption === "credits" && periodsCovered > 0;

    // ❗ REQUIRE CARD
    if (paymentOption === "credits" && !user.hasPaymentMethod) {
      return NextResponse.json(
        { error: "Add a payment method before using credits." },
        { status: 400 }
      );
    }

    // 📆 CALCULATE CREDIT COVERAGE
    let creditDays = 0;

    if (useCredits) {
      creditDays =
        billing === "annual"
          ? periodsCovered * 365
          : periodsCovered * 30;
    }

    const effectiveTrialDays = useCredits ? creditDays : plan.trialDays;

    const baseUrl = getBaseUrl(req);

    const checkoutSession = await stripe.checkout.sessions.create({
      mode: "subscription",
      success_url: `${baseUrl}/account?success=1`,
      cancel_url: `${baseUrl}/pricing?cancel=1`,
      customer_email: email,

      payment_method_collection: "always", // 🔥 ensures card is collected
      payment_method_types: ["card"],

      metadata: {
        email,
        plan: plan.key,
        billing,
        usedCredits: useCredits ? "true" : "false",
        periodsCovered: String(periodsCovered),
        creditsUsed: String(periodsCovered * unitAmount),
      },

      subscription_data: {
        metadata: {
          email,
          plan: plan.key,
          billing,
          usedCredits: useCredits ? "true" : "false",
          periodsCovered: String(periodsCovered),
          creditsUsed: String(periodsCovered * unitAmount),
        },
        ...(effectiveTrialDays > 0
          ? { trial_period_days: effectiveTrialDays }
          : {}),
      },

      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: "gbp",
            unit_amount: unitAmount,
            recurring: {
              interval: billing === "annual" ? "year" : "month",
            },
            product_data: {
              name: `BiolinkHQ ${plan.name}`,
              description: useCredits
                ? `${periodsCovered} billing period(s) covered with credits. Card will be charged after.`
                : `${plan.name} subscription`,
            },
          },
        },
      ],
    });

    // 🔥 DEDUCT CREDITS (CRITICAL)
    if (useCredits) {
      const creditsToUse = periodsCovered * unitAmount;

      user.credits -= creditsToUse;

      // track credit usage
      user.creditSubscriptions.push({
        startedAt: new Date(),
        plan: plan.key,
        creditsUsed: creditsToUse,
      });

      user.subscription.startedWithCredits = true;

      await user.save();
    }

    return NextResponse.json({
      url: checkoutSession.url,
      usedCredits: useCredits,
      creditsUsed: periodsCovered * unitAmount,
      periodsCovered,
    });
  } catch (err) {
    console.error(err);

    return NextResponse.json(
      { error: "Checkout failed", details: err.message },
      { status: 500 }
    );
  }
}
