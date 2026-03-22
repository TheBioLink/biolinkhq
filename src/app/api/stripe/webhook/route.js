// src/app/api/stripe/webhook/route.js
import { NextResponse } from "next/server";
import Stripe from "stripe";
import { connectDb, applyUpdates, ensurePermanentExclusiveForPage, buildFreeState, normalizeEmail, getCustomerIdFromObject } from "@/libs/stripe-subscriptions";
import { Page } from "@/models/Page";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2023-08-16",
});

// Utility: resolve email from Stripe object
async function resolveEmail(stripeObject) {
  if (!stripeObject) return "";
  return normalizeEmail(
    stripeObject?.customer_email ||
      stripeObject?.customer_details?.email ||
      stripeObject?.metadata?.email
  );
}

export async function POST(req) {
  const sig = req.headers.get("stripe-signature");
  if (!sig) return NextResponse.json({ error: "Missing stripe-signature header" }, { status: 400 });

  const rawBody = await req.text();

  let event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error("⚠️ Stripe webhook signature verification failed:", err.message);
    return NextResponse.json({ error: "Invalid webhook signature" }, { status: 400 });
  }

  try {
    await connectDb();

    switch (event.type) {
      // New subscription completed via checkout
      case "checkout.session.completed": {
        const session = event.data.object;
        if (session.mode !== "subscription") break;

        const email = await resolveEmail(session);
        const customerId = getCustomerIdFromObject(session);

        await applyUpdates(email, customerId, {
          stripeCustomerId: customerId || "",
          stripeCheckoutSessionId: session.id,
          stripeSubscriptionId:
            typeof session.subscription === "string"
              ? session.subscription
              : session.subscription?.id || "",
          stripeSubscriptionStatus:
            session.payment_status === "paid" ? "active" : "trialing",
          stripeCurrentPlan: String(session?.metadata?.plan || "free").toLowerCase(),
          stripeBillingCycle: String(session?.metadata?.billing || "monthly").toLowerCase(),
          stripeTrialUsed:
            String(session?.metadata?.isTrial || "false") === "true",
          stripeLastEventType: event.type,
        });

        await ensurePermanentExclusiveForPage(email);
        break;
      }

      // Subscription created/updated
      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const subscription = event.data.object;
        const email = await resolveEmail(subscription);
        const customerId = getCustomerIdFromObject(subscription);
        const price = subscription?.items?.data?.[0]?.price || null;
        const interval = price?.recurring?.interval || "month";
        const plan =
          String(subscription?.metadata?.plan || "").toLowerCase() ||
          (price?.unit_amount ? (price.unit_amount === 500 ? "basic" : price.unit_amount === 2000 ? "premium" : "exclusive") : "free");
        const billing =
          String(subscription?.metadata?.billing || "").toLowerCase() ||
          (interval === "year" ? "annual" : "monthly");
        const isTrial =
          subscription?.status === "trialing" ||
          String(subscription?.metadata?.isTrial || "false") === "true";

        await applyUpdates(email, customerId, {
          stripeCustomerId: customerId || "",
          stripeSubscriptionId: subscription.id,
          stripeSubscriptionStatus: subscription.status || "",
          stripeCurrentPlan: ["active", "trialing", "past_due"].includes(subscription.status)
            ? plan
            : "free",
          stripeBillingCycle: billing,
          stripePriceId: price?.id || "",
          stripeUnitAmount: price?.unit_amount ?? 0,
          stripeCurrency: price?.currency || "gbp",
          stripeInterval: interval,
          stripeTrialEndsAt: subscription.trial_end
            ? new Date(subscription.trial_end * 1000)
            : null,
          stripeTrialUsed: isTrial ? true : undefined,
          stripeCurrentPeriodEnd: subscription.current_period_end
            ? new Date(subscription.current_period_end * 1000)
            : null,
          stripeCancelAtPeriodEnd: !!subscription.cancel_at_period_end,
          stripeLastEventType: event.type,
        });

        await ensurePermanentExclusiveForPage(email);
        break;
      }

      // Subscription deleted/cancelled
      case "customer.subscription.deleted": {
        const subscription = event.data.object;
        const email = await resolveEmail(subscription);
        const customerId = getCustomerIdFromObject(subscription);

        await applyUpdates(
          email,
          customerId,
          buildFreeState({
            stripeCustomerId: customerId || "",
            stripeSubscriptionId: subscription.id,
            stripeTrialUsed: true,
            stripeLastEventType: event.type,
          })
        );

        await ensurePermanentExclusiveForPage(email);
        break;
      }

      // Invoice paid → mark active
      case "invoice.paid": {
        const invoice = event.data.object;
        const email = await resolveEmail(invoice);
        const customerId = getCustomerIdFromObject(invoice);
        const subscription = invoice.subscription;

        await applyUpdates(email, customerId, {
          stripeCustomerId: customerId || "",
          stripeSubscriptionStatus: "active",
          stripeLastInvoiceId: invoice.id,
          stripeLastEventType: event.type,
        });

        await ensurePermanentExclusiveForPage(email);
        break;
      }

      // Invoice payment failed → mark past_due or free
      case "invoice.payment_failed": {
        const invoice = event.data.object;
        const email = await resolveEmail(invoice);
        const customerId = getCustomerIdFromObject(invoice);
        const billingReason = String(invoice?.billing_reason || "");

        const shouldDowngrade =
          billingReason === "subscription_cycle" || billingReason === "subscription_create";

        await applyUpdates(
          email,
          customerId,
          shouldDowngrade
            ? buildFreeState({
                stripeCustomerId: customerId || "",
                stripeTrialUsed: true,
                stripeLastInvoiceId: invoice.id,
                stripeLastEventType: event.type,
              })
            : {
                stripeCustomerId: customerId || "",
                stripeSubscriptionStatus: "past_due",
                stripeLastInvoiceId: invoice.id,
                stripeLastEventType: event.type,
              }
        );

        await ensurePermanentExclusiveForPage(email);
        break;
      }

      default:
        break;
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Stripe webhook handler failed:", error);
    return NextResponse.json({ error: error?.message || "Webhook failed" }, { status: 500 });
  }
}
