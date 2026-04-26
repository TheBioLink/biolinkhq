import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";
import { Page } from "@/models/Page";

const norm = (s) => (s || "").toString().toLowerCase().trim();
const cleanText = (value, max = 500) => String(value || "").trim().slice(0, max);

function cleanUrl(value) {
  const url = cleanText(value, 1000);
  if (!url) return "";
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  return `https://${url}`;
}

function cleanButtons(buttons) {
  if (!Array.isArray(buttons)) return [];

  return buttons
    .slice(0, 20)
    .map((button) => ({
      label: cleanText(button?.label, 40),
      url: cleanUrl(button?.url),
    }))
    .filter((button) => button.label || button.url);
}

function cleanLinks(links) {
  if (!Array.isArray(links)) return [];

  return links
    .slice(0, 50)
    .map((link) => ({
      title: cleanText(link?.title, 80),
      url: cleanUrl(link?.url),
    }))
    .filter((link) => link.title || link.url);
}

async function connectDb() {
  if (mongoose.connection.readyState !== 1) {
    await mongoose.connect(process.env.MONGO_URI);
  }
}

export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDb();

    const email = norm(session.user.email);
    const data = await req.json();

    const existingPage = await Page.findOne({ owner: email }).lean();

    if (!existingPage?.uri) {
      return NextResponse.json(
        { error: "Create a username before saving your profile." },
        { status: 400 }
      );
    }

    const update = {};

    if (Object.prototype.hasOwnProperty.call(data, "displayName")) {
      update.displayName = cleanText(data.displayName, 80);
    }

    if (Object.prototype.hasOwnProperty.call(data, "bio")) {
      update.bio = cleanText(data.bio, 500);
    }

    if (Object.prototype.hasOwnProperty.call(data, "location")) {
      update.location = cleanText(data.location, 120);
    }

    if (Object.prototype.hasOwnProperty.call(data, "profileImage")) {
      update.profileImage = cleanText(data.profileImage, 1000);
    }

    if (Object.prototype.hasOwnProperty.call(data, "bannerImage")) {
      update.bannerImage = cleanText(data.bannerImage, 1000);
    }

    if (Object.prototype.hasOwnProperty.call(data, "buttons")) {
      update.buttons = cleanButtons(data.buttons);
    }

    if (Object.prototype.hasOwnProperty.call(data, "links")) {
      update.links = cleanLinks(data.links);
    }

    if (Object.prototype.hasOwnProperty.call(data, "bgType")) {
      update.bgType = data.bgType === "image" ? "image" : "color";
    }

    if (Object.prototype.hasOwnProperty.call(data, "bgImage")) {
      update.bgImage = cleanText(data.bgImage, 1000);
    }

    if (Object.prototype.hasOwnProperty.call(data, "bgColor")) {
      update.bgColor = cleanText(data.bgColor, 32) || "#0b0f14";
    }

    const page = await Page.findOneAndUpdate(
      { owner: email },
      { $set: update },
      { new: true }
    ).lean();

    return NextResponse.json({ ok: true, page });
  } catch (error) {
    console.error("Page save error:", error);
    return NextResponse.json(
      { error: "Failed to save page", details: error?.message || "Unknown error" },
      { status: 500 }
    );
  }
}
