"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

const CREDIT_VALUE = 20 / 450;

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

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data?.error || "Checkout failed");
    }

    if (data?.url) {
      window.location.href = data.url;
      return;
    }

    throw new Error("Missing checkout URL");
  } catch (err) {
    alert(err.message);
    setLoading(null);
  }
}

export default function PricingClient() {
  const [billing, setBilling] = useState("monthly");
  const [loading, setLoading] = useState(null);

  const [user, setUser] = useState({
    credits: 0,
    hasPaymentMethod: false,
  });

  useEffect(() => {
    fetch("/api/user/me")
      .then((r) => r.json())
      .then(setUser)
      .catch(() => {});
  }, []);

  const creditGBP = user.credits * CREDIT_VALUE;

  const canUseCredits = creditGBP >= 20 && user.hasPaymentMethod;

  return (
    <div className="p-10 text-white">
      <h1 className="text-3xl font-bold mb-6">Pricing</h1>

      <div className="mb-6 text-sm text-blue-300">
        You have {user.credits} credits (~£{creditGBP.toFixed(2)})
      </div>

      <div className="flex gap-4 mb-8">
        <button onClick={() => setBilling("monthly")}>
          Monthly
        </button>
        <button onClick={() => setBilling("annual")}>
          Annual
        </button>
      </div>

      {/* PREMIUM PLAN */}
      <div className="border p-6 rounded-xl max-w-sm">
        <h2 className="text-xl font-bold">Premium</h2>
        <p className="text-2xl">£20/month</p>

        {/* 🔥 CREDIT BUTTON */}
        {canUseCredits && (
          <button
            onClick={() =>
              startCheckout("premium", billing, "credits", setLoading)
            }
            className="w-full bg-green-500 text-black py-3 rounded mt-4"
          >
            💰 Buy with credits & subscribe
          </button>
        )}

        {/* NORMAL BUTTON */}
        <button
          onClick={() =>
            startCheckout("premium", billing, "card", setLoading)
          }
          className="w-full bg-blue-600 py-3 rounded mt-2"
        >
          Upgrade
        </button>

        {!user.hasPaymentMethod && (
          <p className="text-xs text-yellow-400 mt-2">
            Add a payment method to use credits
          </p>
        )}
      </div>
    </div>
  );
}
