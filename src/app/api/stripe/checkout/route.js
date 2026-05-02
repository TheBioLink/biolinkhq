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
import { User } from "@/models/User";
import { PromoCode } from "@/models/PromoCode";

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

const norm = (s) => (s || "").toString().toLowerCase().trim();

/**
 * Validate a promo code and return the Stripe coupon ID to apply.
 * Creates a one-off Stripe coupon each time so the discount is enforced
 * server-side and shows up correctly in the Stripe dashboard / receipt.
 */
async function resolveStripeCoupon(promoCode, planKey, userEmail) {
  if (!promoCode) return null;

  try {
    const promo = await PromoCode.findOne({
      code: promoCode.toUpperCase().trim(),
      active: true,
    });

    if (!promo) return null;

    const now = new Date();
    if (promo.expiresAt && now > new Date(promo.expiresAt)) return null;
    if (promo.maxUses > 0 && promo.usedCount >= promo.maxUses) return null;

    // Check per-user limit
    const userUsages = promo.usages.filter(
      (u) => norm(u.userEmail) === norm(userEmail)
    );
    if (promo.maxUsesPerUser > 0 && userUsages.length >= promo.maxUsesPerUser) {
      return null;
    }

    // Check it applies to this plan
    const applies =
      promo.appliesTo.includes("all") ||
      promo.appliesTo.includes(planKey) ||
      promo.appliesTo.includes("all_subscriptions");

    if (!applies) return null;

    // Create a Stripe coupon for this discount percentage
    // Using a deterministic ID so we don't create duplicates for the same code
    const couponId = `promo_${promo.code}_${promo.discountPercent}pct`;

    let coupon;
    try {
      // Try to retrieve existing coupon first
      coupon = await stripe.coupons.retrieve(couponId);
    } catch {
      // Doesn't exist yet — create it
      coupon = await stripe.coupons.create({
        id: couponId,
        percent_off: promo.discountPercent,
        duration: "once", // applies to first invoice only
        name: `${promo.code} (${promo.discountPercent}% off)`,
      });
    }

    return coupon.id;
  } catch (err) {
    console.error("resolveStripeCoupon error:", err);
    return null;
  }
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
    const promoCode = String(body?.promoCode || "").trim();

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

    // ── Credit logic ──────────────────────────────────────────────────────────
    const userCredits = Number(user.credits || 0);
    const periodsCovered = Math.floor(userCredits / unitAmount);
    const useCredits = paymentOption === "credits" && periodsCovered > 0;

    if (paymentOption === "credits" && !user.hasPaymentMethod) {
      return NextResponse.json(
        { error: "Add a payment method before using credits." },
        { status: 400 }
      );
    }

    let creditDays = 0;
    if (useCredits) {
      creditDays =
        billing === "annual"
          ? periodsCovered * 365
          : periodsCovered * 30;
    }

    const effectiveTrialDays = useCredits ? creditDays : plan.trialDays;

    // ── Promo: resolve to a Stripe coupon ID ──────────────────────────────────
    const couponId = promoCode
      ? await resolveStripeCoupon(promoCode, planKey, email)
      : null;

    const baseUrl = getBaseUrl(req);

    // ── Create Stripe checkout session ────────────────────────────────────────
    const checkoutSessionParams = {
      mode: "subscription",
      success_url: `${baseUrl}/account?success=1`,
      cancel_url: `${baseUrl}/pricing?cancel=1`,
      customer_email: email,

      payment_method_collection: "always",
      payment_method_types: ["card"],

      metadata: {
        email,
        plan: plan.key,
        billing,
        promoCode: promoCode || "",
        usedCredits: useCredits ? "true" : "false",
        periodsCovered: String(periodsCovered),
        creditsUsed: String(periodsCovered * unitAmount),
      },

      subscription_data: {
        metadata: {
          email,
          plan: plan.key,
          billing,
          promoCode: promoCode || "",
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
    };

    // Apply the Stripe coupon if we resolved one
    if (couponId) {
      checkoutSessionParams.discounts = [{ coupon: couponId }];
    }

    const checkoutSession = await stripe.checkout.sessions.create(
      checkoutSessionParams
    );

    // ── Deduct credits ────────────────────────────────────────────────────────
    if (useCredits) {
      const creditsToUse = periodsCovered * unitAmount;
      user.credits -= creditsToUse;
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
      discountApplied: !!couponId,
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Checkout failed", details: err.message },
      { status: 500 }
    );
  }
}
