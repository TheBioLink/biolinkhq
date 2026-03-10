// src/libs/analytics.js
import mongoose from "mongoose";
import crypto from "crypto";
import { ProfileEvent } from "@/models/ProfileEvent";

export async function connectDb() {
  if (mongoose.connection.readyState === 1) return;
  await mongoose.connect(process.env.MONGO_URI);
}

export function normalizeEmail(email) {
  return String(email || "").toLowerCase().trim();
}

export function getAnonId() {
  return crypto.randomUUID();
}

export function getCountryFromHeaders(headers) {
  return (
    headers.get("cf-ipcountry") ||
    headers.get("x-vercel-ip-country") ||
    headers.get("x-country-code") ||
    ""
  );
}

export function getReferrerHost(headers) {
  try {
    const ref =
      headers.get("referer") ||
      headers.get("referrer") ||
      headers.get("x-referer") ||
      "";
    return ref ? new URL(ref).hostname : "";
  } catch {
    return "";
  }
}

export function parseUserAgent(ua) {
  const source = String(ua || "").toLowerCase();

  let deviceType = "desktop";
  if (/ipad|tablet/.test(source)) deviceType = "tablet";
  if (/iphone|android|mobile/.test(source)) deviceType = "mobile";

  let browser = "other";
  if (/edg\//.test(source)) browser = "edge";
  else if (/chrome\//.test(source) && !/edg\//.test(source))
    browser = "chrome";
  else if (/safari\//.test(source) && !/chrome\//.test(source))
    browser = "safari";
  else if (/firefox\//.test(source)) browser = "firefox";
  else if (/opera|opr\//.test(source)) browser = "opera";

  let os = "other";
  if (/windows/.test(source)) os = "windows";
  else if (/mac os|macintosh/.test(source)) os = "macos";
  else if (/android/.test(source)) os = "android";
  else if (/iphone|ipad|ios/.test(source)) os = "ios";
  else if (/linux/.test(source)) os = "linux";

  return { deviceType, browser, os };
}

export async function trackProfileEvent({
  owner,
  uri,
  type,
  anonId,
  target = "",
  headers,
}) {
  await connectDb();

  const ua = headers.get("user-agent") || "";
  const { deviceType, browser, os } = parseUserAgent(ua);

  const event = await ProfileEvent.create({
    owner: normalizeEmail(owner),
    uri: String(uri || "").trim(),
    type,
    anonId: String(anonId || ""),
    target: String(target || ""),
    referrerHost: getReferrerHost(headers),
    country: getCountryFromHeaders(headers),
    deviceType,
    browser,
    os,
  });

  return event;
}
