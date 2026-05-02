// src/components/pricing/PricingClient.js
"use client";

import Link from "next/link";
import { useMemo, useState, useEffect } from "react";

// ─── Plan definitions ──────────────────────────────────────────────────────────
const plans = [
  {
    key: "free",
    name: "Free",
    monthlyPrice: 0,
    annualPrice: 0,
    subtitle: "Get started instantly",
    accent: "border-white/10 bg-[#111827]",
    button: "bg-white/10 text-white hover:bg-white/15 border border-white/10",
    cta: "Get Started",
    href: "/account",
    features: [
      "Custom profile URL",
      "Unlimited links & buttons",
      "Basic analytics",
      "Discord integration",
      "Team profiles",
      "Collectible badges",
    ],
  },
  {
    key: "basic",
    name: "Basic",
    monthlyPrice: 299,
    annualPrice: 2490,
    subtitle: "More control and branding",
    accent: "border-blue-500/30 bg-[#111827]",
    button: "bg-blue-600 text-white hover:bg-blue-500",
    cta: "Upgrade to Basic",
    features: [
      "Everything in Free",
      "Custom background colors & images",
      "Priority support",
      "Profile theme presets",
      "Remove BiolinkHQ branding",
      "Advanced profile customisation",
    ],
  },
  {
    key: "premium",
    name: "Premium",
    monthlyPrice: 699,
    annualPrice: 5990,
    subtitle: "Built for creators who grow",
    accent:
      "border-blue-500 bg-gradient-to-b from-blue-500/10 to-[#111827] shadow-[0_0_0_1px_rgba(59,130,246,0.2),0_20px_60px_rgba(37,99,235,0.15)]",
    button: "bg-blue-600 text-white hover:bg-blue-500",
    featured: true,
    badge: "Most Popular",
    cta: "Upgrade to Premium",
    features: [
      "Everything in Basic",
      "Advanced analytics (devices, countries, referrers)",
      "Faster CDN page loading",
      "Premium themes & gradients",
      "Custom link icons & styles",
      "7-day free trial",
    ],
  },
  {
    key: "exclusive",
    name: "Exclusive",
    monthlyPrice: 1999,
    annualPrice: 19990,
    subtitle: "Direct influence. Maximum power.",
    accent:
      "border-amber-500/40 bg-gradient-to-b from-amber-500/10 to-[#111827]",
    button: "bg-amber-500 text-black hover:bg-amber-400 font-black",
    featured: true,
    badge: "Highest Tier",
    cta: "Go Exclusive",
    features: [
      "Everything in Premium",
      "Custom domain support",
      "Advanced integrations",
      "Priority feature access",
      "🚀 Feature requests are prioritised",
      "💡 99% of requested features get added",
      "⚡ Direct influence on product roadmap",
      "🧠 Early access to everything",
    ],
  },
];

// ─── Individual add-ons ────────────────────────────────────────────────────────
const addons = [
  {
    key: "custom_background",
    name: "Custom Background",
    price: 99,
    description: "Set a custom colour or image as your profile background.",
    icon: "🎨",
  },
  {
    key: "advanced_analytics",
    name: "Advanced Analytics",
    price: 149,
    description: "Unlock device, country, browser and referrer breakdowns.",
    icon: "📊",
  },
  {
    key: "remove_branding",
    name: "Remove Branding",
    price: 199,
    description: "Remove the BiolinkHQ badge from your public profile.",
    icon: "✨",
  },
  {
    key: "premium_themes",
    name: "Premium Themes",
    price: 249,
    description: "Access to premium colour themes and gradient presets.",
    icon: "🌈",
  },
  {
    key: "custom_badges",
    name: "3 Custom Badges",
    price: 150,
    description: "Create up to 3 custom collectible badges for your profile.",
    icon: "🏅",
    href: "/account/badges",
  },
];

// ─── Helpers ───────────────────────────────────────────────────────────────────
function formatMoney(pence) {
  if (pence === 0) return "£0";
  return `£${(pence / 100).toFixed(pence % 100 === 0 ? 0 : 2)}`;
}

async function startCheckout(plan, billing, setLoading, promoCode) {
  try {
    setLoading(`${plan}:${billing}`);
    const res = await fetch("/api/stripe/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ plan, billing, promoCode: promoCode || undefined }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data?.error || data?.details || "Checkout failed");
    if (data?.url) { window.location.href = data.url; return; }
    throw new Error("Missing checkout URL");
  } catch (error) {
    alert(error?.message || "Something went wrong");
    setLoading(null);
  }
}

async function startAddonCheckout(addonKey, setAddonLoading, promoCode) {
  try {
    setAddonLoading(addonKey);
    const res = await fetch("/api/stripe/addon-checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ addonKey, promoCode: promoCode || undefined }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data?.error || "Checkout failed");
    if (data?.url) { window.location.href = data.url; return; }
    throw new Error("Missing checkout URL");
  } catch (error) {
    alert(error?.message || "Something went wrong");
    setAddonLoading(null);
  }
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" className="mt-0.5 h-4 w-4 flex-none text-blue-400" aria-hidden="true">
      <path d="M16.667 5 7.5 14.167 3.333 10" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// ─── Promo input ───────────────────────────────────────────────────────────────
function PromoInput({ value, onChange, onValidate, status, discount, error }) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-2">
        <input
          value={value}
          onChange={(e) => onChange(e.target.value.toUpperCase())}
          placeholder="PROMO CODE"
          className="flex-1 rounded-xl border border-white/10 bg-black/30 px-4 py-2.5 font-mono text-sm font-bold text-white outline-none placeholder:text-white/25 focus:border-blue-400/60"
        />
        <button
          type="button"
          onClick={onValidate}
          disabled={!value}
          className="rounded-xl bg-white/10 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-white/15 disabled:opacity-40"
        >
          Apply
        </button>
      </div>
      {status === "valid" && (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-3 py-2 text-xs font-bold text-emerald-300">
          ✓ {discount}% discount applied!
        </div>
      )}
      {status === "invalid" && (
        <div className="flex items-center gap-2 rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs font-bold text-red-300">
          ✗ {error || "Invalid promo code"}
        </div>
      )}
    </div>
  );
}

// ─── Main component ────────────────────────────────────────────────────────────
export default function PricingClient() {
  const [loading, setLoading] = useState(null);
  const [addonLoading, setAddonLoading] = useState(null);
  const [billing, setBilling] = useState("monthly");
  const [promoCode, setPromoCode] = useState("");
  const [promoStatus, setPromoStatus] = useState(null);
  const [promoDiscount, setPromoDiscount] = useState(0);
  const [promoError, setPromoError] = useState("");
  const [activeSection, setActiveSection] = useState("plans");

  async function validatePromo(target = "all_subscriptions") {
    if (!promoCode) return;
    const res = await fetch(`/api/promo?code=${encodeURIComponent(promoCode)}&appliesTo=${target}`);
    const data = await res.json();
    if (data.valid) {
      setPromoStatus("valid");
      setPromoDiscount(data.discountPercent);
      setPromoError("");
    } else {
      setPromoStatus("invalid");
      setPromoDiscount(0);
      setPromoError(data.error || "Invalid code");
    }
  }

  function applyDiscount(pence) {
    if (promoStatus !== "valid" || !promoDiscount) return pence;
    return Math.round(pence * (1 - promoDiscount / 100));
  }

  const billingLabel = billing === "annual" ? "/year" : "/month";

  return (
    <div className="px-4 py-16 text-white">
      <main className="mx-auto max-w-7xl">

        {/* Hero */}
        <div className="mx-auto mb-12 max-w-3xl text-center">
          <div className="mb-4 inline-flex rounded-full border border-blue-400/20 bg-blue-500/10 px-4 py-1.5 text-xs font-extrabold uppercase tracking-[0.22em] text-blue-300">
            Pricing
          </div>
          <h1 className="text-4xl font-black tracking-tight sm:text-5xl">
            Simple, honest pricing
          </h1>
          <p className="mt-4 text-base text-white/60 sm:text-lg">
            Start free. Upgrade for more. Or just buy what you need.
          </p>
        </div>

        {/* Section toggle */}
        <div className="mb-10 flex justify-center">
          <div className="inline-flex rounded-2xl border border-white/10 bg-[#111827] p-1 gap-1">
            <button
              type="button"
              onClick={() => setActiveSection("plans")}
              className={`rounded-xl px-6 py-2.5 text-sm font-bold transition ${activeSection === "plans" ? "bg-blue-600 text-white" : "text-white/60 hover:text-white"}`}
            >
              Subscription plans
            </button>
            <button
              type="button"
              onClick={() => setActiveSection("addons")}
              className={`rounded-xl px-6 py-2.5 text-sm font-bold transition ${activeSection === "addons" ? "bg-blue-600 text-white" : "text-white/60 hover:text-white"}`}
            >
              Individual features
            </button>
          </div>
        </div>

        {/* ── PLANS ─────────────────────────────────────────────────────── */}
        {activeSection === "plans" && (
          <div className="space-y-8">
            {/* Billing toggle */}
            <div className="flex flex-col items-center gap-4">
              <div className="inline-flex rounded-2xl border border-white/10 bg-[#111827] p-1">
                <button
                  type="button"
                  onClick={() => setBilling("monthly")}
                  className={`rounded-xl px-5 py-2.5 text-sm font-bold transition ${billing === "monthly" ? "bg-blue-600 text-white" : "text-white/70 hover:text-white"}`}
                >
                  Monthly
                </button>
                <button
                  type="button"
                  onClick={() => setBilling("annual")}
                  className={`rounded-xl px-5 py-2.5 text-sm font-bold transition ${billing === "annual" ? "bg-blue-600 text-white" : "text-white/70 hover:text-white"}`}
                >
                  Annual{" "}
                  <span className="ml-1 rounded-full bg-emerald-500/20 px-1.5 py-0.5 text-[10px] font-black text-emerald-300">
                    SAVE ~30%
                  </span>
                </button>
              </div>

              <div className="w-full max-w-sm">
                <PromoInput
                  value={promoCode}
                  onChange={(v) => { setPromoCode(v); setPromoStatus(null); }}
                  onValidate={() => validatePromo("all_subscriptions")}
                  status={promoStatus}
                  discount={promoDiscount}
                  error={promoError}
                />
              </div>
            </div>

            {billing === "monthly" && (
              <p className="text-center text-sm text-blue-300">Premium includes a 7-day free trial</p>
            )}

            {/* Plan cards */}
            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
              {plans.map((plan) => {
                const isFree = plan.key === "free";
                const rawPrice = billing === "annual" ? plan.annualPrice : plan.monthlyPrice;
                const discountedPrice = applyDiscount(rawPrice);
                const isLoading = loading === `${plan.key}:${billing}`;
                const hasDiscount = promoStatus === "valid" && rawPrice > 0 && discountedPrice !== rawPrice;

                return (
                  <div
                    key={plan.key}
                    className={`relative flex min-h-[540px] flex-col rounded-3xl border p-7 ${plan.accent}`}
                  >
                    {plan.featured && (
                      <div className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2 rounded-full border border-blue-400/30 bg-blue-500 px-4 py-1 text-xs font-extrabold uppercase tracking-[0.18em] text-white shadow-lg">
                        {plan.badge}
                      </div>
                    )}

                    <div>
                      <h2 className="text-xl font-black text-white">{plan.name}</h2>
                      <p className="mt-1 text-sm text-white/55">{plan.subtitle}</p>

                      <div className="mt-5 flex items-end gap-1">
                        {hasDiscount && (
                          <span className="pb-1 text-sm text-white/30 line-through mr-1">
                            {formatMoney(rawPrice)}
                          </span>
                        )}
                        <span className="text-4xl font-black leading-none text-white">
                          {formatMoney(discountedPrice)}
                        </span>
                        <span className="pb-1 text-sm text-white/55">{billingLabel}</span>
                      </div>

                      {hasDiscount && (
                        <div className="mt-2 inline-flex rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 text-xs font-bold text-emerald-300">
                          {promoDiscount}% off applied
                        </div>
                      )}

                      {plan.key === "premium" && billing === "monthly" && !hasDiscount && (
                        <div className="mt-2 inline-flex rounded-full border border-emerald-400/20 bg-emerald-500/10 px-2 py-0.5 text-xs font-bold text-emerald-300">
                          7-day free trial
                        </div>
                      )}
                    </div>

                    <div className="mt-6 h-px bg-white/10" />

                    <ul className="mt-5 space-y-3 text-sm text-white/75 flex-1">
                      {plan.features.map((feature) => (
                        <li key={feature} className="flex items-start gap-2">
                          <CheckIcon />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>

                    <div className="mt-6">
                      {isFree ? (
                        <Link href={plan.href} className={`inline-flex w-full items-center justify-center rounded-xl px-5 py-3 text-sm font-bold transition ${plan.button}`}>
                          {plan.cta}
                        </Link>
                      ) : (
                        <button
                          type="button"
                          onClick={() => startCheckout(plan.key, billing, setLoading, promoStatus === "valid" ? promoCode : null)}
                          disabled={loading !== null}
                          className={`inline-flex w-full items-center justify-center rounded-xl px-5 py-3 text-sm font-bold transition disabled:cursor-not-allowed disabled:opacity-60 ${plan.button}`}
                        >
                          {isLoading ? "Loading..." : plan.cta}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── ADD-ONS ────────────────────────────────────────────────────── */}
        {activeSection === "addons" && (
          <div className="space-y-8">
            <div className="mx-auto max-w-2xl text-center">
              {/* FIX: escaped apostrophe */}
              <p className="text-white/60">
                Don&apos;t need a full subscription? Buy only the features you want — one-time payment, yours forever.
              </p>
            </div>

            <div className="flex justify-center">
              <div className="w-full max-w-sm">
                <PromoInput
                  value={promoCode}
                  onChange={(v) => { setPromoCode(v); setPromoStatus(null); }}
                  onValidate={() => validatePromo("badges")}
                  status={promoStatus}
                  discount={promoDiscount}
                  error={promoError}
                />
              </div>
            </div>

            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {addons.map((addon) => {
                const rawPrice = addon.price;
                const discountedPrice = applyDiscount(rawPrice);
                const hasDiscount = promoStatus === "valid" && discountedPrice !== rawPrice;
                const isLoading = addonLoading === addon.key;

                return (
                  <div
                    key={addon.key}
                    className="flex flex-col rounded-3xl border border-white/10 bg-[#111827] p-6"
                  >
                    <div className="mb-4 text-3xl">{addon.icon}</div>
                    <h3 className="text-lg font-black text-white">{addon.name}</h3>
                    <p className="mt-2 text-sm text-white/55 flex-1">{addon.description}</p>

                    <div className="mt-5 flex items-end gap-2">
                      {hasDiscount && (
                        <span className="text-sm text-white/30 line-through">{formatMoney(rawPrice)}</span>
                      )}
                      <span className="text-3xl font-black text-white">{formatMoney(discountedPrice)}</span>
                      <span className="pb-1 text-sm text-white/45">one-time</span>
                    </div>

                    {hasDiscount && (
                      <div className="mt-2 inline-flex rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 text-xs font-bold text-emerald-300 w-fit">
                        {promoDiscount}% off
                      </div>
                    )}

                    <div className="mt-5">
                      {addon.href ? (
                        <Link
                          href={addon.href}
                          className="inline-flex w-full items-center justify-center rounded-xl border border-white/10 bg-white/10 px-5 py-3 text-sm font-bold text-white transition hover:bg-white/15"
                        >
                          Get it →
                        </Link>
                      ) : (
                        <button
                          type="button"
                          onClick={() => startAddonCheckout(addon.key, setAddonLoading, promoStatus === "valid" ? promoCode : null)}
                          disabled={addonLoading !== null}
                          className="inline-flex w-full items-center justify-center rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {isLoading ? "Loading..." : "Buy now"}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <p className="text-center text-sm text-white/35">
              Individual purchases are applied to your account permanently. No recurring charges.
            </p>
          </div>
        )}

      </main>
    </div>
  );
}
