import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";
import { Page } from "@/models/Page";

const norm = (s) => (s || "").toString().toLowerCase().trim();
const cleanText = (value, max = 500) => String(value || "").trim().slice(0, max);

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

    const update = {
      displayName: cleanText(data.displayName, 80),
      bio: cleanText(data.bio, 500),
      location: cleanText(data.location, 120),
      profileImage: cleanText(data.profileImage, 1000),
      bannerImage: cleanText(data.bannerImage, 1000),
    };

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
    console.error("Profile save error:", error);
    return NextResponse.json(
      { error: "Failed to save profile", details: error?.message || "Unknown error" },
      { status: 500 }
    );
  }
}
