// src/libs/featureAccess.js

import { FEATURE_RULES, SUBSCRIPTION_PLANS } from "@/config/featureAccess";

function normalizePlan(plan) {
  const value = String(plan || "").trim().toLowerCase();

  if (!value) {
    return SUBSCRIPTION_PLANS.free;
  }

  if (Object.values(SUBSCRIPTION_PLANS).includes(value)) {
    return value;
  }

  return SUBSCRIPTION_PLANS.free;
}

function normalizeUnlocks(unlocks) {
  if (!Array.isArray(unlocks)) {
    return [];
  }

  return unlocks
    .map((item) => String(item || "").trim())
    .filter(Boolean);
}

export function hasFeatureAccess({ page, featureKey }) {
  const rules = FEATURE_RULES[featureKey];

  if (!rules) {
    return false;
  }

  const currentPlan = normalizePlan(page?.stripeCurrentPlan);
  const oneTimeUnlocks = normalizeUnlocks(page?.oneTimeUnlocks);

  if (rules.free === true) {
    return true;
  }

  if (
    Array.isArray(rules.subscription) &&
    rules.subscription.includes(currentPlan)
  ) {
    return true;
  }

  if (rules.oneTime === true && oneTimeUnlocks.includes(featureKey)) {
    return true;
  }

  return false;
}

export function getFeatureAccessMap({ page, featureKeys = [] }) {
  return featureKeys.reduce((acc, featureKey) => {
    acc[featureKey] = hasFeatureAccess({ page, featureKey });
    return acc;
  }, {});
}

export function getLockedFeatures({ page, featureKeys = [] }) {
  return featureKeys.filter(
    (featureKey) => !hasFeatureAccess({ page, featureKey })
  );
}

export function canUseFreeFeature(featureKey) {
  const rules = FEATURE_RULES[featureKey];
  return !!rules?.free;
}

export function canUnlockOneTime(featureKey) {
  const rules = FEATURE_RULES[featureKey];
  return !!rules?.oneTime;
}

export function allowedSubscriptionPlans(featureKey) {
  const rules = FEATURE_RULES[featureKey];
  return Array.isArray(rules?.subscription) ? rules.subscription : [];
}
