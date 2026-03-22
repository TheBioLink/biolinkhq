// src/libs/subscriptionStatus.js

export function computeSubscriptionStatus(user) {
  const now = new Date();

  // No user or no subscription → expired
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

  // 🔥 CRITICAL FIX:
  // Trial ended AND no payment → expired
  if (
    (!sub.has_paid || sub.has_paid === false) &&
    (!sub.trial_end || now > new Date(sub.trial_end))
  ) {
    return "expired";
  }

  // Paid + still within billing period → active
  if (
    sub.has_paid &&
    sub.current_period_end &&
    now < new Date(sub.current_period_end)
  ) {
    return "active";
  }

  // Paid but period expired → past_due
  if (
    sub.has_paid &&
    sub.current_period_end &&
    now > new Date(sub.current_period_end)
  ) {
    return "past_due";
  }

  // Fallback
  return "expired";
}
