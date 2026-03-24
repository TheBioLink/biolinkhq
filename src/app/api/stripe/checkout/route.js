import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

import stripe from "@/libs/stripe";
import mongoose from "mongoose";
import { User } from "@/models/User";

const CREDIT_VALUE_GBP = 20 / 450;
const PLAN_AMOUNT_PENCE = 2000; // £20/month

// 🔌 DB CONNECT
async function connectDB() {
  if (mongoose.connection.readyState === 1) return;
  await mongoose.connect(process.env.MONGO_URI);
}

export async function POST(req) {
  try {
    const body = await req.json();
    const paymentOption = body?.paymentOption || "card"; // 👈 support client

    // 🔐 SESSION
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Unauthorized (not logged in)" },
        { status: 401 }
      );
    }

    const email = session.user.email;

    // 🔌 CONNECT DB
    await connectDB();

    const user = await User.findOne({ email });
    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // 💰 CREDIT CALCULATION
    const creditValueGBP = user.credits * CREDIT_VALUE_GBP;
    const creditValuePence = Math.floor(creditValueGBP * 100);
    const periodsCovered = Math.floor(creditValuePence / PLAN_AMOUNT_PENCE);

    const useCredits = paymentOption === "credits" && periodsCovered > 0;

    // =========================================
    // 💳 NO CARD → SEND TO STRIPE SETUP
    // =========================================
    if (useCredits && !user.hasPaymentMethod) {
      const setupSession = await stripe.checkout.sessions.create({
        mode: "setup",
        customer_email: email,
        payment_method_types: ["card"],
        success_url: `${process.env.NEXTAUTH_URL}/account?card_added=1`,
        cancel_url: `${process.env.NEXTAUTH_URL}/pricing?card_cancelled=1`,
      });

      return NextResponse.json({
        needsPaymentMethod: true,
        url: setupSession.url,
      });
    }

    // 📆 Convert credits → trial
    const trialDays = useCredits ? periodsCovered * 30 : 0;

    // =========================================
    // ✅ CREATE STRIPE SUBSCRIPTION
    // =========================================
    const stripeSession = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer_email: email,
      payment_method_collection: "always",
      subscription_data: {
        ...(trialDays > 0 ? { trial_period_days: trialDays } : {}),
        metadata: {
          usedCredits: useCredits ? "true" : "false",
          periodsCovered: String(periodsCovered),
          paymentOption,
        },
      },
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: "gbp",
            unit_amount: PLAN_AMOUNT_PENCE,
            recurring: { interval: "month" },
            product_data: {
              name: "BiolinkHQ Premium",
              description: useCredits
                ? `${periodsCovered} month(s) covered using credits`
                : "Premium subscription",
            },
          },
        },
      ],
      success_url: `${process.env.NEXTAUTH_URL}/account?success=1`,
      cancel_url: `${process.env.NEXTAUTH_URL}/pricing?cancel=1`,
    });

    // 💸 DEDUCT CREDITS
    if (useCredits) {
      const creditsPerPound = 450 / 20;
      const creditsUsed = Math.floor(
        ((periodsCovered * PLAN_AMOUNT_PENCE) / 100) * creditsPerPound
      );

      user.credits -= creditsUsed;
      user.subscription.startedWithCredits = true;

      user.creditSubscriptions.push({
        startedAt: new Date(),
        plan: "premium",
        creditsUsed,
      });

      await user.save();
    }

    return NextResponse.json({
      ok: true,
      url: stripeSession.url,
      usedCredits: useCredits,
      periodsCovered,
    });
  } catch (err) {
    console.error("Checkout error:", err);
    return NextResponse.json(
      {
        error: "Checkout failed",
        details: err.message,
      },
      { status: 500 }
    );
  }
}
