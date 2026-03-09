// src/components/pricing/PricingClient.js
"use client";

import Link from "next/link";
import { useState } from "react";

const plans = [
  {
    key: "free",
    name: "Free",
    price: "£0",
    accent: "border-white/10 bg-[#111827]",
    button:
      "bg-white/10 text-white hover:bg-white/15 border border-white/10",
    featured: false,
    cta: "Get Started",
    href: "/account",
    features: [
      "Basic link page",
      "Custom profile URL",
      "Basic analytics",
      "Unlimited links",
    ],
  },
  {
    key: "basic",
    name: "Basic",
    price: "£5",
    accent: "border-blue-500/30 bg-[#111827]",
    button: "bg-blue-600 text-white hover:bg-blue-500",
    featured: false,
    cta: "Upgrade",
    features: [
      "Everything in Free",
      "Priority support",
      "Custom backgrounds",
      "Profile customization",
    ],
  },
  {
    key: "premium",
    name: "Premium",
    price: "£20",
    accent:
      "border-blue-500 bg-gradient-to-b from-blue-500/10 to-[#111827] shadow-[0_0_0_1px_rgba(59,130,246,0.2),0_20px_60px_rgba(37,99,235,0.15)]",
    button: "bg-blue-600 text-white hover:bg-blue-500",
    featured: true,
    badge: "Most Popular",
    cta: "Upgrade",
    features: [
      "Everything in Basic",
      "Advanced analytics",
      "Priority page loading",
      "Premium themes",
    ],
  },
  {
    key: "exclusive",
    name: "Exclusive",
    price: "£100",
    accent:
      "border-amber-500/40 bg-gradient-to-b from-amber-500/10 to-[#111827]",
    button: "bg-amber-500 text-black hover:bg-amber-400",
    featured: false,
    cta: "Upgrade",
    features: [
      "Everything in Premium",
      "Custom domain support",
      "Advanced integrations",
      "Priority feature access",
    ],
  },
];

async function startCheckout(plan, setLoading) {
  try {
    setLoading(plan);

    const res = await fetch("/api/stripe/checkout", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ plan }),
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data?.error || data?.details || "Checkout failed");
    }

    if (data?.url) {
      window.location.href = data.url;
      return;
    }

    throw new Error("Missing checkout URL");
  } catch (error) {
    console.error("Stripe checkout failed:", error);
    alert(error?.message || "Something went wrong");
    setLoading(null);
  }
}

function CheckIcon() {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="none"
      className="mt-0.5 h-5 w-5 flex-none text-blue-400"
      aria-hidden="true"
    >
      <path
        d="M16.667 5 7.5 14.167 3.333 10"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function PricingClient() {
  const [loading, setLoading] = useState(null);

  return (
    <div className="px-4 py-16 text-white">
      <main className="mx-auto max-w-7xl">
        <div className="mx-auto mb-14 max-w-3xl text-center">
          <div className="mb-4 inline-flex rounded-full border border-blue-400/20 bg-blue-500/10 px-4 py-1.5 text-xs font-extrabold uppercase tracking-[0.22em] text-blue-300">
            Pricing
          </div>

          <h1 className="text-4xl font-black tracking-tight sm:text-5xl">
            Choose the right plan for your page
          </h1>

          <p className="mt-4 text-base text-white/65 sm:text-lg">
            Start free and upgrade whenever you need more customization,
            analytics, and premium features.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          {plans.map((plan) => (
            <div
              key={plan.key}
              className={`relative flex min-h-[560px] flex-col rounded-3xl border p-8 ${plan.accent}`}
            >
              {plan.featured && (
                <div className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2 rounded-full border border-blue-400/30 bg-blue-500 px-4 py-1 text-xs font-extrabold uppercase tracking-[0.18em] text-white shadow-lg">
                  {plan.badge}
                </div>
              )}

              <div>
                <h2 className="text-2xl font-black text-white">{plan.name}</h2>

                <div className="mt-5 flex items-end gap-1">
                  <span className="text-5xl font-black leading-none text-white">
                    {plan.price}
                  </span>
                  <span className="pb-1 text-sm text-white/60">/month</span>
                </div>
              </div>

              <div className="mt-8 h-px bg-white/10" />

              <ul className="mt-8 space-y-4 text-sm text-white/80">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-3">
                    <CheckIcon />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              <div className="mt-auto pt-8">
                {plan.key === "free" ? (
                  <Link
                    href={plan.href}
                    className={`inline-flex w-full items-center justify-center rounded-xl px-5 py-3 text-sm font-bold transition ${plan.button}`}
                  >
                    {plan.cta}
                  </Link>
                ) : (
                  <button
                    type="button"
                    onClick={() => startCheckout(plan.key, setLoading)}
                    disabled={loading !== null}
                    className={`inline-flex w-full items-center justify-center rounded-xl px-5 py-3 text-sm font-bold transition disabled:cursor-not-allowed disabled:opacity-60 ${plan.button}`}
                  >
                    {loading === plan.key ? "Loading..." : plan.cta}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
