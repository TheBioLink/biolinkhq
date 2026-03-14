import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import mongoose from "mongoose";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { Page } from "@/models/Page";
import { User } from "@/models/User";
import { ensureUserPsid } from "@/lib/psid";
import { getLinkedProfileModel } from "@/models/LinkedProfile";
import { computeProfileScore, slugifyEsportsProfile } from "@/lib/esports-profile";

function normalizeString(value) {
  return (value || "").toString().trim();
}

function normalizeList(value) {
  if (!Array.isArray(value)) return [];
  return value.map((item) => normalizeString(item)).filter(Boolean).slice(0, 50);
}

function normalizeTournamentHistory(value) {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => ({
      event: normalizeString(item?.event),
      placement: normalizeString(item?.placement),
      year: normalizeString(item?.year),
    }))
    .filter((item) => item.event || item.placement || item.year)
    .slice(0, 30);
}

export async function GET() {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email?.toLowerCase().trim();

  if (!email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await mongoose.connect(process.env.MONGO_URI);
  const psid = await ensureUserPsid(email);

  const LinkedProfile = await getLinkedProfileModel();
  const profile = await LinkedProfile.findOne({ psid }).lean();

  return NextResponse.json({ ok: true, profile: profile || null, psid });
}

export async function POST(req) {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email?.toLowerCase().trim();

  if (!email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();

  await mongoose.connect(process.env.MONGO_URI);

  const psid = await ensureUserPsid(email);
  const user = await User.findOne({ email }).lean();
  const page = await Page.findOne({ owner: email }).lean();
  const LinkedProfile = await getLinkedProfileModel();

  const slugBase =
    normalizeString(body.slug) ||
    normalizeString(body.gamerTag) ||
    normalizeString(page?.uri) ||
    `player-${psid}`;

  const update = {
    psid,
    owner: email,
    mainUri: page?.uri || "",
    slug: slugifyEsportsProfile(slugBase),

    enabled: !!body.enabled,
    featured: !!body.featured,

    gamerTag: normalizeString(body.gamerTag),
    headline: normalizeString(body.headline),
    primaryGame: normalizeString(body.primaryGame),
    secondaryGames: normalizeList(body.secondaryGames),
    roles: normalizeList(body.roles),
    region: normalizeString(body.region),
    country: normalizeString(body.country),
    rank: normalizeString(body.rank),
    peakRank: normalizeString(body.peakRank),
    teamStatus: normalizeString(body.teamStatus),

    orgTypeWanted: normalizeList(body.orgTypeWanted),
    languages: normalizeList(body.languages),
    yearsCompeting: normalizeString(body.yearsCompeting),
    availability: normalizeString(body.availability),
    timezoneLabel: normalizeString(body.timezoneLabel),

    achievements: normalizeList(body.achievements),
    tournamentHistory: normalizeTournamentHistory(body.tournamentHistory),
    vodLinks: normalizeList(body.vodLinks),

    socials: {
      x: normalizeString(body?.socials?.x),
      twitch: normalizeString(body?.socials?.twitch),
      youtube: normalizeString(body?.socials?.youtube),
      discord: normalizeString(body?.socials?.discord),
    },

    orgFitTags: normalizeList(body.orgFitTags),
    strengths: normalizeList(body.strengths),
    lookingFor: normalizeList(body.lookingFor),

    anonymousBio: normalizeString(body.anonymousBio),

    privacy: {
      showRealName: !!body?.privacy?.showRealName,
      showLocation: !!body?.privacy?.showLocation,
      hidePersonalLinks: body?.privacy?.hidePersonalLinks !== false,
      showMainProfileLink: !!body?.privacy?.showMainProfileLink,
      allowSearchIndexing: body?.privacy?.allowSearchIndexing !== false,
      contactMode:
        ["public", "request-only", "private"].includes(body?.privacy?.contactMode)
          ? body.privacy.contactMode
          : "request-only",
    },
  };

  update.trust = {
    verifiedVods: !!body?.trust?.verifiedVods,
    verifiedAchievements: !!body?.trust?.verifiedAchievements,
    profileScore: computeProfileScore(update),
  };

  const profile = await LinkedProfile.findOneAndUpdate(
    { psid },
    update,
    { upsert: true, new: true, setDefaultsOnInsert: true }
  ).lean();

  return NextResponse.json({
    ok: true,
    psid,
    profile,
    user: {
      name: user?.name || "",
      email,
    },
  });
}
