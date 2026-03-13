// src/app/api/stripe/webhook/route.js
import { NextResponse } from "next/server";
import stripe from "@/libs/stripe";
import { User } from "@/models/User";
import {
  applyUpdates,
  buildFreeState,
  connectDb,
  ensurePermanentExclusiveForPage,
  getBillingFromInterval,
  getCustomerEmail,
  getCustomerIdFromObject,
  getPlanFromAmount,
  normalizeEmail,
} from "@/libs/stripe-subscriptions";

export const runtime = "nodejs";

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

  const customerId = getCustomerIdFromObject(invoiceObject);
  return getCustomerEmail(customerId);
}

async function resolveEmailFromSubscription(subscriptionObject) {
  const direct =
    subscriptionObject?.metadata?.email ||
    subscriptionObject?.items?.data?.[0]?.metadata?.email;

  if (direct) return normalizeEmail(direct);

  const customerId = getCustomerIdFromObject(subscriptionObject);
  return getCustomerEmail(customerId);
}

function getPriceFromSubscription(subscriptionObject) {
  return subscriptionObject?.items?.data?.[0]?.price || null;
}

function getBillingFromSubscription(subscriptionObject) {
  const metadataBilling = subscriptionObject?.metadata?.billing;

  if (metadataBilling) return String(metadataBilling).toLowerCase();

  const interval =
    subscriptionObject?.items?.data?.[0]?.price?.recurring?.interval || "month";

  return getBillingFromInterval(interval);
}

function getPlanFromSubscription(subscriptionObject) {
  const metadataPlan = subscriptionObject?.metadata?.plan;

  if (metadataPlan) return String(metadataPlan).toLowerCase();

  const amount = subscriptionObject?.items?.data?.[0]?.price?.unit_amount ?? 0;
  const interval =
    subscriptionObject?.items?.data?.[0]?.price?.recurring?.interval || "month";

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
          await connectDb();

          const usedCredits =
            String(sessionObject?.metadata?.usedCredits || "false") === "true";
          const creditAmountApplied = Number(
            sessionObject?.metadata?.creditAmountApplied || 0
          );

          if (usedCredits && creditAmountApplied > 0 && email) {
            const user = await User.findOne({ email });
            if (user) {
              user.credits = Math.max(
                0,
                Number(user.credits || 0) - creditAmountApplied
              );
              await user.save();
            }
          }

          const updated = await applyUpdates(email, customerId, {
            stripeCustomerId: customerId || "",
            stripeCheckoutSessionId: sessionObject.id || "",
            stripeSubscriptionId:
              typeof sessionObject.subscription === "string"
                ? sessionObject.subscription
                : sessionObject.subscription?.id || "",
            stripeSubscriptionStatus:
              sessionObject.payment_status === "paid" ? "active" : "trialing",
            stripeCurrentPlan: String(
              sessionObject?.metadata?.plan || "free"
            ).toLowerCase(),
            stripeBillingCycle: String(
              sessionObject?.metadata?.billing || "monthly"
            ).toLowerCase(),
            stripeTrialUsed:
              String(sessionObject?.metadata?.isTrial || "false") === "true",
            stripeLastEventType: event.type,
          });

          await ensurePermanentExclusiveForPage(updated || email);
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
        const isTrial =
          String(subscriptionObject?.metadata?.isTrial || "false") === "true" ||
          subscriptionObject?.status === "trialing";

        const updated = await applyUpdates(email, customerId, {
          stripeCustomerId: customerId || "",
          stripeSubscriptionId: subscriptionObject.id || "",
          stripeSubscriptionStatus: subscriptionObject.status || "",
          stripeCurrentPlan:
            ["active", "trialing", "past_due"].includes(subscriptionObject.status)
              ? plan
              : "free",
          stripeBillingCycle: billing,
          stripePriceId: price?.id || "",
          stripeUnitAmount: price?.unit_amount ?? 0,
          stripeCurrency: price?.currency || "gbp",
          stripeInterval: price?.recurring?.interval || "month",
          stripeTrialEndsAt: subscriptionObject.trial_end
            ? new Date(subscriptionObject.trial_end * 1000)
            : null,
          stripeTrialUsed: isTrial ? true : undefined,
          stripeCurrentPeriodEnd: subscriptionObject.current_period_end
            ? new Date(subscriptionObject.current_period_end * 1000)
            : null,
          stripeCancelAtPeriodEnd: !!subscriptionObject.cancel_at_period_end,
          stripeLastEventType: event.type,
        });

        await ensurePermanentExclusiveForPage(updated || email);

        break;
      }

      case "customer.subscription.deleted": {
        const subscriptionObject = event.data.object;
        const customerId = getCustomerIdFromObject(subscriptionObject);
        const email = await resolveEmailFromSubscription(subscriptionObject);

        const updated = await applyUpdates(
          email,
          customerId,
          buildFreeState({
            stripeCustomerId: customerId || "",
            stripeSubscriptionId: subscriptionObject.id || "",
            stripeTrialUsed: true,
            stripeLastEventType: event.type,
          })
        );

        await ensurePermanentExclusiveForPage(updated || email);

        break;
      }

      case "invoice.paid": {
        const invoiceObject = event.data.object;
        const customerId = getCustomerIdFromObject(invoiceObject);
        const email = await resolveEmailFromInvoice(invoiceObject);

        const linePrice = invoiceObject?.lines?.data?.[0]?.price || null;
        const amount = linePrice?.unit_amount ?? 0;
        const interval = linePrice?.recurring?.interval || "month";
        const plan =
          String(
            invoiceObject?.parent?.subscription_details?.metadata?.plan || ""
          ).toLowerCase() || getPlanFromAmount(amount, interval);
        const billing =
          String(
            invoiceObject?.parent?.subscription_details?.metadata?.billing || ""
          ).toLowerCase() || getBillingFromInterval(interval);

        const updated = await applyUpdates(email, customerId, {
          stripeCustomerId: customerId || "",
          stripeSubscriptionStatus: "active",
          stripeCurrentPlan: plan,
          stripeBillingCycle: billing,
          stripeLastInvoiceId: invoiceObject.id || "",
          stripeLastEventType: event.type,
        });

        await ensurePermanentExclusiveForPage(updated || email);

        break;
      }

      case "invoice.payment_failed": {
        const invoiceObject = event.data.object;
        const customerId = getCustomerIdFromObject(invoiceObject);
        const email = await resolveEmailFromInvoice(invoiceObject);
        const billingReason = String(invoiceObject?.billing_reason || "");

        const shouldDowngrade =
          billingReason === "subscription_cycle" ||
          billingReason === "subscription_create";

        const updated = await applyUpdates(
          email,
          customerId,
          shouldDowngrade
            ? buildFreeState({
                stripeCustomerId: customerId || "",
                stripeTrialUsed: true,
                stripeLastInvoiceId: invoiceObject.id || "",
                stripeLastEventType: event.type,
              })
            : {
                stripeCustomerId: customerId || "",
                stripeSubscriptionStatus: "past_due",
                stripeLastInvoiceId: invoiceObject.id || "",
                stripeLastEventType: event.type,
              }
        );

        await ensurePermanentExclusiveForPage(updated || email);

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
