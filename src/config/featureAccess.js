// src/config/featureAccess.js

export const SUBSCRIPTION_PLANS = {
  free: "free",
  basic: "basic",
  premium: "premium",
  exclusive: "exclusive",
};

export const FEATURES = {
  BASIC_LINKS: "basic_links",
  BASIC_ANALYTICS: "basic_analytics",
  CUSTOM_BACKGROUND: "custom_background",
  TIP_JAR: "tip_jar",

  ADVANCED_ANALYTICS: "advanced_analytics",
  LEAD_CAPTURE: "lead_capture",
  LAYOUT_PRESETS: "layout_presets",

  DIGITAL_PRODUCTS: "digital_products",
  PREMIUM_LINKS: "premium_links",
  AI_BIO_REWRITE: "ai_bio_rewrite",
  AI_LINK_SUGGESTIONS: "ai_link_suggestions",
};

export const FEATURE_RULES = {
  [FEATURES.BASIC_LINKS]: {
    free: true,
  },

  [FEATURES.BASIC_ANALYTICS]: {
    free: true,
  },

  [FEATURES.CUSTOM_BACKGROUND]: {
    free: true,
  },

  [FEATURES.TIP_JAR]: {
    free: true,
  },

  [FEATURES.ADVANCED_ANALYTICS]: {
    subscription: [
      SUBSCRIPTION_PLANS.basic,
      SUBSCRIPTION_PLANS.premium,
      SUBSCRIPTION_PLANS.exclusive,
    ],
  },

  [FEATURES.LEAD_CAPTURE]: {
    subscription: [
      SUBSCRIPTION_PLANS.basic,
      SUBSCRIPTION_PLANS.premium,
      SUBSCRIPTION_PLANS.exclusive,
    ],
  },

  [FEATURES.LAYOUT_PRESETS]: {
    subscription: [
      SUBSCRIPTION_PLANS.basic,
      SUBSCRIPTION_PLANS.premium,
      SUBSCRIPTION_PLANS.exclusive,
    ],
  },

  [FEATURES.DIGITAL_PRODUCTS]: {
    subscription: [
      SUBSCRIPTION_PLANS.premium,
      SUBSCRIPTION_PLANS.exclusive,
    ],
    oneTime: true,
  },

  [FEATURES.PREMIUM_LINKS]: {
    subscription: [
      SUBSCRIPTION_PLANS.premium,
      SUBSCRIPTION_PLANS.exclusive,
    ],
    oneTime: true,
  },

  [FEATURES.AI_BIO_REWRITE]: {
    subscription: [
      SUBSCRIPTION_PLANS.premium,
      SUBSCRIPTION_PLANS.exclusive,
    ],
    oneTime: true,
  },

  [FEATURES.AI_LINK_SUGGESTIONS]: {
    subscription: [
      SUBSCRIPTION_PLANS.premium,
      SUBSCRIPTION_PLANS.exclusive,
    ],
    oneTime: true,
  },
};
