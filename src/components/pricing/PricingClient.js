"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

const plans = [
  {
    key: "free",
    name: "Free",
    monthlyPrice: "£0",
    annualPrice: "£0",
    subtitle: "Perfect to get started",
    accent: "border-white/10 bg-[#111827]",
    button:
      "bg-white/10 text-white hover:bg-white/15 border border-white/10",
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
    monthlyPrice: "£5",
    annualPrice: "£50",
    subtitle: "More control and customization",
    accent: "border-blue-500/30 bg-[#111827]",
    button: "bg-blue-600 text-white hover:bg-blue-500",
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
    monthlyPrice: "£20",
    annualPrice: "£200",
    subtitle: "Advanced tools for growth",
    accent:
      "border-blue-500 bg-gradient-to-b from-blue-500/10 to-[#111827]",
    button: "bg-blue-600 text-white hover:bg-blue-500",
    featured: true,
    badge: "Most Popular",
    cta: "Upgrade",
    features: [
      "Everything in Basic",
      "Advanced analytics",
      "Priority page loading",
      "Premium themes",
      "7-day free trial",
      "💰 Pay with credits (450 = £20)",
      "🔁 Auto-renew after credits run out",
    ],
  },
  {
    key: "exclusive",
    name: "Exclusive",
    monthlyPrice: "£100",
    annualPrice: "£1000",
    subtitle: "Top-tier access and support",
    accent:
      "border-amber-500/40 bg-gradient-to-b from-amber-500/10 to-[#111827]",
    button: "bg-amber-500 text-black hover:bg-amber-400",
    cta: "Upgrade",
    features: [
      "Everything in Premium",
      "Custom domain support",
      "Advanced integrations",
      "Priority feature access",
      "💰 Credits supported",
    ],
  },
];

async function startCheckout(plan, billing, setLoading) {
  try {
    setLoading(`${plan}:${billing}`);

    const res = await fetch("/api/stripe/checkout", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ plan, billing }),
    });

    let data;
    try {
      data = await res.json();
    } catch {
      throw new Error("Invalid server response");
    }

    if (!res.ok) {
      throw new Error(data?.error || data?.details || "Checkout failed");
    }

    // 💳 Needs card → redirect to Stripe setup
    if (data?.needsPaymentMethod && data?.url) {
      window.location.href = data.url;
      return;
    }

    // 💳 Normal checkout
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
    <svg viewBox="0 0 20 20" fill="none" className="h-5 w-5 text-blue-400">
      <path
        d="M16.667 5 7.5 14.167 3.333 10"
        stroke="currentColor"
        strokeWidth="2"
      />
    </svg>
  );
}

export default function PricingClient() {
  const [loading, setLoading] = useState(null);
  const [billing, setBilling] = useState("monthly");

  const billingLabel = useMemo(
    () => (billing === "annual" ? "/year" : "/month"),
    [billing]
  );

  return (
    <div className="px-4 py-16 text-white">
      <main className="mx-auto max-w-7xl">

        {/* HEADER */}
        <div className="mx-auto mb-14 max-w-3xl text-center">
          <h1 className="text-4xl font-black tracking-tight sm:text-5xl">
            Choose the right plan
          </h1>

          <p className="mt-4 text-base text-white/65">
            Pay with credits or card. Credits convert at{" "}
            <span className="text-blue-400 font-bold">
              450 = £20
            </span>.
          </p>

          {/* BILLING TOGGLE */}
          <div className="mt-8 inline-flex rounded-2xl border border-white/10 bg-[#111827] p-1">
            <button
              onClick={() => setBilling("monthly")}
              className={`rounded-xl px-5 py-2.5 text-sm font-bold ${
                billing === "monthly"
                  ? "bg-blue-600 text-white"
                  : "text-white/70"
              }`}
            >
              Monthly
            </button>

            <button
              onClick={() => setBilling("annual")}
              className={`rounded-xl px-5 py-2.5 text-sm font-bold ${
                billing === "annual"
                  ? "bg-blue-600 text-white"
                  : "text-white/70"
              }`}
            >
              Annual
            </button>
          </div>
        </div>

        {/* PLANS */}
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          {plans.map((plan) => {
            const isFree = plan.key === "free";
            const currentPrice =
              billing === "annual"
                ? plan.annualPrice
                : plan.monthlyPrice;

            const isLoading = loading === `${plan.key}:${billing}`;

            return (
              <div
                key={plan.key}
                className={`flex flex-col rounded-3xl border p-8 ${plan.accent}`}
              >
                {plan.featured && (
                  <div className="mb-3 text-xs font-bold text-blue-400">
                    {plan.badge}
                  </div>
                )}

                <h2 className="text-2xl font-black">{plan.name}</h2>
                <p className="mt-2 text-sm text-white/60">
                  {plan.subtitle}
                </p>

                <div className="mt-5 flex items-end gap-1">
                  <span className="text-5xl font-black">
                    {currentPrice}
                  </span>
                  <span className="pb-1 text-sm text-white/60">
                    {billingLabel}
                  </span>
                </div>

                {/* FEATURES */}
                <ul className="mt-8 space-y-4 text-sm text-white/80">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-3">
                      <CheckIcon />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                {/* BUTTON */}
                <div className="mt-auto pt-8">
                  {isFree ? (
                    <Link
                      href={plan.href}
                      className={`w-full inline-flex justify-center rounded-xl px-5 py-3 text-sm font-bold ${plan.button}`}
                    >
                      {plan.cta}
                    </Link>
                  ) : (
                    <button
                      onClick={() =>
                        startCheckout(plan.key, billing, setLoading)
                      }
                      disabled={loading !== null}
                      className={`w-full rounded-xl px-5 py-3 text-sm font-bold ${plan.button} disabled:opacity-60`}
                    >
                      {isLoading
                        ? "Loading..."
                        : `${plan.cta} ${
                            billing === "annual"
                              ? "Yearly"
                              : "Monthly"
                          }`}
                    </button>
                  )}
                </div>

                {/* CREDIT INFO */}
                {!isFree && (
                  <div className="mt-4 text-center text-xs text-blue-300">
                    💡 Credits are used first, then your card is charged
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}
