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
    return new Response("No signature", { status: 400 });
  }

  let event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      endpointSecret
    );
  } catch (err) {
    return new Response("Webhook error", { status: 400 });
  }

  await connectDB();

  try {
    switch (event.type) {
      // 💳 CARD ADDED
      case "setup_intent.succeeded": {
        const email = event.data.object.customer_email;

        if (email) {
          await User.updateOne(
            { email },
            { hasPaymentMethod: true }
          );
        }
        break;
      }

      // ✅ CHECKOUT COMPLETED (SAFE CREDIT DEDUCTION)
      case "checkout.session.completed": {
        const session = event.data.object;

        const email = session.metadata?.email;
        const usedCredits = session.metadata?.usedCredits === "true";

        if (!email) break;

        const user = await User.findOne({ email });

        if (!user) break;

        if (usedCredits) {
          const periods = Number(session.metadata.periodsCovered);

          const PRICES = {
            basic: 500,
            premium: 2000,
            exclusive: 10000,
          };

          const price = PRICES[session.metadata.plan];

          const creditsUsed = Math.floor(
            (price * periods) / 100 / (20 / 450)
          );

          user.credits -= creditsUsed;

          user.subscription = {
            startedWithCredits: true,
            creditedPeriods: periods,
          };

          await user.save();
        }

        break;
      }

      // 🔁 RENEWAL → CREDIT TO PAID
      case "invoice.payment_succeeded": {
        const invoice = event.data.object;
        const email = invoice.metadata?.email;

        if (!email) break;

        const user = await User.findOne({ email });

        if (!user) break;

        if (user.subscription?.startedWithCredits) {
          user.subscription.convertedToPaid = true;

          if (process.env.WEBHOOK_REF) {
            await fetch(process.env.WEBHOOK_REF, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                type: "credit_conversion",
                user: email,
              }),
            });
          }

          await user.save();
        }

        break;
      }
    }

    return new Response("ok", { status: 200 });
  } catch (err) {
    return new Response("Webhook failed", { status: 500 });
  }
}
