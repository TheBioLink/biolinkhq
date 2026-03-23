import { User } from "../models/User.js";
import { handleReferralPurchase } from "./handleReferral.js";

export async function startSubscriptionWithCredits(userId) {
  const user = await User.findById(userId);

  if (!user) throw new Error("User not found");

  if (!user.hasPaymentMethod) {
    throw new Error("Payment method required");
  }

  if (user.credits < 450) {
    throw new Error("Not enough credits");
  }

  // deduct credits
  user.credits -= 450;

  // activate subscription
  user.subscription.has_paid = true;
  user.subscription.status = "active";
  user.subscription.startedWithCredits = true;
  user.subscription.current_period_end = new Date(Date.now() + 30 * 86400000);

  // track usage
  user.creditSubscriptions.push({
    startedAt: new Date(),
    plan: "monthly",
    creditsUsed: 450,
  });

  await user.save();

  // 🔗 referral tracking
  await handleReferralPurchase(user, "credit_subscription");

  return { success: true };
}
