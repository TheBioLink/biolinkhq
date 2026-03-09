// src/components/dashboard/PremiumTab.js
"use client";

import { useState } from "react";

function formatMoney(amount, currency = "gbp", billingCycle = "monthly") {
  const value = typeof amount === "number" ? amount / 100 : 0;
  const suffix = billingCycle === "annual" ? "/year" : "/month";

  try {
    return `${new Intl.NumberFormat("en-GB", {
      style: "currency",
      currency: String(currency || "gbp").toUpperCase(),
      maximumFractionDigits: 0,
    }).format(value)}${suffix}`;
  } catch {
    return `£${value}${suffix}`;
  }
}

function formatDate(value) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

function tone(status) {
  if (status === "active") {
    return "border-emerald-400/20 bg-emerald-500/10 text-emerald-300";
  }
  if (status === "trialing") {
    return "border-blue-400/20 bg-blue-500/10 text-blue-300";
  }
  if (status === "past_due") {
    return "border-amber-400/20 bg-amber-500/10 text-amber-300";
  }
  return "border-white/10 bg-white/5 text-white/70";
}

export default function PremiumTab({ page }) {
  const [loading, setLoading] = useState(false);

  async function openBillingPortal() {
    try {
      setLoading(true);

      const res = await fetch("/api/stripe/portal", {
        method: "POST",
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || data?.details || "Failed to open billing");
      }

      if (data?.url) {
        window.location.href = data.url;
        return;
      }

      throw new Error("Missing billing portal URL");
    } catch (error) {
      alert(error?.message || "Something went wrong");
      setLoading(false);
    }
  }

  return (
    <section className="rounded-2xl border border-blue-500/20 bg-gradient-to-b from-blue-500/10 to-white/5 p-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="mb-2 inline-flex rounded-full border border-blue-400/20 bg-blue-500/10 px-3 py-1 text-xs font-extrabold uppercase tracking-[0.22em] text-blue-300">
            Premium
          </div>
          <h2 className="text-2xl font-black text-white">Subscription</h2>
          <p className="mt-2 text-sm text-white/65">
            Billing, trial status, and access are read from Stripe-backed MongoDB data.
          </p>
        </div>

        <div
          className={`inline-flex rounded-full border px-3 py-1.5 text-xs font-extrabold uppercase tracking-[0.18em] ${tone(
            page?.stripeSubscriptionStatus
          )}`}
        >
          {page?.stripeSubscriptionStatus || "unknown"}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-white/10 bg-black/20 p-5">
          <div className="text-xs font-bold uppercase tracking-[0.18em] text-white/45">
            Plan
          </div>
          <div className="mt-2 text-lg font-black capitalize text-white">
            {page?.stripeCurrentPlan || "free"}
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-black/20 p-5">
          <div className="text-xs font-bold uppercase tracking-[0.18em] text-white/45">
            Billing
          </div>
          <div className="mt-2 text-lg font-black capitalize text-white">
            {page?.stripeBillingCycle || "monthly"}
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-black/20 p-5">
          <div className="text-xs font-bold uppercase tracking-[0.18em] text-white/45">
            Price
          </div>
          <div className="mt-2 text-lg font-black text-white">
            {formatMoney(
              page?.stripeUnitAmount,
              page?.stripeCurrency,
              page?.stripeBillingCycle
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-black/20 p-5">
          <div className="text-xs font-bold uppercase tracking-[0.18em] text-white/45">
            Renewal
          </div>
          <div className="mt-2 text-lg font-black text-white">
            {formatDate(page?.stripeCurrentPeriodEnd)}
          </div>
        </div>
      </div>

      {page?.stripeTrialEndsAt && page?.stripeSubscriptionStatus === "trialing" && (
        <div className="mt-4 rounded-2xl border border-blue-400/20 bg-blue-500/10 p-4 text-sm text-blue-200">
          Trial ends on <span className="font-bold">{formatDate(page?.stripeTrialEndsAt)}</span>
        </div>
      )}

      {page?.stripeCancelAtPeriodEnd && (
        <div className="mt-4 rounded-2xl border border-amber-400/20 bg-amber-500/10 p-4 text-sm text-amber-200">
          Your subscription is set to cancel at the end of the current billing period.
        </div>
      )}

      <div className="mt-6 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={openBillingPortal}
          disabled={loading}
          className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-extrabold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? "Opening..." : "Manage / Cancel Subscription"}
        </button>

        <a
          href="/pricing"
          className="rounded-xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-bold text-white transition hover:bg-white/10"
        >
          View Plans
        </a>
      </div>
    </section>
  );
}
