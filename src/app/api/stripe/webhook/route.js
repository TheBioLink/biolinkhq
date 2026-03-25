import stripe from "@/libs/stripe";
import mongoose from "mongoose";
import { headers } from "next/headers";
import { User } from "@/models/User";

const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

async function connectDB() {
  if (mongoose.connection.readyState === 1) return;
  await mongoose.connect(process.env.MONGO_URI);
}

export async function POST(req) {
  const body = await req.text();
  const sig = headers().get("stripe-signature");

  if (!sig) {
    return new Response("Missing signature", { status: 400 });
  }

  let event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      endpointSecret
    );
  } catch (err) {
    return new Response(`Webhook error: ${err.message}`, {
      status: 400,
    });
  }

  await connectDB();

  try {
    switch (event.type) {
      // 💳 Card added
      case "setup_intent.succeeded": {
        const email =
          event.data.object.metadata?.email ||
          event.data.object.customer_email;

        if (email) {
          await User.updateOne(
            { email },
            { hasPaymentMethod: true }
          );
        }
        break;
      }

      // ✅ Subscription started
      case "customer.subscription.created": {
        const sub = event.data.object;
        const email = sub.metadata?.email;

        if (!email) break;

        await User.updateOne(
          { email },
          {
            stripeSubscriptionId: sub.id,
            stripeSubscriptionStatus: sub.status,
          }
        );
        break;
      }

      // 🔁 Renewal (important for revenue split)
      case "invoice.payment_succeeded": {
        const invoice = event.data.object;
        const email = invoice.metadata?.email;

        if (!email) break;

        const user = await User.findOne({ email });

        if (!user) break;

        // 🔥 CREDIT → PAID TRANSITION TRACKING
        if (user.subscription?.startedWithCredits) {
          user.subscription.convertedToPaid = true;

          // 🔔 WEBHOOK (YOUR REVENUE SPLIT SYSTEM)
          if (process.env.WEBHOOK_REF) {
            await fetch(process.env.WEBHOOK_REF, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                type: "credit_to_paid_conversion",
                user: email,
                plan: invoice.lines.data[0]?.description,
              }),
            });
          }

          await user.save();
        }

        break;
      }

      // ❌ Cancelled
      case "customer.subscription.deleted": {
        const sub = event.data.object;
        const email = sub.metadata?.email;

        if (!email) break;

        await User.updateOne(
          { email },
          { stripeSubscriptionStatus: "canceled" }
        );
        break;
      }
    }

    return new Response("ok", { status: 200 });
  } catch (err) {
    console.error("Webhook error:", err);
    return new Response("Webhook handler failed", {
      status: 500,
    });
  }
}
