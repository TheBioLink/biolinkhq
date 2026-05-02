import mongoose from "mongoose";
import Stripe from "stripe";
import { headers } from "next/headers";

import { User } from "@/models/User";
import { Page } from "@/models/Page";
import { PromoCode } from "@/models/PromoCode";
import { handleReferralPurchase } from "@/libs/handleReferral";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const norm = (s) => (s || "").toString().toLowerCase().trim();

async function connectDB() {
  if (mongoose.connection.readyState === 1) return;
  await mongoose.connect(process.env.MONGO_URI);
}

async function recordPromoUsage(promoCode, userEmail, appliedTo, discountAmount) {
  if (!promoCode) return;
  try {
    const promo = await PromoCode.findOne({ code: String(promoCode).toUpperCase().trim() });
    if (!promo) return;

    const userUsages = promo.usages.filter((u) => norm(u.userEmail) === norm(userEmail));
    if (promo.maxUsesPerUser > 0 && userUsages.length >= promo.maxUsesPerUser) return;

    promo.usedCount += 1;
    promo.usages.push({
      userEmail: norm(userEmail),
      usedAt: new Date(),
      appliedTo,
      discountAmount: Number(discountAmount || 0),
    });
    await promo.save();
  } catch (err) {
    console.error("recordPromoUsage error:", err);
  }
}

export async function POST(req) {
  await connectDB();

  const body = await req.text();
  const sig = headers().get("stripe-signature");

  let event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    return new Response(`Webhook Error: ${err.message}`, { status: 400 });
  }

  // ── Checkout completed ─────────────────────────────────────────────────────
  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    const email = norm(session.customer_email || session.metadata?.email || "");
    const type = session.metadata?.type || "";

    // ── Addon (one-time) purchase ──────────────────────────────────────────
    if (type === "addon" && email) {
      const addonKey = session.metadata?.addonKey || "";
      const promoCode = session.metadata?.promoCode || "";
      const discountPct = Number(session.metadata?.discountPct || 0);

      if (addonKey) {
        // Unlock on Page document
        await Page.updateOne(
          { owner: email },
          { $addToSet: { oneTimeUnlocks: addonKey } }
        );

        // Record promo usage
        if (promoCode) {
          const originalPrice = session.amount_total
            ? Math.round(session.amount_total / (1 - discountPct / 100))
            : 0;
          const discountAmount = originalPrice - (session.amount_total || 0);
          await recordPromoUsage(promoCode, email, `addon:${addonKey}`, discountAmount);
        }
      }
    }

    // ── Custom badge purchase ──────────────────────────────────────────────
    if (type !== "addon" && email) {
      await User.updateOne(
        {
          email,
          stripeBadgeSessions: { $ne: session.id },
        },
        {
          $inc: { customBadgeCredits: 3 },
          $push: { stripeBadgeSessions: session.id },
        }
      );
    }

    // ── Subscription checkout — record promo usage ─────────────────────────
    if (session.mode === "subscription") {
      const promoCode = session.metadata?.promoCode || "";
      const plan = session.metadata?.plan || "";
      if (promoCode && email) {
        await recordPromoUsage(promoCode, email, `subscription:${plan}`, 0);
      }
    }
  }

  // ── Invoice paid ────────────────────────────────────────────────────────────
  if (event.type === "invoice.payment_succeeded") {
    const invoice = event.data.object;
    const email = norm(invoice.customer_email || "");

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

  // ── Invoice failed ─────────────────────────────────────────────────────────
  if (event.type === "invoice.payment_failed") {
    const invoice = event.data.object;
    const user = await User.findOne({ email: norm(invoice.customer_email || "") });

    if (user) {
      user.subscription.status = "past_due";
      await user.save();
    }
  }

  // ── Subscription cancelled ─────────────────────────────────────────────────
  if (event.type === "customer.subscription.deleted") {
    const sub = event.data.object;
    const customer = await stripe.customers.retrieve(sub.customer);
    const email = norm(customer.email || "");

    const user = await User.findOne({ email });

    if (user) {
      user.subscription.status = "canceled";
      user.subscription.cancelled_at = new Date();
      await user.save();
    }
  }

  // ── Payment method attached ────────────────────────────────────────────────
  if (event.type === "payment_method.attached") {
    const pm = event.data.object;
    const customer = await stripe.customers.retrieve(pm.customer);
    const email = norm(customer.email || "");

    const user = await User.findOne({ email });

    if (user) {
      user.hasPaymentMethod = true;
      await user.save();
    }
  }

  return new Response(JSON.stringify({ received: true }), { status: 200 });
}
