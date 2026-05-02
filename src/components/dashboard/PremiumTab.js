// src/components/dashboard/PremiumTab.js
"use client";
import { useState } from "react";
import Link from "next/link";

const ADDON_META = {
  custom_background: { name: "Custom Background", icon: "🎨" },
  advanced_analytics: { name: "Advanced Analytics", icon: "📊" },
  remove_branding: { name: "Remove Branding", icon: "✨" },
  premium_themes: { name: "Premium Themes", icon: "🌈" },
};

function formatMoney(amount, currency = "gbp", billingCycle = "monthly") {
  const value = typeof amount === "number" ? amount / 100 : 0;
  const suffix = billingCycle === "annual" ? "/year" : billingCycle === "lifetime" ? "" : "/month";
  if (billingCycle === "lifetime") return "Permanent";
  try {
    return `${new Intl.NumberFormat("en-GB", {
      style: "currency",
      currency: String(currency || "gbp").toUpperCase(),
      maximumFractionDigits: 2,
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
  if (status === "active") return "border-emerald-400/20 bg-emerald-500/10 text-emerald-300";
  if (status === "trialing") return "border-blue-400/20 bg-blue-500/10 text-blue-300";
  if (status === "past_due") return "border-amber-400/20 bg-amber-500/10 text-amber-300";
  return "border-white/10 bg-white/5 text-white/70";
}

export default function PremiumTab({ page, hasActiveSub, subscriptionStatus }) {
  const [loading, setLoading] = useState(false);

  const isPermanent = page?.permanentPlan === "exclusive";
  const ownedAddons = Array.isArray(page?.oneTimeUnlocks) ? page.oneTimeUnlocks : [];

  async function openBillingPortal() {
    try {
      setLoading(true);
      const res = await fetch("/api/stripe/portal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "{}",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "Failed to open billing");
      if (!data?.url) throw new Error("Missing billing portal URL");
      window.location.href = data.url;
    } catch (error) {
      alert(error?.message || "Something went wrong");
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">

      {/* Subscription section */}
      {!hasActiveSub && !isPermanent ? (
        <section className="rounded-2xl border border-white/10 bg-gradient-to-b from-white/5 to-black/10 p-8 text-center">
          <h2 className="text-2xl font-black text-white mb-4">No Active Subscription</h2>
          <p className="text-white/70 mb-8 max-w-lg mx-auto">
            You are currently on the free plan. Upgrade to unlock premium features or buy individual features below.
          </p>
          <Link href="/pricing">
            <button className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-8 py-4 text-base font-extrabold text-white transition hover:bg-blue-500">
              View pricing →
            </button>
          </Link>
        </section>
      ) : (
        <section className="rounded-2xl border border-blue-500/20 bg-gradient-to-b from-blue-500/10 to-white/5 p-8">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="mb-2 inline-flex rounded-full border border-blue-400/20 bg-blue-500/10 px-3 py-1 text-xs font-extrabold uppercase tracking-[0.22em] text-blue-300">
                Subscription
              </div>
              <h2 className="text-2xl font-black text-white">Your plan</h2>
            </div>
            <div className={`inline-flex rounded-full border px-3 py-1.5 text-xs font-extrabold uppercase tracking-[0.18em] ${tone(subscriptionStatus || page?.stripeSubscriptionStatus)}`}>
              {subscriptionStatus || page?.stripeSubscriptionStatus || "unknown"}
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-2xl border border-white/10 bg-black/20 p-5">
              <div className="text-xs font-bold uppercase tracking-[0.18em] text-white/45">Plan</div>
              <div className="mt-2 text-lg font-black capitalize text-white">
                {page?.permanentPlan === "exclusive"
                  ? "exclusive (permanent)"
                  : page?.stripeCurrentPlan || "free"}
              </div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/20 p-5">
              <div className="text-xs font-bold uppercase tracking-[0.18em] text-white/45">Billing</div>
              <div className="mt-2 text-lg font-black capitalize text-white">
                {page?.stripeBillingCycle || "monthly"}
              </div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/20 p-5">
              <div className="text-xs font-bold uppercase tracking-[0.18em] text-white/45">Price</div>
              <div className="mt-2 text-lg font-black text-white">
                {formatMoney(page?.stripeUnitAmount, page?.stripeCurrency, page?.stripeBillingCycle)}
              </div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/20 p-5">
              <div className="text-xs font-bold uppercase tracking-[0.18em] text-white/45">Renewal</div>
              <div className="mt-2 text-lg font-black text-white">
                {isPermanent ? "Never" : formatDate(page?.stripeCurrentPeriodEnd)}
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

          {!isPermanent && (
            <div className="mt-6 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={openBillingPortal}
                disabled={loading}
                className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-extrabold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? "Opening..." : "Manage / Cancel Subscription"}
              </button>
              <Link href="/pricing">
                <button className="rounded-xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-bold text-white transition hover:bg-white/10">
                  View all plans
                </button>
              </Link>
            </div>
          )}
        </section>
      )}

      {/* Individual features owned */}
      <section className="rounded-2xl border border-white/10 bg-white/[0.02] p-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-black text-white">Individual features</h2>
            <p className="mt-1 text-sm text-white/50">One-time purchases — permanently unlocked on your account.</p>
          </div>
          <Link href="/pricing?section=addons">
            <button className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-bold text-white/70 transition hover:bg-white/10">
              Browse features →
            </button>
          </Link>
        </div>

        {ownedAddons.length === 0 ? (
          <div className="rounded-2xl border border-white/10 bg-black/20 p-6 text-center">
            <p className="text-sm text-white/40">You haven't purchased any individual features yet.</p>
            <Link href="/pricing">
              <button className="mt-3 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-blue-500">
                View individual features
              </button>
            </Link>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {ownedAddons.map((key) => {
              const meta = ADDON_META[key] || { name: key, icon: "🔓" };
              return (
                <div key={key} className="flex items-center gap-3 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4">
                  <span className="text-2xl">{meta.icon}</span>
                  <div>
                    <div className="font-bold text-white">{meta.name}</div>
                    <div className="text-xs text-emerald-400">Unlocked ✓</div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

    </div>
  );
}
