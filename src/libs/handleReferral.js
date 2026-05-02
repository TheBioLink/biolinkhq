// src/libs/handleReferral.js

/**
 * Called after a successful subscription payment.
 * Records referral earnings on the user who referred this user, if any.
 */
export async function handleReferralPurchase(user, plan) {
  try {
    if (!user?.referredBy) return;

    // Lazy-import to avoid circular deps
    const { User } = await import("@/models/User");

    await User.findOneAndUpdate(
      { referralCode: user.referredBy },
      {
        $push: {
          referralEarnings: {
            referredUser: user.email,
            plan,
            timestamp: new Date(),
          },
        },
      }
    );
  } catch (err) {
    console.error("handleReferralPurchase error:", err);
  }
}
