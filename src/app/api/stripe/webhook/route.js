import mongoose from "mongoose";
import Stripe from "stripe";
import { headers } from "next/headers";

import { User } from "@/models/User";
import { handleReferralPurchase } from "@/libs/handleReferral";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

async function connectDB() {
  if (mongoose.connection.readyState === 1) return;
  await mongoose.connect(process.env.MONGO_URI);
}

export async function POST(req) {
  await connectDB();

  const body = await req.text(); // 🔥 raw body required
  const sig = headers().get("stripe-signature");

  let event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error("❌ Webhook error:", err.message);
    return new Response(`Webhook Error: ${err.message}`, { status: 400 });
  }

  // 💳 PAYMENT SUCCESS
  if (event.type === "invoice.payment_succeeded") {
    const invoice = event.data.object;

    const email = invoice.customer_email;

    const user = await User.findOne({ email });

    if (user) {
      user.subscription.has_paid = true;
      user.subscription.status = "active";
      user.subscription.startedWithCredits = false;

      const periodEnd = invoice.lines?.data?.[0]?.period?.end;

      if (periodEnd) {
        user.subscription.current_period_end = new Date(periodEnd * 1000);
      }

      await user.save();

      await handleReferralPurchase(user, "stripe_subscription");
    }
  }

  // ❌ PAYMENT FAILED
  if (event.type === "invoice.payment_failed") {
    const invoice = event.data.object;

    const user = await User.findOne({
      email: invoice.customer_email,
    });

    if (user) {
      user.subscription.status = "past_due";
      await user.save();
    }
  }

  // 🚫 SUB CANCELLED
  if (event.type === "customer.subscription.deleted") {
    const sub = event.data.object;

    // 🔥 safer: fetch email from Stripe
    const customer = await stripe.customers.retrieve(sub.customer);
    const email = customer.email;

    const user = await User.findOne({ email });

    if (user) {
      user.subscription.status = "canceled";
      user.subscription.cancelled_at = new Date();

      await user.save();
    }
  }

  // 💳 PAYMENT METHOD ADDED
  if (event.type === "payment_method.attached") {
    const pm = event.data.object;

    const customer = await stripe.customers.retrieve(pm.customer);
    const email = customer.email;

    const user = await User.findOne({ email });

    if (user) {
      user.hasPaymentMethod = true;
      await user.save();
    }
  }

  return new Response(JSON.stringify({ received: true }), {
    status: 200,
  });
}
