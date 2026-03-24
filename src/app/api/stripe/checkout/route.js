import { NextResponse } from "next/server";
import stripe from "@/libs/stripe";
import mongoose from "mongoose";
import { User } from "@/models/User";

const CREDIT_VALUE_GBP = 20 / 450;

async function connectDB() {
  if (mongoose.connection.readyState === 1) return;
  await mongoose.connect(process.env.MONGO_URI);
}

export async function POST(req) {
  try {
    const body = await req.json().catch(() => null);

    if (!body || !body.email) {
      return NextResponse.json(
        { error: "Missing email" },
        { status: 400 }
      );
    }

    const { email } = body;

    await connectDB();

    const user = await User.findOne({ email });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    const planAmount = 2000; // £20/month

    // 💰 CREDIT CALCULATION (CORRECT)
    const creditValueGBP = user.credits * CREDIT_VALUE_GBP;
    const creditValuePence = Math.floor(creditValueGBP * 100);

    const periodsCovered = Math.floor(creditValuePence / planAmount);
    const useCredits = periodsCovered > 0;

    // 💳 REQUIRE CARD
    if (useCredits && !user.hasPaymentMethod) {
      return NextResponse.json(
        { error: "You must add a payment method first." },
        { status: 400 }
      );
    }

    // 📆 Convert credits → days
    const trialDays = useCredits ? periodsCovered * 30 : 0;

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer_email: email,

      payment_method_collection: "always",

      subscription_data: {
        ...(trialDays > 0 ? { trial_period_days: trialDays } : {}),
        metadata: {
          usedCredits: useCredits ? "true" : "false",
          periodsCovered: String(periodsCovered),
        },
      },

      metadata: {
        usedCredits: useCredits ? "true" : "false",
        periodsCovered: String(periodsCovered),
      },

      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: "gbp",
            unit_amount: planAmount,
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
        (periodsCovered * planAmount) / 100 * creditsPerPound
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
      url: session.url,
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
