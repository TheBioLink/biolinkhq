export function computeSubscriptionStatus(user) {
  const now = new Date();

  if (!user || !user.subscription) return "expired";

  const sub = user.subscription;

  if (sub.cancelled_at) return "canceled";

  if (sub.trial_end && now < new Date(sub.trial_end)) {
    return "trialing";
  }

  if (!sub.has_paid && (!sub.trial_end || now > new Date(sub.trial_end))) {
    return "expired";
  }

  if (sub.has_paid && sub.current_period_end && now < new Date(sub.current_period_end)) {
    return "active";
  }

  if (sub.has_paid && sub.current_period_end && now > new Date(sub.current_period_end)) {
    return "past_due";
  }

  return "expired";
}
