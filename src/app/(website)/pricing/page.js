// src/app/(website)/pricing/page.js
import PricingClient from "@/components/pricing/PricingClient";

export const metadata = {
  title: "BiolinkHQ | Pricing",
  description:
    "Choose a plan for BiolinkHQ and unlock more features for your link-in-bio page.",
};

export default function PricingPage() {
  return <PricingClient />;
}
