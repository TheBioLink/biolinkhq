import { NextResponse } from "next/server";
import mongoose from "mongoose";
import clientPromise from "@/libs/mongoClient";
import { Ban } from "@/models/Ban";
import { Page } from "@/models/Page";

const norm = (s) => (s || "").toString().trim().toLowerCase();

export async function GET() {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    const client = await clientPromise;
    const db = client.db();

    // All registered users (NextAuth Mongo adapter uses "users")
    const totalUsers = await db.collection("users").countDocuments();

    // Get banned emails
    const bannedEmailsDocs = await Ban.find({ type: "email" })
      .select("identifier")
      .lean();

    const bannedEmails = bannedEmailsDocs.map((b) => norm(b.identifier));

    // Count active users (not banned)
    const activeUsers = await db.collection("users").countDocuments({
      email: { $nin: bannedEmails },
    });

    // OPTIONAL PROFESSIONAL FILTER:
    // Count only users that actually created a page
    const pages = await Page.find({})
      .select("owner")
      .lean();

    const pageOwners = new Set(pages.map((p) => norm(p.owner)));

    const activeAccounts = await db.collection("users").countDocuments({
      email: { $in: Array.from(pageOwners), $nin: bannedEmails },
    });

    return NextResponse.json({
      activeAccounts,
      totalUsers,
      activeUsers,
      bannedAccounts: bannedEmails.length,
    });
  } catch (err) {
    console.error("Stats API error:", err);
    return NextResponse.json(
      { error: "Failed to fetch stats" },
      { status: 500 }
    );
  }
}
