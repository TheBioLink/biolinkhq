// src/libs/subscriptionStatus.js

export function computeSubscriptionStatus(user) {
  const now = new Date();

  if (!user || !user.subscription) {
    return "expired";
  }

  const sub = user.subscription;

  // Cancelled always wins
  if (sub.cancelled_at) {
    return "canceled";
  }

  // Trial still active
  if (sub.trial_end && now < new Date(sub.trial_end)) {
    return "trialing";
  }

  // 🔥 MAIN FIX: trial ended + no payment
  if (
    (!sub.has_paid || sub.has_paid === false) &&
    (!sub.trial_end || now > new Date(sub.trial_end))
  ) {
    return "expired";
  }

  // Active subscription (paid)
  if (
    sub.current_period_end &&
    now < new Date(sub.current_period_end)
  ) {
    return "active";
  }

  // Payment failed / expired billing cycle
  if (sub.has_paid && sub.current_period_end && now > new Date(sub.current_period_end)) {
    return "past_due";
  }

  return "expired";
}
