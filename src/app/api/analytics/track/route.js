// src/app/api/analytics/track/route.js
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import mongoose from "mongoose";
import { Page } from "@/models/Page";
import {
  getAnonId,
  normalizeEmail,
  trackProfileEvent,
} from "@/libs/analytics";

export const runtime = "nodejs";

export async function POST(req) {
  try {
    const body = await req.json().catch(() => ({}));
    const uri = String(body?.uri || "").trim().toLowerCase();
    const type = String(body?.type || "").trim();
    const target = String(body?.target || "").trim();

    if (!uri || !type) {
      return NextResponse.json({ error: "Missing uri or type" }, { status: 400 });
    }

    if (mongoose.connection.readyState !== 1) {
      await mongoose.connect(process.env.MONGO_URI);
    }

    const page = await Page.findOne({ uri }).lean();

    if (!page?.owner) {
      return NextResponse.json({ ok: false }, { status: 404 });
    }

    const cookieStore = cookies();
    let anonId = cookieStore.get("blq_aid")?.value || "";

    if (!anonId) {
      anonId = getAnonId();
    }

    await trackProfileEvent({
      owner: normalizeEmail(page.owner),
      uri,
      type,
      anonId,
      target,
      headers: req.headers,
    });

    const res = NextResponse.json({ ok: true });
    if (!cookieStore.get("blq_aid")?.value) {
      res.cookies.set("blq_aid", anonId, {
        httpOnly: false,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/",
        maxAge: 60 * 60 * 24 * 365,
      });
    }

    return res;
  } catch (error) {
    console.error("Analytics track error:", error);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
