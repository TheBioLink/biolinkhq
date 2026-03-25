"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

const CREDIT_TO_GBP = 20 / 450;

// 💳 Plans
const plans = [
  {
    key: "free",
    name: "Free",
    monthly: 0,
    annual: 0,
    priceLabelMonthly: "£0",
    priceLabelAnnual: "£0",
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
    monthly: 500,
    annual: 5000,
    priceLabelMonthly: "£5",
    priceLabelAnnual: "£50",
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
    monthly: 2000,
    annual: 20000,
    priceLabelMonthly: "£20",
    priceLabelAnnual: "£200",
    featured: true,
    features: [
      "Everything in Basic",
      "Advanced analytics",
      "Priority loading",
      "Premium themes",
      "💰 Credits supported",
    ],
  },
  {
    key: "exclusive",
    name: "Exclusive",
    monthly: 10000,
    annual: 100000,
    priceLabelMonthly: "£100",
    priceLabelAnnual: "£1000",
    features: [
      "Everything in Premium",
      "Custom domain",
      "Advanced integrations",
      "Priority feature access",
    ],
  },
];

// 🚀 Checkout
async function startCheckout(plan, billing, paymentOption, setLoading) {
  try {
    setLoading(`${plan}:${billing}:${paymentOption}`);

    const res = await fetch("/api/stripe/checkout", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ plan, billing, paymentOption }),
    });

    let data;
    try {
      data = await res.json();
    } catch {
      throw new Error("Invalid server response");
    }

    if (!res.ok) {
      throw new Error(data?.error || "Checkout failed");
    }

    if (data?.url) {
      window.location.href = data.url;
      return;
    }

    throw new Error("Missing checkout URL");
  } catch (err) {
    console.error(err);
    alert(err.message);
    setLoading(null);
  }
}

function Check() {
  return (
    <span className="text-blue-400 font-bold">✓</span>
  );
}

export default function PricingClient() {
  const [billing, setBilling] = useState("monthly");
  const [loading, setLoading] = useState(null);

  const [user, setUser] = useState({
    credits: 0,
    hasPaymentMethod: false,
  });

  // 🔄 Fetch user
  useEffect(() => {
    fetch("/api/user/me")
      .then((r) => r.json())
      .then(setUser)
      .catch(() => {});
  }, []);

  const creditGBP = user.credits * CREDIT_TO_GBP;

  return (
    <div className="px-6 py-16 text-white">
      <div className="max-w-6xl mx-auto">

        {/* HEADER */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-black">Pricing</h1>

          <p className="text-white/60 mt-3">
            Credits:{" "}
            <span className="text-blue-400 font-bold">
              {user.credits} (~£{creditGBP.toFixed(2)})
            </span>
          </p>

          <div className="mt-6 flex justify-center gap-4">
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
            const isFree = plan.key === "free";

            const price =
              billing === "annual"
                ? plan.annual
                : plan.monthly;

            const label =
              billing === "annual"
                ? plan.priceLabelAnnual
                : plan.priceLabelMonthly;

            const periodsCovered = Math.floor(
              (creditGBP * 100) / price
            );

            const canUseCredits =
              !isFree &&
              user.hasPaymentMethod &&
              periodsCovered > 0;

            const isLoading =
              loading === `${plan.key}:${billing}:credits` ||
              loading === `${plan.key}:${billing}:card`;

            return (
              <div
                key={plan.key}
                className={`p-6 rounded-2xl border ${
                  plan.featured
                    ? "border-blue-500"
                    : "border-white/10"
                }`}
              >
                <h2 className="text-xl font-bold">{plan.name}</h2>

                <div className="text-3xl font-black mt-3">
                  {label}
                  <span className="text-sm text-white/60">
                    /{billing === "annual" ? "year" : "month"}
                  </span>
                </div>

                {/* CREDIT INFO */}
                {canUseCredits && (
                  <div className="text-green-400 text-sm mt-2">
                    Covers ~{periodsCovered}{" "}
                    {billing === "annual" ? "year(s)" : "month(s)"}
                  </div>
                )}

                <ul className="mt-6 space-y-2 text-sm text-white/80">
                  {plan.features.map((f) => (
                    <li key={f} className="flex gap-2">
                      <Check /> {f}
                    </li>
                  ))}
                </ul>

                {/* BUTTONS */}
                <div className="mt-6 space-y-2">

                  {isFree ? (
                    <Link
                      href="/account"
                      className="block text-center bg-white/10 py-3 rounded"
                    >
                      Get Started
                    </Link>
                  ) : (
                    <>
                      {/* 💰 CREDIT BUTTON */}
                      {canUseCredits && (
                        <button
                          onClick={() =>
                            startCheckout(
                              plan.key,
                              billing,
                              "credits",
                              setLoading
                            )
                          }
                          className="w-full bg-green-500 text-black py-3 rounded"
                        >
                          💰 Buy with credits & subscribe
                        </button>
                      )}

                      {/* 💳 NORMAL BUTTON */}
                      <button
                        onClick={() =>
                          startCheckout(
                            plan.key,
                            billing,
                            "card",
                            setLoading
                          )
                        }
                        disabled={loading !== null}
                        className="w-full bg-blue-600 py-3 rounded disabled:opacity-50"
                      >
                        {isLoading ? "Loading..." : "Upgrade"}
                      </button>

                      {!user.hasPaymentMethod && (
                        <p className="text-xs text-yellow-400">
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
      </div>
    </div>
  );
}
