import Link from "next/link";

export const metadata = {
  title: "BiolinkHQ | Pricing",
  description:
    "Choose a plan for BiolinkHQ and unlock more features for your link-in-bio page.",
};

const plans = [
  {
    name: "Free",
    price: "£0",
    description: "A solid starter plan for a simple link-in-bio page.",
    features: [
      "Custom profile and public page",
      "Basic links and buttons",
      "Simple analytics",
    ],
    cta: { href: "/login", label: "Get started" },
  },
  {
    name: "Pro",
    price: "£9/mo",
    description: "For creators and brands that want more control and visibility.",
    features: [
      "Everything in Free",
      "More customization options",
      "Improved analytics and growth tools",
      "Priority feature access",
    ],
    cta: { href: "/login", label: "Upgrade to Pro" },
    highlighted: true,
  },
  {
    name: "Business",
    price: "Custom",
    description: "For teams that need advanced workflows and support.",
    features: [
      "Everything in Pro",
      "Team-oriented setup",
      "Advanced support",
      "Custom rollout options",
    ],
    cta: { href: "/contact", label: "Contact sales" },
  },
];

export default function PricingPage() {
  return (
    <main className="mx-auto max-w-6xl px-6 py-16">
      <section className="mx-auto max-w-3xl text-center">
        <p className="mb-3 text-sm font-semibold uppercase tracking-[0.25em] text-zinc-500">
          Pricing
        </p>
        <h1 className="text-4xl font-bold tracking-tight text-zinc-900 sm:text-5xl">
          Simple pricing for your Biolink page
        </h1>
        <p className="mt-4 text-lg text-zinc-600">
          Start free, upgrade when you need more customization, analytics, and
          support.
        </p>
      </section>

      <section className="mt-12 grid gap-6 md:grid-cols-3">
        {plans.map((plan) => (
          <article
            key={plan.name}
            className={`rounded-2xl border p-8 shadow-sm ${
              plan.highlighted
                ? "border-zinc-900 bg-zinc-900 text-white"
                : "border-zinc-200 bg-white text-zinc-900"
            }`}
          >
            <h2 className="text-2xl font-semibold">{plan.name}</h2>
            <p
              className={`mt-2 text-3xl font-bold ${
                plan.highlighted ? "text-white" : "text-zinc-900"
              }`}
            >
              {plan.price}
            </p>
            <p
              className={`mt-3 ${
                plan.highlighted ? "text-zinc-200" : "text-zinc-600"
              }`}
            >
              {plan.description}
            </p>
            <ul
              className={`mt-6 space-y-3 text-sm ${
                plan.highlighted ? "text-zinc-100" : "text-zinc-700"
              }`}
            >
              {plan.features.map((feature) => (
                <li key={feature}>• {feature}</li>
              ))}
            </ul>
            <Link
              href={plan.cta.href}
              className={`mt-8 inline-flex rounded-full px-5 py-3 text-sm font-semibold transition ${
                plan.highlighted
                  ? "bg-white text-zinc-900 hover:bg-zinc-100"
                  : "bg-zinc-900 text-white hover:bg-zinc-800"
              }`}
            >
              {plan.cta.label}
            </Link>
          </article>
        ))}
      </section>
    </main>
  );
}
