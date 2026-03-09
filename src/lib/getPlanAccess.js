// src/lib/getPlanAccess.js
export function hasPaidAccess(page) {
  const status = String(page?.stripeSubscriptionStatus || "").toLowerCase();
  const plan = String(page?.stripeCurrentPlan || "free").toLowerCase();

  return (
    ["active", "trialing", "past_due"].includes(status) &&
    ["basic", "premium", "exclusive"].includes(plan)
  );
}

export function hasPlan(page, requiredPlan) {
  const status = String(page?.stripeSubscriptionStatus || "").toLowerCase();
  const plan = String(page?.stripeCurrentPlan || "free").toLowerCase();

  if (!["active", "trialing", "past_due"].includes(status)) return false;

  const order = {
    free: 0,
    basic: 1,
    premium: 2,
    exclusive: 3,
  };

  return (order[plan] || 0) >= (order[requiredPlan] || 0);
}
