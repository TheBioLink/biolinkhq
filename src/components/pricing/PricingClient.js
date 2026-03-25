"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

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
      "💰 Credits supported",
      "7-day free trial (card only)",
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

const CREDIT_TO_GBP = 20 / 450;

async function startCheckout(plan, billing, setLoading) {
  try {
    setLoading(`${plan}-${billing}`);

    const res = await fetch("/api/stripe/checkout", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ plan, billing }),
    });

    const data = await res.json();

    if (!res.ok) throw new Error(data.error);

    window.location.href = data.url;
  } catch (err) {
    alert(err.message);
    setLoading(null);
  }
}

async function startCreditsCheckout(plan, billing, setLoading) {
  try {
    setLoading(`credits-${plan}-${billing}`);

    const res = await fetch("/api/stripe/checkout-credits", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ plan, billing }),
    });

    const data = await res.json();

    if (!res.ok) throw new Error(data.error);

    window.location.href = data.url;
  } catch (err) {
    alert(err.message);
    setLoading(null);
  }
}

function CheckIcon() {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="none"
      className="h-5 w-5 text-blue-400"
    >
      <path
        d="M16.667 5 7.5 14.167 3.333 10"
        stroke="currentColor"
        strokeWidth="2"
      />
    </svg>
  );
}

export default function PricingClient() {
  const [billing, setBilling] = useState("monthly");
  const [loading, setLoading] = useState(null);

  const [credits, setCredits] = useState(0);
  const [hasPaymentMethod, setHasPaymentMethod] = useState(false);

  useEffect(() => {
    fetch("/api/user/me")
      .then((res) => res.json())
      .then((data) => {
        setCredits(data.credits || 0);
        setHasPaymentMethod(data.hasPaymentMethod || false);
      });
  }, []);

  const billingLabel = useMemo(
    () => (billing === "annual" ? "/year" : "/month"),
    [billing]
  );

  const creditGBP = credits * CREDIT_TO_GBP;

  return (
    <div className="px-4 py-16 text-white">
      <main className="mx-auto max-w-7xl">
        {/* HEADER */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-black">Pricing</h1>

          <p className="mt-3 text-blue-300">
            Credits: {credits} (~£{creditGBP.toFixed(2)})
          </p>

          <div className="mt-6 flex justify-center gap-3">
            <button
              onClick={() => setBilling("monthly")}
              className={`px-4 py-2 rounded ${
                billing === "monthly"
                  ? "bg-blue-600"
                  : "bg-white/10"
              }`}
            >
              Monthly
            </button>

            <button
              onClick={() => setBilling("annual")}
              className={`px-4 py-2 rounded ${
                billing === "annual"
                  ? "bg-blue-600"
                  : "bg-white/10"
              }`}
            >
              Annual
            </button>
          </div>
        </div>

        {/* PLANS */}
        <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-6">
          {plans.map((plan) => {
            const price =
              billing === "annual"
                ? plan.annualPrice
                : plan.monthlyPrice;

            const isFree = plan.key === "free";

            const PRICES = {
              basic: { monthly: 500, annual: 5000 },
              premium: { monthly: 2000, annual: 20000 },
              exclusive: { monthly: 10000, annual: 100000 },
            };

            const rawPrice = PRICES[plan.key]?.[billing] || 0;

            const periodsCovered = Math.floor(
              (creditGBP * 100) / rawPrice
            );

            const canUseCredits = periodsCovered > 0;

            const isLoading =
              loading === `${plan.key}-${billing}` ||
              loading === `credits-${plan.key}-${billing}`;

            return (
              <div
                key={plan.key}
                className={`flex flex-col p-6 rounded-2xl border ${plan.accent}`}
              >
                <h2 className="text-2xl font-bold">{plan.name}</h2>
                <p className="text-white/60">{plan.subtitle}</p>

                <div className="mt-4 text-4xl font-black">
                  {price}
                  <span className="text-sm ml-1">
                    {billingLabel}
                  </span>
                </div>

                <ul className="mt-6 space-y-2 text-sm">
                  {plan.features.map((f) => (
                    <li key={f} className="flex gap-2">
                      <CheckIcon />
                      {f}
                    </li>
                  ))}
                </ul>

                <div className="mt-auto pt-6 space-y-2">
                  {isFree ? (
                    <Link
                      href={plan.href}
                      className="block w-full text-center py-3 bg-white/10 rounded"
                    >
                      Get Started
                    </Link>
                  ) : (
                    <>
                      {/* NORMAL */}
                      <button
                        onClick={() =>
                          startCheckout(plan.key, billing, setLoading)
                        }
                        disabled={loading}
                        className={`w-full py-3 rounded ${plan.button}`}
                      >
                        {isLoading ? "Loading..." : "Upgrade"}
                      </button>

                      {/* CREDITS */}
                      {canUseCredits && (
                        <button
                          onClick={() =>
                            startCreditsCheckout(
                              plan.key,
                              billing,
                              setLoading
                            )
                          }
                          disabled={loading}
                          className="w-full py-3 rounded bg-green-500 text-black font-bold"
                        >
                          💰 Buy with credits ({periodsCovered} period
                          {periodsCovered > 1 ? "s" : ""})
                        </button>
                      )}

                      {!hasPaymentMethod && (
                        <p className="text-xs text-yellow-400 text-center">
                          Card required (no charge today)
                        </p>
                      )}
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}
