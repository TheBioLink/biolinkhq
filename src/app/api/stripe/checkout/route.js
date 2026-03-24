import mongoose from "mongoose";
import Stripe from "stripe";
import { headers } from "next/headers";

import { User } from "@/models/User";
import { handleRevenueEvent } from "@/libs/handleReferral";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export async function POST(req) {
  const body = await req.text();
  const sig = headers().get("stripe-signature");

  const event = stripe.webhooks.constructEvent(
    body,
    sig,
    process.env.STRIPE_WEBHOOK_SECRET
  );

  await mongoose.connect(process.env.MONGO_URI);

  // 💳 PAYMENT SUCCESS (THIS IS WHERE SPLITS HAPPEN)
  if (event.type === "invoice.payment_succeeded") {
    const invoice = event.data.object;

    const email = invoice.customer_email;

    const user = await User.findOne({ email });

    if (!user) return new Response("ok");

    user.subscription.has_paid = true;
    user.subscription.status = "active";

    await user.save();

    // 🔗 referral payout
    await handleRevenueEvent({
      user,
      plan: "premium",
      type: "referral",
    });

    // 💰 CREDIT ORIGIN CONTINUATION
    await handleRevenueEvent({
      user,
      plan: "premium",
      type: "credit_origin",
    });
  }

  return new Response("ok");
}
