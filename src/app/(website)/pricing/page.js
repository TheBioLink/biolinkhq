"use client";

import Link from "next/link";
import { useState } from "react";

export const metadata = {
  title: "BiolinkHQ | Pricing",
  description:
    "Choose a plan for BiolinkHQ and unlock more features for your link-in-bio page.",
};

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

    if (data?.url) {
      window.location.href = data.url;
    }
  } catch (e) {
    console.error(e);
  } finally {
    setLoading(null);
  }
}

export default function Pricing() {
  const [loading, setLoading] = useState(null);

  return (
    <div className="py-12 px-4">
      <main className="max-w-6xl mx-auto">
        <h1 className="text-center text-5xl font-bold mb-16">
          Pricing Plans
        </h1>

        <div className="flex flex-wrap justify-center gap-10">
          {/* FREE */}
          <div className="w-full max-w-sm p-8 border border-gray-200 rounded-xl shadow-sm hover:shadow-lg transition bg-white">
            <h2 className="text-2xl font-semibold text-center mb-4">
              Free
            </h2>

            <div className="text-center text-4xl font-bold mb-6">
              £0
              <span className="text-sm font-normal text-gray-500">
                /month
              </span>
            </div>

            <ul className="space-y-2 mb-8 text-gray-700">
              <li>Basic link page</li>
              <li>Custom profile URL</li>
              <li>Basic analytics</li>
              <li>Unlimited links</li>
            </ul>

            <div className="text-center">
              <Link
                href="/account"
                className="inline-block bg-gray-800 text-white px-6 py-2 rounded-lg hover:bg-gray-700 transition"
              >
                Get Started
              </Link>
            </div>
          </div>

          {/* BASIC */}
          <div className="w-full max-w-sm p-8 border border-gray-200 rounded-xl shadow-sm hover:shadow-lg transition bg-white">
            <h2 className="text-2xl font-semibold text-center mb-4">
              Basic
            </h2>

            <div className="text-center text-4xl font-bold mb-6">
              £5
              <span className="text-sm font-normal text-gray-500">
                /month
              </span>
            </div>

            <ul className="space-y-2 mb-8 text-gray-700">
              <li>Everything in Free</li>
              <li>Priority support</li>
              <li>Custom backgrounds</li>
              <li>Profile customization</li>
            </ul>

            <div className="text-center">
              <button
                onClick={() => startCheckout("basic", setLoading)}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-500 transition"
              >
                {loading === "basic" ? "Loading..." : "Upgrade"}
              </button>
            </div>
          </div>

          {/* PREMIUM */}
          <div className="w-full max-w-sm p-8 border-2 border-blue-500 rounded-xl shadow-md hover:shadow-lg transition bg-blue-50">
            <h2 className="text-2xl font-semibold text-center mb-4">
              Premium
            </h2>

            <div className="text-center text-4xl font-bold mb-6">
              £20
              <span className="text-sm font-normal text-gray-600">
                /month
              </span>
            </div>

            <ul className="space-y-2 mb-8 text-gray-700">
              <li>Everything in Basic</li>
              <li>Advanced analytics</li>
              <li>Priority page loading</li>
              <li>Premium themes</li>
            </ul>

            <div className="text-center">
              <button
                onClick={() => startCheckout("premium", setLoading)}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-500 transition"
              >
                {loading === "premium" ? "Loading..." : "Upgrade"}
              </button>
            </div>
          </div>

          {/* EXCLUSIVE */}
          <div className="w-full max-w-sm p-8 border border-yellow-400 rounded-xl shadow-md hover:shadow-lg transition bg-yellow-50">
            <h2 className="text-2xl font-semibold text-center mb-4">
              Exclusive
            </h2>

            <div className="text-center text-4xl font-bold mb-6">
              £100
              <span className="text-sm font-normal text-gray-600">
                /month
              </span>
            </div>

            <ul className="space-y-2 mb-8 text-gray-700">
              <li>Everything in Premium</li>
              <li>Custom domain support</li>
              <li>Advanced integrations</li>
              <li>Priority feature access</li>
            </ul>

            <div className="text-center">
              <button
                onClick={() => startCheckout("exclusive", setLoading)}
                className="bg-yellow-500 text-white px-6 py-2 rounded-lg hover:bg-yellow-400 transition"
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
