import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import cloudinary from "@/libs/cloudinary";
import { getBadgeModels } from "@/models/Badge";
import { Page } from "@/models/Page";

const norm = (s) => (s || "").toString().toLowerCase().trim();

async function mainDb() {
  if (mongoose.connection.readyState !== 1) {
    await mongoose.connect(process.env.MONGO_URI);
  }
}

async function getContext() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return { error: "Unauthorized", status: 401 };

  await mainDb();

  const email = norm(session.user.email);
  const page = await Page.findOne({ owner: email }).lean();
  const username = norm(page?.uri);
  const adminUsername = norm(process.env.BADGE_ADMIN_USERNAME || "itsnicbtw");

  return { email, page, username, isAdmin: username === adminUsername };
}

async function uploadBadgeIcon(iconBase64) {
  if (!iconBase64) return "";

  const upload = await cloudinary.uploader.upload(iconBase64, {
    folder: process.env.CLOUDINARY_UPLOAD_FOLDER
      ? `${process.env.CLOUDINARY_UPLOAD_FOLDER}/badges`
      : "biolinkhq_badges",
    resource_type: "image",
    transformation: [{ width: 256, height: 256, crop: "fill" }],
  });

  return upload.secure_url;
}

export async function GET() {
  try {
    const ctx = await getContext();
    if (ctx.error) return NextResponse.json({ error: ctx.error }, { status: ctx.status });

    const { BadgeModel, UserBadgeModel } = await getBadgeModels();

    const badges = await BadgeModel.find({ isActive: { $ne: false } }).sort({ createdAt: -1 }).lean();
    const myBadges = await UserBadgeModel.find({ ownerEmail: ctx.email }).lean();

    const badgeIds = badges.map((b) => b._id);
    const claimCounts = await UserBadgeModel.aggregate([
      { $match: { badgeId: { $in: badgeIds } } },
      { $group: { _id: "$badgeId", count: { $sum: 1 } } },
    ]);

    const counts = Object.fromEntries(claimCounts.map((c) => [String(c._id), c.count]));

    return NextResponse.json({
      ok: true,
      badges: badges.map((badge) => ({ ...badge, claimCount: counts[String(badge._id)] || 0 })),
      myBadges,
      isAdmin: ctx.isAdmin,
      username: ctx.username,
    });
  } catch (error) {
    console.error("Badges GET error:", error);
    return NextResponse.json({ error: "Failed to load badges", details: error?.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const ctx = await getContext();
    if (ctx.error) return NextResponse.json({ error: ctx.error }, { status: ctx.status });
    if (!ctx.isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { BadgeModel, UserBadgeModel } = await getBadgeModels();
    const body = await req.json();

    const name = String(body?.name || "").trim();
    const type = body?.type === "private" ? "private" : "public";
    const assignTo = norm(body?.assignTo);
    const claimLimit = Math.max(0, Number(body?.claimLimit || 0));
    const claimEndsAt = body?.claimEndsAt ? new Date(body.claimEndsAt) : null;
    const icon = await uploadBadgeIcon(body?.iconBase64 || "");

    if (!name || name.length < 2) {
      return NextResponse.json({ error: "Badge name must be at least 2 characters" }, { status: 400 });
    }

    const badge = await BadgeModel.create({
      name,
      icon,
      type,
      claimLimit,
      claimEndsAt,
      createdBy: ctx.email,
      isActive: true,
    });

    if (type === "private" && assignTo) {
      const target = await Page.findOne({ uri: assignTo }).lean();
      if (target?.owner) {
        await UserBadgeModel.updateOne(
          { badgeId: badge._id, ownerEmail: norm(target.owner) },
          { $setOnInsert: { visible: true, grantedBy: ctx.email } },
          { upsert: true }
        );
      }
    }

    return NextResponse.json({ ok: true, badge });
  } catch (error) {
    console.error("Badges POST error:", error);
    return NextResponse.json({ error: "Failed to create badge", details: error?.message }, { status: 500 });
  }
}

export async function PATCH(req) {
  try {
    const ctx = await getContext();
    if (ctx.error) return NextResponse.json({ error: ctx.error }, { status: ctx.status });

    const { BadgeModel, UserBadgeModel } = await getBadgeModels();
    const { action, badgeId, username } = await req.json();

    const badge = await BadgeModel.findById(badgeId);
    if (!badge) return NextResponse.json({ error: "Badge not found" }, { status: 404 });

    if (action === "claim") {
      if (badge.type !== "public") return NextResponse.json({ error: "This badge is private" }, { status: 403 });
      if (badge.claimEndsAt && new Date() > badge.claimEndsAt) {
        return NextResponse.json({ error: "Claim period has ended" }, { status: 403 });
      }

      const alreadyOwned = await UserBadgeModel.findOne({ badgeId, ownerEmail: ctx.email }).lean();
      if (alreadyOwned) return NextResponse.json({ ok: true });

      const count = await UserBadgeModel.countDocuments({ badgeId });
      if (badge.claimLimit && count >= badge.claimLimit) {
        return NextResponse.json({ error: "Claim limit reached" }, { status: 403 });
      }

      await UserBadgeModel.create({ badgeId, ownerEmail: ctx.email, visible: true });
      return NextResponse.json({ ok: true });
    }

    if (action === "toggle") {
      const ownedBadge = await UserBadgeModel.findOne({ badgeId, ownerEmail: ctx.email });
      if (ownedBadge) {
        ownedBadge.visible = !ownedBadge.visible;
        await ownedBadge.save();
      }
      return NextResponse.json({ ok: true });
    }

    if (action === "assign") {
      if (!ctx.isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      const target = await Page.findOne({ uri: norm(username) }).lean();
      if (!target?.owner) return NextResponse.json({ error: "User not found" }, { status: 404 });

      await UserBadgeModel.updateOne(
        { badgeId, ownerEmail: norm(target.owner) },
        { $setOnInsert: { visible: true, grantedBy: ctx.email } },
        { upsert: true }
      );
      return NextResponse.json({ ok: true });
    }

    if (action === "remove") {
      if (!ctx.isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      const target = await Page.findOne({ uri: norm(username) }).lean();
      if (!target?.owner) return NextResponse.json({ error: "User not found" }, { status: 404 });

      await UserBadgeModel.deleteOne({ badgeId, ownerEmail: norm(target.owner) });
      return NextResponse.json({ ok: true });
    }

    if (action === "deactivate") {
      if (!ctx.isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      badge.isActive = false;
      await badge.save();
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("Badges PATCH error:", error);
    return NextResponse.json({ error: "Failed to update badge", details: error?.message }, { status: 500 });
  }
}
