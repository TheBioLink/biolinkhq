"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

const CREDIT_TO_GBP = 20 / 450;

const PRICES = {
  basic: { monthly: 500, annual: 5000 },
  premium: { monthly: 2000, annual: 20000 },
  exclusive: { monthly: 10000, annual: 100000 },
};

const plans = [
  {
    key: "basic",
    name: "Basic",
    monthlyPrice: "£5",
    annualPrice: "£50",
    subtitle: "More control and customization",
  },
  {
    key: "premium",
    name: "Premium",
    monthlyPrice: "£20",
    annualPrice: "£200",
    subtitle: "Advanced tools for growth",
  },
  {
    key: "exclusive",
    name: "Exclusive",
    monthlyPrice: "£100",
    annualPrice: "£1000",
    subtitle: "Top-tier access",
  },
];

async function startCheckout(plan, billing, setLoading) {
  setLoading(`${plan}-${billing}`);

  const res = await fetch("/api/stripe/checkout", {
    method: "POST",
    body: JSON.stringify({ plan, billing }),
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.error);

  window.location.href = data.url;
}

async function startCreditsCheckout(plan, billing, setLoading) {
  setLoading(`credits-${plan}-${billing}`);

  const res = await fetch("/api/stripe/checkout-credits", {
    method: "POST",
    body: JSON.stringify({ plan, billing }),
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.error);

  window.location.href = data.url;
}

export default function PricingClient() {
  const [billing, setBilling] = useState("monthly");
  const [credits, setCredits] = useState(0);
  const [loading, setLoading] = useState(null);

  useEffect(() => {
    fetch("/api/user/me")
      .then((r) => r.json())
      .then((d) => setCredits(d.credits || 0));
  }, []);

  const creditGBP = credits * CREDIT_TO_GBP;

  const affordablePlans = plans
    .map((plan) => {
      const price = PRICES[plan.key][billing];

      const periods = Math.floor(
        (creditGBP * 100) / price
      );

      return { ...plan, periods };
    })
    .filter((p) => p.periods > 0);

  const billingLabel = useMemo(
    () => (billing === "annual" ? "/year" : "/month"),
    [billing]
  );

  return (
    <div className="px-4 py-16 text-white max-w-7xl mx-auto">
      {/* HEADER */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-black">Pricing</h1>

        <p className="text-blue-300 mt-2">
          Credits: {credits} (~£{creditGBP.toFixed(2)})
        </p>

        <div className="mt-6 flex justify-center gap-2">
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

      {/* 💰 CREDITS SHOP */}
      {affordablePlans.length > 0 && (
        <div className="mb-16">
          <h2 className="text-2xl font-bold mb-4 text-green-400">
            💰 Use your credits
          </h2>

          <div className="grid md:grid-cols-3 gap-6">
            {affordablePlans.map((plan) => (
              <div
                key={plan.key}
                className="p-6 rounded-xl border border-green-500/30 bg-green-500/5"
              >
                <h3 className="text-xl font-bold">
                  {plan.name}
                </h3>

                <p className="text-white/60 text-sm">
                  {plan.subtitle}
                </p>

                <div className="mt-4 text-lg font-bold text-green-400">
                  £0 today
                </div>

                <div className="text-sm text-green-300 mt-1">
                  Covers {plan.periods}{" "}
                  {billing === "annual" ? "year(s)" : "month(s)"}
                </div>

                <button
                  onClick={() =>
                    startCreditsCheckout(
                      plan.key,
                      billing,
                      setLoading
                    )
                  }
                  className="mt-5 w-full py-3 bg-green-500 text-black rounded font-bold"
                >
                  Use Credits
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 💳 NORMAL PRICING */}
      <div>
        <h2 className="text-2xl font-bold mb-4">
          💳 Subscription plans
        </h2>

        <div className="grid md:grid-cols-3 gap-6">
          {plans.map((plan) => (
            <div
              key={plan.key}
              className="p-6 rounded-xl border border-white/10 bg-[#111827]"
            >
              <h3 className="text-xl font-bold">
                {plan.name}
              </h3>

              <p className="text-white/60 text-sm">
                {plan.subtitle}
              </p>

              <div className="mt-4 text-3xl font-black">
                {billing === "annual"
                  ? plan.annualPrice
                  : plan.monthlyPrice}
                <span className="text-sm ml-1">
                  {billingLabel}
                </span>
              </div>

              {plan.key === "premium" &&
                billing === "monthly" && (
                  <p className="text-green-400 text-sm mt-2">
                    7-day free trial
                  </p>
                )}

              <button
                onClick={() =>
                  startCheckout(plan.key, billing, setLoading)
                }
                className="mt-6 w-full py-3 bg-blue-600 rounded"
              >
                {plan.key === "premium"
                  ? "Start Free Trial"
                  : "Upgrade"}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
