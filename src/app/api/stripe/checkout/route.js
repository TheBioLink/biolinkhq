import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import stripe from "@/libs/stripe";
import { connectDb, normalizeEmail } from "@/libs/stripe-subscriptions";
import { User } from "@/models/User";

const CREDIT_VALUE_GBP = 20 / 450;

export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();

    const email = normalizeEmail(session.user.email);

    await connectDb();

    const user = await User.findOne({ email });

    const planAmount = 2000; // £20 example

    const creditValueGBP = user.credits * CREDIT_VALUE_GBP;
    const creditValuePence = Math.floor(creditValueGBP * 100);

    const periodsCovered = Math.floor(creditValuePence / planAmount);

    const useCredits = periodsCovered > 0;

    if (useCredits && !user.hasPaymentMethod) {
      return NextResponse.json(
        { error: "Payment method required" },
        { status: 400 }
      );
    }

    const trialDays = periodsCovered * 30;

    const sessionStripe = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer_email: email,

      payment_method_collection: "always",

      subscription_data: {
        trial_period_days: trialDays,
        metadata: {
          usedCredits: useCredits ? "true" : "false",
        },
      },

      line_items: [
        {
          price_data: {
            currency: "gbp",
            unit_amount: planAmount,
            recurring: { interval: "month" },
            product_data: { name: "Premium" },
          },
          quantity: 1,
        },
      ],

      success_url: `${process.env.NEXTAUTH_URL}/account`,
      cancel_url: `${process.env.NEXTAUTH_URL}/pricing`,
    });

    // 💰 DEDUCT CREDITS
    if (useCredits) {
      const creditsPerPound = 450 / 20;

      const creditsUsed = Math.floor(
        (periodsCovered * planAmount) / 100 * creditsPerPound
      );

      user.credits -= creditsUsed;

      user.subscription.startedWithCredits = true;

      // 🔥 track who gave credits (if applicable)
      if (user.referredBy) {
        const referrer = await User.findOne({
          referralCode: user.referredBy,
        });

        if (referrer) {
          user.subscription.creditOriginUserId = referrer._id.toString();
        }
      }

      user.creditSubscriptions.push({
        startedAt: new Date(),
        plan: "premium",
        creditsUsed,
      });

      await user.save();
    }

    return NextResponse.json({ url: sessionStripe.url });
  } catch (err) {
    return NextResponse.json(
      { error: err.message },
      { status: 500 }
    );
  }
}
