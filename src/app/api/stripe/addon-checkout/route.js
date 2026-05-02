// src/app/api/stripe/addon-checkout/route.js
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import stripe from "@/libs/stripe";
import { connectDb, normalizeEmail, findPageByOwner } from "@/libs/stripe-subscriptions";
import { PromoCode } from "@/models/PromoCode";

const ADDONS = {
  custom_background: {
    name: "Custom Background",
    description: "Set a custom colour or image as your profile background.",
    price: 99,
    currency: "gbp",
  },
  advanced_analytics: {
    name: "Advanced Analytics",
    description: "Unlock device, country, browser and referrer breakdowns.",
    price: 149,
    currency: "gbp",
  },
  remove_branding: {
    name: "Remove BiolinkHQ Branding",
    description: "Remove the BiolinkHQ badge from your public profile.",
    price: 199,
    currency: "gbp",
  },
  premium_themes: {
    name: "Premium Themes",
    description: "Access to premium colour themes and gradient presets.",
    price: 249,
    currency: "gbp",
  },
};

const norm = (s) => (s || "").toString().toLowerCase().trim();

function getBaseUrl(req) {
  return (
    process.env.NEXTAUTH_URL ||
    req.headers.get("origin") ||
    "http://localhost:3000"
  );
}

async function applyPromoDiscount(promoCode, addonKey, basePrice, userEmail) {
  if (!promoCode) return { price: basePrice, promoId: null, discountPct: 0 };

  try {
    const promo = await PromoCode.findOne({
      code: promoCode.toUpperCase().trim(),
      active: true,
    });

    if (!promo) return { price: basePrice, promoId: null, discountPct: 0 };

    const now = new Date();
    if (promo.expiresAt && now > new Date(promo.expiresAt)) {
      return { price: basePrice, promoId: null, discountPct: 0 };
    }

    if (promo.maxUses > 0 && promo.usedCount >= promo.maxUses) {
      return { price: basePrice, promoId: null, discountPct: 0 };
    }

    // Per-user limit check (was missing before)
    const userUsages = promo.usages.filter(
      (u) => norm(u.userEmail) === norm(userEmail)
    );
    if (promo.maxUsesPerUser > 0 && userUsages.length >= promo.maxUsesPerUser) {
      return { price: basePrice, promoId: null, discountPct: 0 };
    }

    const applies =
      promo.appliesTo.includes("all") ||
      promo.appliesTo.includes("badges") ||
      promo.appliesTo.includes(addonKey);

    if (!applies) return { price: basePrice, promoId: null, discountPct: 0 };

    // For one-time payments we reduce unit_amount directly — no coupon needed
    const discounted = Math.round(basePrice * (1 - promo.discountPercent / 100));
    return {
      price: discounted,
      promoId: String(promo._id),
      discountPct: promo.discountPercent,
    };
  } catch {
    return { price: basePrice, promoId: null, discountPct: 0 };
  }
}

export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const addonKey = String(body?.addonKey || "").toLowerCase().trim();
    const promoCode = String(body?.promoCode || "").toUpperCase().trim();

    const addon = ADDONS[addonKey];
    if (!addon) {
      return NextResponse.json({ error: "Invalid addon" }, { status: 400 });
    }

    const email = normalizeEmail(session.user.email);
    await connectDb();

    const page = await findPageByOwner(email);
    if (!page) {
      return NextResponse.json({ error: "No page found" }, { status: 404 });
    }

    if (Array.isArray(page.oneTimeUnlocks) && page.oneTimeUnlocks.includes(addonKey)) {
      return NextResponse.json({ error: "You already own this feature" }, { status: 409 });
    }

    const { price, discountPct } = await applyPromoDiscount(
      promoCode,
      addonKey,
      addon.price,
      email
    );

    const baseUrl = getBaseUrl(req);

    const checkoutSession = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      customer_email: email,
      success_url: `${baseUrl}/account/subscription?addon_success=1&addon=${addonKey}`,
      cancel_url: `${baseUrl}/pricing?cancel=1`,
      metadata: {
        email,
        addonKey,
        promoCode: promoCode || "",
        discountPct: String(discountPct),
        type: "addon",
      },
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: addon.currency,
            // Discounted price is set directly on unit_amount — correct for one-time payments
            unit_amount: price,
            product_data: {
              name: `BiolinkHQ – ${addon.name}`,
              description:
                discountPct > 0
                  ? `${addon.description} (${discountPct}% discount applied)`
                  : addon.description,
            },
          },
        },
      ],
    });

    return NextResponse.json({ url: checkoutSession.url });
  } catch (err) {
    console.error("Addon checkout error:", err);
    return NextResponse.json(
      { error: "Checkout failed", details: err.message },
      { status: 500 }
    );
  }
}
