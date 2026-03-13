"use client";

import Link from "next/link";

const plans = [
  {
    name: "Free",
    price: "£0",
    period: "/month",
    description: "Perfect for getting started with a clean link-in-bio page.",
    features: [
      "Public bio page",
      "Basic links and buttons",
      "Profile image and branding",
      "Essential analytics",
    ],
    ctaLabel: "Get started",
    ctaHref: "/login",
    featured: false,
  },
  {
    name: "Pro",
    price: "£9",
    period: "/month",
    description: "For creators and brands who want more control and growth.",
    features: [
      "Everything in Free",
      "More page customization",
      "Better analytics",
      "Priority access to upgrades",
      "Enhanced sharing tools",
    ],
    ctaLabel: "Upgrade to Pro",
    ctaHref: "/login",
    featured: true,
  },
  {
    name: "Business",
    price: "Custom",
    period: "",
    description: "For larger teams that need tailored support and rollout help.",
    features: [
      "Everything in Pro",
      "Team workflows",
      "Custom onboarding",
      "Dedicated support",
    ],
    ctaLabel: "Contact sales",
    ctaHref: "/contact",
    featured: false,
  },
];

function CheckIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 20 20"
      fill="currentColor"
      className="h-5 w-5 flex-none"
    >
      <path
        fillRule="evenodd"
        d="M16.704 5.29a1 1 0 0 1 .006 1.414l-7.25 7.312a1 1 0 0 1-1.42 0l-3.75-3.781a1 1 0 1 1 1.42-1.408l3.04 3.066 6.54-6.597a1 1 0 0 1 1.414-.006Z"
        clipRule="evenodd"
      />
    </svg>
  );
}

export default function PricingClient() {
  return (
    <main className="mx-auto max-w-7xl px-6 py-16 sm:py-20 lg:px-8">
      <section className="mx-auto max-w-3xl text-center">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-zinc-500">
          Pricing
        </p>

        <h1 className="mt-4 text-4xl font-bold tracking-tight text-zinc-900 sm:text-5xl">
          Simple pricing for your Biolink page
        </h1>

        <p className="mt-4 text-lg leading-8 text-zinc-600">
          Start free and upgrade when you need more customization, analytics,
          and support.
        </p>
      </section>

      <section className="mt-14 grid gap-6 lg:grid-cols-3">
        {plans.map((plan) => {
          const featured = plan.featured;

          return (
            <article
              key={plan.name}
              className={[
                "rounded-3xl border p-8 shadow-sm transition",
                featured
                  ? "border-zinc-900 bg-zinc-900 text-white"
                  : "border-zinc-200 bg-white text-zinc-900",
              ].join(" ")}
            >
              {featured ? (
                <div className="mb-4 inline-flex rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white">
                  Most popular
                </div>
              ) : null}

              <h2 className="text-2xl font-semibold">{plan.name}</h2>

              <div className="mt-4 flex items-end gap-1">
                <span className="text-4xl font-bold tracking-tight">
                  {plan.price}
                </span>
                {plan.period ? (
                  <span
                    className={
                      featured ? "pb-1 text-zinc-300" : "pb-1 text-zinc-500"
                    }
                  >
                    {plan.period}
                  </span>
                ) : null}
              </div>

              <p
                className={`mt-4 text-sm leading-6 ${
                  featured ? "text-zinc-200" : "text-zinc-600"
                }`}
              >
                {plan.description}
              </p>

              <ul className="mt-8 space-y-3">
                {plan.features.map((feature) => (
                  <li
                    key={feature}
                    className={`flex items-start gap-3 text-sm ${
                      featured ? "text-zinc-100" : "text-zinc-700"
                    }`}
                  >
                    <span
                      className={featured ? "text-zinc-100" : "text-zinc-900"}
                    >
                      <CheckIcon />
                    </span>
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              <Link
                href={plan.ctaHref}
                className={[
                  "mt-8 inline-flex w-full items-center justify-center rounded-full px-5 py-3 text-sm font-semibold transition",
                  featured
                    ? "bg-white text-zinc-900 hover:bg-zinc-100"
                    : "bg-zinc-900 text-white hover:bg-zinc-800",
                ].join(" ")}
              >
                {plan.ctaLabel}
              </Link>
            </article>
          );
        })}
      </section>

      <section className="mx-auto mt-16 max-w-3xl rounded-3xl border border-zinc-200 bg-zinc-50 px-6 py-8 text-center">
        <h2 className="text-2xl font-semibold text-zinc-900">
          Need something custom?
        </h2>
        <p className="mt-3 text-zinc-600">
          We can help with team setup, custom onboarding, and larger rollouts.
        </p>
        <div className="mt-6">
          <Link
            href="/contact"
            className="inline-flex items-center justify-center rounded-full bg-zinc-900 px-5 py-3 text-sm font-semibold text-white hover:bg-zinc-800"
          >
            Talk to sales
          </Link>
        </div>
      </section>
    </main>
  );
}
