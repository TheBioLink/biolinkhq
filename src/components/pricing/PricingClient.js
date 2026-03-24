"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

const CREDIT_VALUE = 20 / 450;

const plans = [
  {
    key: "free",
    name: "Free",
    monthlyPrice: "£0",
    annualPrice: "£0",
    subtitle: "Perfect to get started",
    accent: "border-white/10 bg-[#111827]",
    button: "bg-white/10 text-white hover:bg-white/15 border border-white/10",
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
      "7-day free trial on monthly",
    ],
  },
  {
    key: "exclusive",
    name: "Exclusive",
    monthlyPrice: "£100",
    annualPrice: "£1000",
    subtitle: "Top-tier access and support",
    accent: "border-amber-500/40 bg-gradient-to-b from-amber-500/10 to-[#111827]",
    button: "bg-amber-500 text-black hover:bg-amber-400",
    cta: "Upgrade",
    features: [
      "Everything in Premium",
      "Custom domain support",
      "Advanced integrations",
      "Priority feature access",
    ],
  },
];

async function startCheckout(plan, billing, paymentOption, setLoading) {
  try {
    setLoading(`${plan}:${billing}:${paymentOption}`);

    const res = await fetch("/api/stripe/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ plan, billing, paymentOption }),
    });

    const data = await res.json();

    if (!res.ok) throw new Error(data?.error || data?.details || "Checkout failed");

    if (data?.url) {
      window.location.href = data.url;
      return;
    }

    throw new Error("Missing checkout URL");
  } catch (err) {
    console.error(err);
    alert(err.message || "Checkout failed");
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
  const [billing, setBilling] = useState("monthly");
  const [loading, setLoading] = useState(null);
  const [user, setUser] = useState({
    credits: 0,
    hasPaymentMethod: false,
    email: "",
  });

  // Fetch user info and also check Stripe for saved cards
  useEffect(() => {
    async function fetchUser() {
      try {
        const res = await fetch("/api/user/me");
        const data = await res.json();

        if (!res.ok) throw new Error(data?.error || "Failed to fetch user");

        // Check if Stripe customer has saved cards
        let hasCard = false;
        if (data.email) {
          const stripeRes = await fetch(`/api/stripe/check-cards?email=${data.email}`);
          const stripeData = await stripeRes.json();
          hasCard = stripeData?.hasPaymentMethod || false;
        }

        setUser({ ...data, hasPaymentMethod: hasCard });
      } catch (err) {
        console.error(err);
      }
    }

    fetchUser();
  }, []);

  const creditGBP = user.credits * CREDIT_VALUE;
  const canUseCredits = creditGBP >= 20 && user.hasPaymentMethod;

  const billingLabel = useMemo(() => (billing === "annual" ? "/year" : "/month"), [billing]);

  return (
    <div className="px-4 py-16 text-white">
      <main className="mx-auto max-w-7xl">
        <div className="mx-auto mb-14 max-w-3xl text-center">
          <h1 className="text-4xl font-black tracking-tight sm:text-5xl">
            Choose the right plan for your page
          </h1>
          <p className="mt-4 text-base text-white/65 sm:text-lg">
            Start free and upgrade whenever you need more customization, analytics, and premium features.
          </p>

          <div className="mt-8 inline-flex rounded-2xl border border-white/10 bg-[#111827] p-1">
            <button
              type="button"
              onClick={() => setBilling("monthly")}
              className={`rounded-xl px-5 py-2.5 text-sm font-bold transition ${
                billing === "monthly" ? "bg-blue-600 text-white" : "text-white/70 hover:text-white"
              }`}
            >
              Monthly
            </button>
            <button
              type="button"
              onClick={() => setBilling("annual")}
              className={`rounded-xl px-5 py-2.5 text-sm font-bold transition ${
                billing === "annual" ? "bg-blue-600 text-white" : "text-white/70 hover:text-white"
              }`}
            >
              Annual
            </button>
          </div>

          {billing === "monthly" && (
            <div className="mt-3 text-sm text-blue-300">Premium includes a 7-day free trial</div>
          )}

          <div className="mt-6 text-sm text-blue-300">
            You have {user.credits} credits (~£{creditGBP.toFixed(2)})
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          {plans.map((plan) => {
            const isFree = plan.key === "free";
            const currentPrice = billing === "annual" ? plan.annualPrice : plan.monthlyPrice;
            const isLoading = loading === `${plan.key}:${billing}:${plan.key === "premium" && canUseCredits ? "credits" : "card"}`;

            return (
              <div
                key={plan.key}
                className={`relative flex min-h-[590px] flex-col rounded-3xl border p-8 ${plan.accent}`}
              >
                {plan.featured && (
                  <div className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2 rounded-full border border-blue-400/30 bg-blue-500 px-4 py-1 text-xs font-extrabold uppercase tracking-[0.18em] text-white shadow-lg">
                    {plan.badge}
                  </div>
                )}

                <div>
                  <h2 className="text-2xl font-black text-white">{plan.name}</h2>
                  <p className="mt-2 text-sm text-white/60">{plan.subtitle}</p>

                  <div className="mt-5 flex items-end gap-1">
                    <span className="text-5xl font-black leading-none text-white">{currentPrice}</span>
                    <span className="pb-1 text-sm text-white/60">{billingLabel}</span>
                  </div>

                  {plan.key === "premium" && billing === "monthly" && (
                    <div className="mt-3 inline-flex rounded-full border border-emerald-400/20 bg-emerald-500/10 px-3 py-1 text-xs font-bold text-emerald-300">
                      7-day free trial
                    </div>
                  )}
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
                  {isFree ? (
                    <Link
                      href={plan.href}
                      className={`inline-flex w-full items-center justify-center rounded-xl px-5 py-3 text-sm font-bold transition ${plan.button}`}
                    >
                      {plan.cta}
                    </Link>
                  ) : (
                    <>
                      {plan.key === "premium" && canUseCredits && (
                        <button
                          onClick={() =>
                            startCheckout(plan.key, billing, "credits", setLoading)
                          }
                          disabled={loading !== null}
                          className="mb-2 inline-flex w-full items-center justify-center rounded-xl bg-green-500 text-black px-5 py-3 text-sm font-bold disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {isLoading ? "Loading..." : "💰 Buy with credits & subscribe"}
                        </button>
                      )}

                      <button
                        onClick={() =>
                          startCheckout(plan.key, billing, "card", setLoading)
                        }
                        disabled={loading !== null}
                        className={`inline-flex w-full items-center justify-center rounded-xl px-5 py-3 text-sm font-bold disabled:cursor-not-allowed disabled:opacity-60 ${plan.button}`}
                      >
                        {isLoading
                          ? "Loading..."
                          : `${plan.cta} ${billing === "annual" ? "Yearly" : "Monthly"}`}
                      </button>

                      {!user.hasPaymentMethod && plan.key === "premium" && (
                        <p className="mt-2 text-xs text-yellow-400">
                          Add a payment method to use credits
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
