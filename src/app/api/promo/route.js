// src/app/api/promo/route.js
import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { Page } from "@/models/Page";
import { PromoCode } from "@/models/PromoCode";

const norm = (s) => (s || "").toString().toLowerCase().trim();

async function connectDb() {
  if (mongoose.connection.readyState !== 1) {
    await mongoose.connect(process.env.MONGO_URI);
  }
}

async function isAdmin(session) {
  if (!session?.user?.email) return false;
  await connectDb();
  const page = await Page.findOne({ owner: norm(session.user.email) }).lean();
  return norm(page?.uri) === "itsnicbtw";
}

// GET /api/promo - list all promo codes (admin) or validate a code (public)
export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");
  const appliesTo = searchParams.get("appliesTo") || "all";

  await connectDb();

  // Public: validate a specific code
  if (code) {
    const promo = await PromoCode.findOne({ code: code.toUpperCase().trim() }).lean();

    if (!promo || !promo.active) {
      return NextResponse.json({ valid: false, error: "Invalid or expired promo code" });
    }

    const now = new Date();
    if (promo.expiresAt && now > new Date(promo.expiresAt)) {
      return NextResponse.json({ valid: false, error: "Promo code has expired" });
    }

    if (promo.maxUses > 0 && promo.usedCount >= promo.maxUses) {
      return NextResponse.json({ valid: false, error: "Promo code usage limit reached" });
    }

    // Check if applies to the requested product
    const applies =
      promo.appliesTo.includes("all") ||
      promo.appliesTo.includes(appliesTo) ||
      (appliesTo.startsWith("subscription") && promo.appliesTo.includes("all_subscriptions")) ||
      (["basic", "premium", "exclusive"].includes(appliesTo) && promo.appliesTo.includes("all_subscriptions"));

    if (!applies) {
      return NextResponse.json({ valid: false, error: "Promo code does not apply to this product" });
    }

    return NextResponse.json({
      valid: true,
      discountPercent: promo.discountPercent,
      code: promo.code,
      description: promo.description,
    });
  }

  // Admin: list all codes
  const session = await getServerSession(authOptions);
  if (!(await isAdmin(session))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const promos = await PromoCode.find({}).sort({ createdAt: -1 }).lean();
  return NextResponse.json({ ok: true, promos });
}

// POST /api/promo - create a promo code (admin only)
export async function POST(req) {
  const session = await getServerSession(authOptions);
  if (!(await isAdmin(session))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await connectDb();

  const body = await req.json().catch(() => ({}));

  const code = String(body.code || "").toUpperCase().trim().replace(/[^A-Z0-9_-]/g, "");
  if (!code || code.length < 3) {
    return NextResponse.json({ error: "Code must be at least 3 characters (letters/numbers)" }, { status: 400 });
  }

  const discountPercent = Number(body.discountPercent);
  if (isNaN(discountPercent) || discountPercent < 1 || discountPercent > 99) {
    return NextResponse.json({ error: "Discount must be between 1% and 99%" }, { status: 400 });
  }

  const appliesTo = Array.isArray(body.appliesTo) ? body.appliesTo : ["all"];
  const maxUses = Math.max(0, Number(body.maxUses || 0));
  const maxUsesPerUser = Math.max(1, Number(body.maxUsesPerUser || 1));
  const expiresAt = body.expiresAt ? new Date(body.expiresAt) : null;
  const description = String(body.description || "").trim().slice(0, 200);

  const existing = await PromoCode.findOne({ code }).lean();
  if (existing) {
    return NextResponse.json({ error: "A promo code with that name already exists" }, { status: 409 });
  }

  const promo = await PromoCode.create({
    code,
    description,
    appliesTo,
    discountPercent,
    maxUses,
    maxUsesPerUser,
    expiresAt,
    active: true,
    createdBy: session.user.email,
  });

  return NextResponse.json({ ok: true, promo });
}

// PATCH /api/promo - update/toggle/delete (admin only)
export async function PATCH(req) {
  const session = await getServerSession(authOptions);
  if (!(await isAdmin(session))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await connectDb();

  const body = await req.json().catch(() => ({}));
  const { id, action } = body;

  const promo = await PromoCode.findById(id);
  if (!promo) return NextResponse.json({ error: "Promo code not found" }, { status: 404 });

  if (action === "toggle") {
    promo.active = !promo.active;
    await promo.save();
    return NextResponse.json({ ok: true, active: promo.active });
  }

  if (action === "delete") {
    await PromoCode.deleteOne({ _id: id });
    return NextResponse.json({ ok: true });
  }

  if (action === "update") {
    if (body.description !== undefined) promo.description = String(body.description).trim().slice(0, 200);
    if (body.discountPercent !== undefined) promo.discountPercent = Math.min(99, Math.max(1, Number(body.discountPercent)));
    if (body.maxUses !== undefined) promo.maxUses = Math.max(0, Number(body.maxUses));
    if (body.maxUsesPerUser !== undefined) promo.maxUsesPerUser = Math.max(1, Number(body.maxUsesPerUser));
    if (body.expiresAt !== undefined) promo.expiresAt = body.expiresAt ? new Date(body.expiresAt) : null;
    if (Array.isArray(body.appliesTo)) promo.appliesTo = body.appliesTo;
    await promo.save();
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}

// DELETE /api/promo - record usage of a promo code (called after successful checkout)
export async function DELETE(req) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await connectDb();

  const body = await req.json().catch(() => ({}));
  const { code, appliedTo, discountAmount } = body;

  const promo = await PromoCode.findOne({ code: String(code || "").toUpperCase().trim() });
  if (!promo) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Check per-user usage
  const userUsages = promo.usages.filter((u) => norm(u.userEmail) === norm(session.user.email));
  if (promo.maxUsesPerUser > 0 && userUsages.length >= promo.maxUsesPerUser) {
    return NextResponse.json({ error: "Per-user limit reached" }, { status: 409 });
  }

  promo.usedCount += 1;
  promo.usages.push({
    userEmail: norm(session.user.email),
    usedAt: new Date(),
    appliedTo: appliedTo || "",
    discountAmount: Number(discountAmount || 0),
  });

  await promo.save();
  return NextResponse.json({ ok: true });
}
