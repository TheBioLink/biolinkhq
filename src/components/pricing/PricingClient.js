// src/components/pricing/PricingClient.js
"use client";

import Link from "next/link";
import { useState } from "react";

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
    }
  } catch (error) {
    console.error("Stripe checkout failed:", error);
    setLoading(null);
    alert(error?.message || "Something went wrong");
  }
}

export default function PricingClient() {
  const [loading, setLoading] = useState(null);

  return (
    <div className="px-4 py-12">
      <main className="mx-auto max-w-6xl">
        <h1 className="mb-16 text-center text-5xl font-bold">Pricing Plans</h1>

        <div className="flex flex-wrap justify-center gap-10">
          <div className="w-full max-w-sm rounded-xl border border-gray-200 bg-white p-8 shadow-sm transition hover:shadow-lg">
            <h2 className="mb-4 text-center text-2xl font-semibold">Free</h2>

            <div className="mb-6 text-center text-4xl font-bold">
              £0
              <span className="text-sm font-normal text-gray-500">/month</span>
            </div>

            <ul className="mb-8 space-y-2 text-gray-700">
              <li>Basic link page</li>
              <li>Custom profile URL</li>
              <li>Basic analytics</li>
              <li>Unlimited links</li>
            </ul>

            <div className="text-center">
              <Link
                href="/account"
                className="inline-block rounded-lg bg-gray-800 px-6 py-2 text-white transition hover:bg-gray-700"
              >
                Get Started
              </Link>
            </div>
          </div>

          <div className="w-full max-w-sm rounded-xl border border-gray-200 bg-white p-8 shadow-sm transition hover:shadow-lg">
            <h2 className="mb-4 text-center text-2xl font-semibold">Basic</h2>

            <div className="mb-6 text-center text-4xl font-bold">
              £5
              <span className="text-sm font-normal text-gray-500">/month</span>
            </div>

            <ul className="mb-8 space-y-2 text-gray-700">
              <li>Everything in Free</li>
              <li>Priority support</li>
              <li>Custom backgrounds</li>
              <li>Profile customization</li>
            </ul>

            <div className="text-center">
              <button
                type="button"
                onClick={() => startCheckout("basic", setLoading)}
                disabled={loading !== null}
                className="rounded-lg bg-blue-600 px-6 py-2 text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading === "basic" ? "Loading..." : "Upgrade"}
              </button>
            </div>
          </div>

          <div className="w-full max-w-sm rounded-xl border-2 border-blue-500 bg-blue-50 p-8 shadow-md transition hover:shadow-lg">
            <h2 className="mb-4 text-center text-2xl font-semibold">
              Premium
            </h2>

            <div className="mb-6 text-center text-4xl font-bold">
              £20
              <span className="text-sm font-normal text-gray-600">/month</span>
            </div>

            <ul className="mb-8 space-y-2 text-gray-700">
              <li>Everything in Basic</li>
              <li>Advanced analytics</li>
              <li>Priority page loading</li>
              <li>Premium themes</li>
            </ul>

            <div className="text-center">
              <button
                type="button"
                onClick={() => startCheckout("premium", setLoading)}
                disabled={loading !== null}
                className="rounded-lg bg-blue-600 px-6 py-2 text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading === "premium" ? "Loading..." : "Upgrade"}
              </button>
            </div>
          </div>

          <div className="w-full max-w-sm rounded-xl border border-yellow-400 bg-yellow-50 p-8 shadow-md transition hover:shadow-lg">
            <h2 className="mb-4 text-center text-2xl font-semibold">
              Exclusive
            </h2>

            <div className="mb-6 text-center text-4xl font-bold">
              £100
              <span className="text-sm font-normal text-gray-600">/month</span>
            </div>

            <ul className="mb-8 space-y-2 text-gray-700">
              <li>Everything in Premium</li>
              <li>Custom domain support</li>
              <li>Advanced integrations</li>
              <li>Priority feature access</li>
            </ul>

            <div className="text-center">
              <button
                type="button"
                onClick={() => startCheckout("exclusive", setLoading)}
                disabled={loading !== null}
                className="rounded-lg bg-yellow-500 px-6 py-2 text-white transition hover:bg-yellow-400 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading === "exclusive" ? "Loading..." : "Upgrade"}
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
