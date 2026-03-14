import { NextResponse } from "next/server";
import { getLinkedProfileModel } from "@/models/LinkedProfile";

export async function GET(req) {
  const { searchParams } = new URL(req.url);

  const q = (searchParams.get("q") || "").trim();
  const game = (searchParams.get("game") || "").trim();
  const role = (searchParams.get("role") || "").trim();
  const region = (searchParams.get("region") || "").trim();
  const status = (searchParams.get("status") || "").trim();

  const LinkedProfile = await getLinkedProfileModel();

  const filter = {
    enabled: true,
    "privacy.allowSearchIndexing": true,
  };

  if (game) filter.primaryGame = game;
  if (role) filter.roles = role;
  if (region) filter.region = region;
  if (status) filter.teamStatus = status;

  if (q) {
    filter.$or = [
      { gamerTag: { $regex: q, $options: "i" } },
      { headline: { $regex: q, $options: "i" } },
      { primaryGame: { $regex: q, $options: "i" } },
      { roles: { $regex: q, $options: "i" } },
      { orgFitTags: { $regex: q, $options: "i" } },
    ];
  }

  const results = await LinkedProfile.find(filter)
    .sort({
      featured: -1,
      "trust.profileScore": -1,
      updatedAt: -1,
    })
    .limit(50)
    .lean();

  return NextResponse.json({ ok: true, results });
}
