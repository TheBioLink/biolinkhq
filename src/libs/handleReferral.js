// src/libs/handleReferral.js

import { User } from "../models/User.js";

export async function handleReferralPurchase(user, plan) {
  if (!user.referredBy) return;

  const referrer = await User.findOne({
    referralCode: user.referredBy,
  });

  if (!referrer) return;

  referrer.referralEarnings.push({
    referredUser: user.name,
    plan,
    timestamp: new Date(),
  });

  await referrer.save();

  // 🔥 use built-in fetch (NO import needed)
  if (process.env.WEBHOOK_REF) {
    await fetch(process.env.WEBHOOK_REF, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        referred_by: referrer.name,
        referred_user: user.name,
        plan: plan,
        used_credits: user.subscription.startedWithCredits,
      }),
    });
  }
}
