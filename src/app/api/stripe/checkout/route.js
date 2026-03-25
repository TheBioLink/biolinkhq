import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

import stripe from "@/libs/stripe";
import mongoose from "mongoose";
import { User } from "@/models/User";

const CREDIT_TO_GBP = 20 / 450;

async function connectDB() {
  if (mongoose.connection.readyState === 1) return;
  await mongoose.connect(process.env.MONGO_URI);
}

export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { plan, billing, paymentOption = "card" } =
      await req.json();

    await connectDB();

    const user = await User.findOne({ email: session.user.email });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // 💳 Plan pricing
    const PRICES = {
      basic: { monthly: 500, annual: 5000 },
      premium: { monthly: 2000, annual: 20000 },
      exclusive: { monthly: 10000, annual: 100000 },
    };

    const price = PRICES[plan]?.[billing];

    if (!price) {
      return NextResponse.json(
        { error: "Invalid plan" },
        { status: 400 }
      );
    }

    // 💰 Credits → GBP
    const creditGBP = user.credits * CREDIT_TO_GBP;
    const creditPence = Math.floor(creditGBP * 100);

    const periodsCovered = Math.floor(creditPence / price);

    const useCredits =
      paymentOption === "credits" && periodsCovered > 0;

    // 💳 REQUIRE CARD FIRST
    if (useCredits && !user.hasPaymentMethod) {
      const setupSession = await stripe.checkout.sessions.create({
        mode: "setup",
        customer_email: user.email,
        payment_method_types: ["card"],
        success_url: `${process.env.NEXTAUTH_URL}/account?card_added=1`,
        cancel_url: `${process.env.NEXTAUTH_URL}/pricing`,
      });

      return NextResponse.json({
        needsPaymentMethod: true,
        url: setupSession.url,
      });
    }

    const interval = billing === "annual" ? "year" : "month";

    const trialDays = useCredits
      ? periodsCovered * (billing === "annual" ? 365 : 30)
      : 0;

    const checkout = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer_email: user.email,
      payment_method_collection: "always",

      metadata: {
        email: user.email,
        plan,
        billing,
        usedCredits: useCredits ? "true" : "false",
        periodsCovered: String(periodsCovered),
      },

      subscription_data: {
        ...(trialDays > 0 ? { trial_period_days: trialDays } : {}),
        metadata: {
          email: user.email,
          plan,
          billing,
          usedCredits: useCredits ? "true" : "false",
          periodsCovered: String(periodsCovered),
        },
      },

      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: "gbp",
            unit_amount: price,
            recurring: { interval },
            product_data: {
              name: `BiolinkHQ ${plan}`,
            },
          },
        },
      ],

      success_url: `${process.env.NEXTAUTH_URL}/account?success=1`,
      cancel_url: `${process.env.NEXTAUTH_URL}/pricing`,
    });

    // 💸 Deduct credits
    if (useCredits) {
      const creditsUsed = Math.floor(
        (price * periodsCovered) / 100 / CREDIT_TO_GBP
      );

      user.credits -= creditsUsed;

      user.subscription = {
        startedWithCredits: true,
        creditedPeriods: periodsCovered,
      };

      await user.save();
    }

    return NextResponse.json({
      url: checkout.url,
      usedCredits: useCredits,
    });
  } catch (err) {
    console.error(err);

    return NextResponse.json(
      { error: "Checkout failed", details: err.message },
      { status: 500 }
    );
  }
}
