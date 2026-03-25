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
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { plan, billing } = await req.json();

    await connectDB();

    const user = await User.findOne({ email: session.user.email });

    const PRICES = {
      basic: { monthly: 500, annual: 5000 },
      premium: { monthly: 2000, annual: 20000 },
      exclusive: { monthly: 10000, annual: 100000 },
    };

    const price = PRICES[plan]?.[billing];

    const creditGBP = user.credits * CREDIT_TO_GBP;
    const creditPence = Math.floor(creditGBP * 100);

    const periodsCovered = Math.floor(creditPence / price);

    if (periodsCovered <= 0) {
      return NextResponse.json(
        { error: "Not enough credits" },
        { status: 400 }
      );
    }

    const trialDays =
      periodsCovered * (billing === "annual" ? 365 : 30);

    const interval = billing === "annual" ? "year" : "month";

    const checkout = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer_email: user.email,
      payment_method_collection: "always",

      metadata: {
        email: user.email,
        plan,
        billing,
        usedCredits: "true",
        periodsCovered: String(periodsCovered),
      },

      subscription_data: {
        trial_period_days: trialDays,
        metadata: {
          email: user.email,
          plan,
          billing,
          usedCredits: "true",
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

      success_url: `${process.env.NEXTAUTH_URL}/account?credits_success=1`,
      cancel_url: `${process.env.NEXTAUTH_URL}/pricing`,
    });

    return NextResponse.json({
      url: checkout.url,
    });
  } catch (err) {
    return NextResponse.json(
      { error: "Credits checkout failed" },
      { status: 500 }
    );
  }
}
