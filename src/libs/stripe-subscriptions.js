// src/libs/stripe-subscriptions.js
import mongoose from "mongoose";
import stripe from "@/libs/stripe";
import { Page } from "@/models/Page";

export async function connectDb() {
  if (mongoose.connection.readyState === 1) return;
  await mongoose.connect(process.env.MONGO_URI);
}

export function normalizeEmail(email) {
  return String(email || "").toLowerCase().trim();
}

export function getBillingFromInterval(interval) {
  return interval === "year" ? "annual" : "monthly";
}

export function getPlanFromAmount(amount, interval = "month") {
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

export function getCustomerIdFromObject(object) {
  return typeof object?.customer === "string"
    ? object.customer
    : object?.customer?.id || "";
}

export async function getCustomerEmail(customerId) {
  if (!customerId) return "";

  const customer = await stripe.customers.retrieve(customerId);

  if ("deleted" in customer && customer.deleted) return "";
  return normalizeEmail(customer.email || customer.metadata?.email || "");
}

export async function findPageByOwner(email) {
  await connectDb();
  return Page.findOne({ owner: normalizeEmail(email) });
}

export async function updatePageByEmail(email, updates) {
  const normalized = normalizeEmail(email);
  if (!normalized) return null;

  await connectDb();

  return Page.findOneAndUpdate(
    { owner: normalized },
    { $set: updates },
    { new: true }
  );
}

export async function updatePageByCustomerId(customerId, updates) {
  if (!customerId) return null;

  await connectDb();

  return Page.findOneAndUpdate(
    { stripeCustomerId: customerId },
    { $set: updates },
    { new: true }
  );
}

export async function applyUpdates(email, customerId, updates) {
  const updated = await updatePageByEmail(email, updates);

  if (!updated && customerId) {
    return updatePageByCustomerId(customerId, updates);
  }

  return updated;
}

export function buildFreeState(extra = {}) {
  return {
    stripeCheckoutSessionId: "",
    stripeSubscriptionId: "",
    stripeSubscriptionStatus: "canceled",
    stripeCurrentPlan: "free",
    stripeBillingCycle: "",
    stripePriceId: "",
    stripeUnitAmount: 0,
    stripeCurrency: "gbp",
    stripeInterval: "month",
    stripeTrialEndsAt: null,
    stripeCurrentPeriodEnd: null,
    stripeCancelAtPeriodEnd: false,
    stripeLastInvoiceId: "",
    ...extra,
  };
}

export async function ensurePermanentExclusiveForPage(pageOrEmail) {
  await connectDb();

  let page = null;

  if (typeof pageOrEmail === "string") {
    page = await Page.findOne({ owner: normalizeEmail(pageOrEmail) });
  } else {
    page = pageOrEmail;
  }

  if (!page) return null;

  const isItsNic =
    String(page?.uri || "").toLowerCase() === "itsnicbtw";

  if (!isItsNic) return page;

  return Page.findOneAndUpdate(
    { _id: page._id },
    {
      $set: {
        permanentPlan: "exclusive",
        stripeCurrentPlan: "exclusive",
        stripeSubscriptionStatus: "active",
        stripeBillingCycle: "lifetime",
        stripeUnitAmount: 0,
        stripeCurrency: "gbp",
        stripeInterval: "lifetime",
        stripeCancelAtPeriodEnd: false,
      },
    },
    { new: true }
  );
}

export async function syncSubscriptionToPageBySessionId(sessionId, expectedEmail = "") {
  if (!sessionId) return null;

  const session = await stripe.checkout.sessions.retrieve(sessionId, {
    expand: ["subscription", "customer"],
  });

  const email = normalizeEmail(
    session?.customer_details?.email ||
      session?.customer_email ||
      session?.metadata?.email ||
      expectedEmail
  );

  const customerId =
    typeof session?.customer === "string"
      ? session.customer
      : session?.customer?.id || "";

  if (session.mode !== "subscription") {
    return null;
  }

  if (!session.subscription) {
    return applyUpdates(email, customerId, {
      stripeCustomerId: customerId,
      stripeCheckoutSessionId: session.id,
      stripeSubscriptionStatus:
        session.payment_status === "paid" ? "active" : "trialing",
      stripeCurrentPlan: String(session?.metadata?.plan || "free").toLowerCase(),
      stripeBillingCycle: String(session?.metadata?.billing || "monthly").toLowerCase(),
      stripeTrialUsed:
        String(session?.metadata?.plan || "").toLowerCase() === "premium" &&
        String(session?.metadata?.billing || "").toLowerCase() === "monthly",
      stripeLastEventType: "checkout.session.completed",
    });
  }

  const subscription =
    typeof session.subscription === "string"
      ? await stripe.subscriptions.retrieve(session.subscription)
      : session.subscription;

  const item = subscription?.items?.data?.[0];
  const price = item?.price || null;
  const interval = price?.recurring?.interval || "month";
  const amount = price?.unit_amount ?? 0;

  const plan =
    String(subscription?.metadata?.plan || session?.metadata?.plan || "").toLowerCase() ||
    getPlanFromAmount(amount, interval);

  const billing =
    String(subscription?.metadata?.billing || session?.metadata?.billing || "").toLowerCase() ||
    getBillingFromInterval(interval);

  return applyUpdates(email, customerId, {
    stripeCustomerId: customerId,
    stripeCheckoutSessionId: session.id || "",
    stripeSubscriptionId: subscription?.id || "",
    stripeSubscriptionStatus: subscription?.status || "",
    stripeCurrentPlan:
      ["active", "trialing", "past_due"].includes(subscription?.status)
        ? plan
        : "free",
    stripeBillingCycle: billing,
    stripePriceId: price?.id || "",
    stripeUnitAmount: amount,
    stripeCurrency: price?.currency || "gbp",
    stripeInterval: interval,
    stripeTrialEndsAt: subscription?.trial_end
      ? new Date(subscription.trial_end * 1000)
      : null,
    stripeTrialUsed:
      plan === "premium" && billing === "monthly" ? true : undefined,
    stripeCurrentPeriodEnd: subscription?.current_period_end
      ? new Date(subscription.current_period_end * 1000)
      : null,
    stripeCancelAtPeriodEnd: !!subscription?.cancel_at_period_end,
    stripeLastEventType: "checkout.session.completed",
  });
}
