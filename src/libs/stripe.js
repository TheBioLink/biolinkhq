// src/libs/stripe.js
import Stripe from "stripe";

const secretKey = process.env.STRIPE_SECRET_KEY;

if (!secretKey) {
  throw new Error("Missing STRIPE_SECRET_KEY");
}

const stripe = new Stripe(secretKey, {
  apiVersion: "2025-01-27.acacia",
});

export default stripe;
