import Stripe from "stripe";
import mongoose from "mongoose";
import { headers } from "next/headers";
import { User } from "@/models/User";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

async function connectDB() {
  if (mongoose.connection.readyState === 1) return;
  await mongoose.connect(process.env.MONGO_URI);
}

export async function POST(req) {
  const sig = headers().get("stripe-signature");
  if (!sig) return new Response("Missing stripe signature", { status: 400 });

  const body = await req.text();
  let event;

  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error("Webhook signature error:", err.message);
    return new Response("Invalid signature", { status: 400 });
  }

  await connectDB();

  // PAYMENT SUCCEEDED
  if (event.type === "invoice.payment_succeeded") {
    const invoice = event.data.object;
    let email = invoice.customer_email || (await stripe.customers.retrieve(invoice.customer)).email;
    if (!email) return new Response("ok");

    const user = await User.findOne({ email });
    if (user) {
      user.subscription.status = "active";
      user.subscription.has_paid = true;
      const periodEnd = invoice.lines?.data?.[0]?.period?.end;
      if (periodEnd) user.subscription.current_period_end = new Date(periodEnd * 1000);
      await user.save();
    }
  }

  // PAYMENT FAILED
  if (event.type === "invoice.payment_failed") {
    const invoice = event.data.object;
    let email = invoice.customer_email || (await stripe.customers.retrieve(invoice.customer)).email;
    const user = await User.findOne({ email });
    if (user) {
      user.subscription.status = "past_due";
      await user.save();
    }
  }

  // SUB CANCELLED
  if (event.type === "customer.subscription.deleted") {
    const sub = event.data.object;
    let email = sub.customer_email || (await stripe.customers.retrieve(sub.customer)).email;
    const user = await User.findOne({ email });
    if (user) {
      user.subscription.status = "canceled";
      user.subscription.cancelled_at = new Date();
      await user.save();
    }
  }

  // CARD ADDED
  if (event.type === "payment_method.attached") {
    const pm = event.data.object;
    if (!pm.customer) return new Response("ok");
    const customer = await stripe.customers.retrieve(pm.customer);
    const user = await User.findOne({ email: customer.email });
    if (user) {
      user.hasPaymentMethod = true;
      await user.save();
    }
  }

  return new Response(JSON.stringify({ received: true }), { status: 200 });
}
