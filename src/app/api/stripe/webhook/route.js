// src/app/api/stripe/webhook/route.js
import { NextResponse } from "next/server";
import mongoose from "mongoose";
import stripe from "@/libs/stripe";
import { Page } from "@/models/Page";

export const runtime = "nodejs";

async function connectDb() {
  if (mongoose.connection.readyState === 1) return;
  await mongoose.connect(process.env.MONGO_URI);
}

function normalizeEmail(email) {
  return String(email || "").toLowerCase().trim();
}

function getPlanFromAmount(amount, interval = "month") {
  if (interval === "year") {
    if (amount === 5000) return "basic";
    if (amount === 20000) return "premium";
    if (amount === 100000) return "exclusive";
  }

  if (amount === 500) return "basic";
  if (amount === 2000) return "premium";
  if (amount === 10000) return "exclusive";

  return "free";
}

async function getCustomerEmail(customerId) {
  if (!customerId) return "";

  const customer = await stripe.customers.retrieve(customerId);

  if ("deleted" in customer && customer.deleted) return "";

  return normalizeEmail(customer.email || customer.metadata?.email || "");
}

async function updatePageByEmail(email, updates) {
  const normalized = normalizeEmail(email);
  if (!normalized) return null;

  await connectDb();

  return Page.findOneAndUpdate(
    { owner: normalized },
    { $set: updates },
    { new: true }
  );
}

async function updatePageByCustomerId(customerId, updates) {
  if (!customerId) return null;

  await connectDb();

  return Page.findOneAndUpdate(
    { stripeCustomerId: customerId },
    { $set: updates },
    { new: true }
  );
}

async function resolveEmailFromCheckoutSession(sessionObject) {
  return normalizeEmail(
    sessionObject?.customer_details?.email ||
      sessionObject?.customer_email ||
      sessionObject?.metadata?.email
  );
}

async function resolveEmailFromInvoice(invoiceObject) {
  const direct =
    invoiceObject?.customer_email ||
    invoiceObject?.parent?.subscription_details?.metadata?.email ||
    invoiceObject?.lines?.data?.[0]?.metadata?.email ||
    invoiceObject?.metadata?.email;

  if (direct) return normalizeEmail(direct);

  const customerId =
    typeof invoiceObject?.customer === "string"
      ? invoiceObject.customer
      : invoiceObject?.customer?.id;

  return getCustomerEmail(customerId);
}

async function resolveEmailFromSubscription(subscriptionObject) {
  const direct =
    subscriptionObject?.metadata?.email ||
    subscriptionObject?.items?.data?.[0]?.metadata?.email;

  if (direct) return normalizeEmail(direct);

  const customerId =
    typeof subscriptionObject?.customer === "string"
      ? subscriptionObject.customer
      : subscriptionObject?.customer?.id;

  return getCustomerEmail(customerId);
}

function getCustomerIdFromObject(object) {
  return typeof object?.customer === "string"
    ? object.customer
    : object?.customer?.id || null;
}

function getPriceFromSubscription(subscriptionObject) {
  return subscriptionObject?.items?.data?.[0]?.price || null;
}

function getBillingFromSubscription(subscriptionObject) {
  const metadataBilling =
    subscriptionObject?.metadata?.billing ||
    subscriptionObject?.items?.data?.[0]?.price?.product?.metadata?.billing;

  if (metadataBilling) return String(metadataBilling).toLowerCase();

  const interval = subscriptionObject?.items?.data?.[0]?.price?.recurring?.interval;
  return interval === "year" ? "annual" : "monthly";
}

function getPlanFromSubscription(subscriptionObject) {
  const metadataPlan =
    subscriptionObject?.metadata?.plan ||
    subscriptionObject?.items?.data?.[0]?.price?.product?.metadata?.plan ||
    subscriptionObject?.items?.data?.[0]?.plan?.metadata?.plan;

  if (metadataPlan) return String(metadataPlan).toLowerCase();

  const amount = subscriptionObject?.items?.data?.[0]?.price?.unit_amount;
  const interval = subscriptionObject?.items?.data?.[0]?.price?.recurring?.interval || "month";
  return getPlanFromAmount(amount, interval);
}

export async function POST(req) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    return NextResponse.json(
      { error: "Missing STRIPE_WEBHOOK_SECRET" },
      { status: 500 }
    );
  }

  const signature = req.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json(
      { error: "Missing stripe-signature header" },
      { status: 400 }
    );
  }

  let event;

  try {
    const rawBody = await req.text();
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (error) {
    console.error("Stripe webhook signature verification failed:", error);
    return NextResponse.json(
      { error: error?.message || "Invalid webhook signature" },
      { status: 400 }
    );
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const sessionObject = event.data.object;
        const email = await resolveEmailFromCheckoutSession(sessionObject);
        const customerId = getCustomerIdFromObject(sessionObject);

        if (sessionObject.mode === "subscription") {
          const updates = {
            stripeCustomerId: customerId,
            stripeCheckoutSessionId: sessionObject.id,
            stripeSubscriptionId:
              typeof sessionObject.subscription === "string"
                ? sessionObject.subscription
                : sessionObject.subscription?.id || null,
            stripeSubscriptionStatus: "active",
            stripeCurrentPlan: String(
              sessionObject?.metadata?.plan || "free"
            ).toLowerCase(),
            stripeBillingCycle: String(
              sessionObject?.metadata?.billing || "monthly"
            ).toLowerCase(),
            stripeLastEventType: event.type,
          };

          const updated = await updatePageByEmail(email, updates);

          if (!updated && customerId) {
            await updatePageByCustomerId(customerId, updates);
          }
        }

        break;
      }

      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const subscriptionObject = event.data.object;
        const customerId = getCustomerIdFromObject(subscriptionObject);
        const email = await resolveEmailFromSubscription(subscriptionObject);
        const price = getPriceFromSubscription(subscriptionObject);
        const plan = getPlanFromSubscription(subscriptionObject);
        const billing = getBillingFromSubscription(subscriptionObject);

        const updates = {
          stripeCustomerId: customerId,
          stripeSubscriptionId: subscriptionObject.id,
          stripeSubscriptionStatus: subscriptionObject.status || null,
          stripeCurrentPlan:
            subscriptionObject.status === "active" ||
            subscriptionObject.status === "trialing" ||
            subscriptionObject.status === "past_due"
              ? plan
              : "free",
          stripeBillingCycle: billing,
          stripePriceId: price?.id || null,
          stripeUnitAmount: price?.unit_amount ?? null,
          stripeCurrency: price?.currency || "gbp",
          stripeInterval: price?.recurring?.interval || "month",
          stripeTrialEndsAt: subscriptionObject.trial_end
            ? new Date(subscriptionObject.trial_end * 1000)
            : null,
          stripeCurrentPeriodEnd: subscriptionObject.current_period_end
            ? new Date(subscriptionObject.current_period_end * 1000)
            : null,
          stripeCancelAtPeriodEnd: !!subscriptionObject.cancel_at_period_end,
          stripeLastEventType: event.type,
        };

        const updated = await updatePageByEmail(email, updates);

        if (!updated && customerId) {
          await updatePageByCustomerId(customerId, updates);
        }

        break;
      }

      case "customer.subscription.deleted": {
        const subscriptionObject = event.data.object;
        const customerId = getCustomerIdFromObject(subscriptionObject);
        const email = await resolveEmailFromSubscription(subscriptionObject);

        const updates = {
          stripeCustomerId: customerId,
          stripeSubscriptionId: subscriptionObject.id,
          stripeSubscriptionStatus: "canceled",
          stripeCurrentPlan: "free",
          stripeBillingCycle: "",
          stripeCancelAtPeriodEnd: false,
          stripeCurrentPeriodEnd: null,
          stripeTrialEndsAt: null,
          stripeLastEventType: event.type,
        };

        const updated = await updatePageByEmail(email, updates);

        if (!updated && customerId) {
          await updatePageByCustomerId(customerId, updates);
        }

        break;
      }

      case "invoice.paid": {
        const invoiceObject = event.data.object;
        const customerId = getCustomerIdFromObject(invoiceObject);
        const email = await resolveEmailFromInvoice(invoiceObject);

        const linePrice = invoiceObject?.lines?.data?.[0]?.price || null;
        const amount = linePrice?.unit_amount;
        const interval = linePrice?.recurring?.interval || "month";
        const plan =
          invoiceObject?.parent?.subscription_details?.metadata?.plan ||
          getPlanFromAmount(amount, interval);

        const billing =
          invoiceObject?.parent?.subscription_details?.metadata?.billing ||
          (interval === "year" ? "annual" : "monthly");

        const updates = {
          stripeCustomerId: customerId,
          stripeSubscriptionStatus: "active",
          stripeCurrentPlan: plan,
          stripeBillingCycle: billing,
          stripeLastInvoiceId: invoiceObject.id,
          stripeLastEventType: event.type,
        };

        const updated = await updatePageByEmail(email, updates);

        if (!updated && customerId) {
          await updatePageByCustomerId(customerId, updates);
        }

        break;
      }

      case "invoice.payment_failed": {
        const invoiceObject = event.data.object;
        const customerId = getCustomerIdFromObject(invoiceObject);
        const email = await resolveEmailFromInvoice(invoiceObject);

        const updates = {
          stripeCustomerId: customerId,
          stripeSubscriptionStatus: "past_due",
          stripeLastInvoiceId: invoiceObject.id,
          stripeLastEventType: event.type,
        };

        const updated = await updatePageByEmail(email, updates);

        if (!updated && customerId) {
          await updatePageByCustomerId(customerId, updates);
        }

        break;
      }

      default:
        break;
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Stripe webhook handler failed:", error);

    return NextResponse.json(
      {
        error: "Webhook handler failed",
        details: error?.message || "Unknown error",
      },
      { status: 500 }
    );
  }
}
