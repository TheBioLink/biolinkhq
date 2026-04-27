import mongoose from "mongoose";
import { notFound } from "next/navigation";
import { Page } from "@/models/Page";
import { getBadgeModels } from "@/models/Badge";
import PublicLinks from "@/components/PublicLinks";

export const dynamic = "force-dynamic";

const normalise = (value) => (value || "").toString().toLowerCase().trim();

async function connectToDatabase() {
  if (mongoose.connection.readyState >= 1) return;

  if (!process.env.MONGO_URI) {
    throw new Error("Missing MONGO_URI environment variable");
  }

  await mongoose.connect(process.env.MONGO_URI);
}

function serialisePage(page) {
  return {
    uri: page.uri || "",
    owner: normalise(page.owner),
    displayName: page.displayName || page.uri || "BioLinkHQ Profile",
    location: page.location || "",
    bio: page.bio || "",
    profileImage: page.profileImage || "",
    bannerImage: page.bannerImage || "",
    bgColor: page.bgColor || "#0b0f14",
    buttons: page.buttons || {},
    links: Array.isArray(page.links)
      ? page.links.map((link) => ({
          title: link?.title || "",
          url: link?.url || "",
        }))
      : [],
  };
}

async function getVisibleBadgesForOwner(ownerEmail) {
  if (!ownerEmail) return [];

  const { BadgeModel, UserBadgeModel } = await getBadgeModels();

  const ownedBadges = await UserBadgeModel.find({
    ownerEmail: normalise(ownerEmail),
    visible: { $ne: false },
  }).lean();

  const badgeIds = ownedBadges.map((badge) => badge.badgeId).filter(Boolean);
  if (badgeIds.length === 0) return [];

  const badges = await BadgeModel.find({
    _id: { $in: badgeIds },
    isActive: { $ne: false },
  }).lean();

  const ownershipOrder = new Map(
    ownedBadges.map((badge, index) => [String(badge.badgeId), index])
  );

  return badges
    .sort(
      (a, b) =>
        (ownershipOrder.get(String(a._id)) ?? 9999) -
        (ownershipOrder.get(String(b._id)) ?? 9999)
    )
    .map((badge) => ({
      name: badge?.name || "Badge",
      icon: badge?.icon || "",
    }));
}

export async function generateMetadata({ params }) {
  try {
    await connectToDatabase();
    const page = await Page.findOne({ uri: params.uri }).lean();

    if (!page) return { title: "Profile not found | BioLinkHQ" };

    return {
      title: `${page.displayName || page.uri} | BioLinkHQ`,
      description: page.bio || "View this BioLinkHQ profile.",
    };
  } catch {
    return { title: "BioLinkHQ Profile" };
  }
}

function ProfileBadgeIcon({ badge }) {
  if (badge?.icon) {
    return (
      <img
        src={badge.icon}
        alt={badge.name || "Badge"}
        title={badge.name || "Badge"}
        className="h-7 w-7 object-contain transition hover:scale-110"
      />
    );
  }

  return (
    <span
      title={badge?.name || "Badge"}
      className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-white/10 bg-black/25 text-sm font-black text-white/80"
    >
      {(badge?.name || "?").slice(0, 1).toUpperCase()}
    </span>
  );
}

export default async function PublicProfilePage({ params }) {
  await connectToDatabase();

  const rawPage = await Page.findOne({ uri: params.uri }).lean();
  if (!rawPage) notFound();

  const page = serialisePage(rawPage);
  const badges = await getVisibleBadgesForOwner(page.owner);

  return (
    <main className="min-h-screen text-white" style={{ backgroundColor: page.bgColor }}>
      <section className="mx-auto flex min-h-screen w-full max-w-2xl flex-col px-4 py-8">
        <div className="overflow-hidden rounded-[2rem] border border-white/10 bg-black/45 shadow-2xl backdrop-blur-xl">
          {page.bannerImage && (
            <div className="h-44 w-full overflow-hidden bg-white/5 sm:h-56">
              <img
                src={page.bannerImage}
                alt={`${page.displayName} banner`}
                className="h-full w-full object-cover"
              />
            </div>
          )}

          <div className="px-5 pb-8 pt-8 text-center">
            {page.profileImage && (
              <div className={`mx-auto h-28 w-28 overflow-hidden rounded-full bg-black/30 shadow-xl ring-1 ring-white/10 ${page.bannerImage ? "-mt-20" : ""}`}>
                <img
                  src={page.profileImage}
                  alt={page.displayName}
                  className="block h-full w-full object-cover"
                />
              </div>
            )}

            <h1 className="mt-5 text-3xl font-black tracking-tight text-white">
              {page.displayName}
            </h1>

            {badges.length > 0 && (
              <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
                {badges.map((badge, index) => (
                  <ProfileBadgeIcon key={`${badge.name}-${index}`} badge={badge} />
                ))}
              </div>
            )}

            {page.location && (
              <p className="mt-2 text-sm font-medium text-white/60">{page.location}</p>
            )}

            {page.bio && (
              <p className="mx-auto mt-3 max-w-xl whitespace-pre-wrap text-sm leading-6 text-white/75">
                {page.bio}
              </p>
            )}
          </div>

          <PublicLinks uri={page.uri} buttons={page.buttons} links={page.links} />
        </div>
      </section>
    </main>
  );
}
