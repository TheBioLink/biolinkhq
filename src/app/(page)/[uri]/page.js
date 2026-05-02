import mongoose from "mongoose";
import { notFound } from "next/navigation";
import { Page } from "@/models/Page";
import { getBadgeModels } from "@/models/Badge";
import { getTeamProfileModel } from "@/models/TeamProfile";
import PublicLinks from "@/components/PublicLinks";
import DiscordPublicBadge from "@/components/discord/DiscordPublicBadge";

export const dynamic = "force-dynamic";

const normalise = (value) => (value || "").toString().toLowerCase().trim();

async function connectToDatabase() {
  if (mongoose.connection.readyState >= 1) return;
  if (!process.env.MONGO_URI) throw new Error("Missing MONGO_URI");
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
    links: Array.isArray(page.links) ? page.links : [],
    isTeam: Boolean(page.isTeam),
  };
}

async function getVisibleBadgesForOwner(ownerEmail) {
  if (!ownerEmail) return [];

  const { BadgeModel, UserBadgeModel } = await getBadgeModels();
  const ownedBadges = await UserBadgeModel.find({
    ownerEmail: normalise(ownerEmail),
    visible: { $ne: false },
  }).lean();

  const badgeIds = ownedBadges.map((item) => item.badgeId).filter(Boolean);
  if (!badgeIds.length) return [];

  const badges = await BadgeModel.find({
    _id: { $in: badgeIds },
    isActive: { $ne: false },
  }).lean();

  const order = new Map(ownedBadges.map((item, index) => [String(item.badgeId), index]));

  return badges
    .sort((a, b) => (order.get(String(a._id)) ?? 9999) - (order.get(String(b._id)) ?? 9999))
    .map((badge) => ({
      name: badge.name || "Badge",
      icon: badge.icon || "",
      tagline: badge.tagline || badge.name || "Badge",
      targetUri: badge.targetUri || "",
      targetUrl: badge.targetUrl || (badge.targetUri ? `/${badge.targetUri}` : ""),
    }));
}

function VerifiedTeamBadge() {
  return (
    <div className="group relative inline-flex">
      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-500 text-xs font-black text-white shadow-lg shadow-blue-500/20">
        ✓
      </div>
      <div className="absolute left-1/2 top-8 z-50 -translate-x-1/2 scale-0 whitespace-nowrap rounded-lg border border-white/10 bg-black px-2 py-1 text-xs text-white shadow-xl transition group-hover:scale-100">
        Verified Team
      </div>
    </div>
  );
}

function ProfileBadge({ badge }) {
  const tooltip = badge.tagline || badge.name || "Badge";
  const icon = badge.icon;
  const href = badge.targetUrl || (badge.targetUri ? `/${badge.targetUri}` : "");
  const inner = icon ? (
    <img src={icon} alt={badge.name || "Badge"} className="h-6 w-6 object-contain transition group-hover:scale-110" />
  ) : (
    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/10 text-xs font-black text-white">
      {(badge.name || "?").slice(0, 1).toUpperCase()}
    </span>
  );

  const content = (
    <>
      {inner}
      <div className="absolute left-1/2 top-8 z-50 -translate-x-1/2 scale-0 whitespace-nowrap rounded-lg border border-white/10 bg-black px-2 py-1 text-xs text-white shadow-xl transition group-hover:scale-100">
        {tooltip}
      </div>
    </>
  );

  if (href) {
    return (
      <a href={href} className="group relative inline-flex" title={tooltip}>
        {content}
      </a>
    );
  }

  return (
    <span className="group relative inline-flex" title={tooltip}>
      {content}
    </span>
  );
}

export default async function PublicProfilePage({ params }) {
  // Block reserved app paths from being treated as profile URIs
  const reserved = [
    "account", "login", "pricing", "about", "contact",
    "privacy", "news", "application", "api", "analytics",
    "messages", "reports", "subscription", "badges", "articles",
  ];
  if (reserved.includes(params.uri.toLowerCase())) {
    notFound();
  }

  await connectToDatabase();

  const rawPage = await Page.findOne({ uri: params.uri }).lean();
  if (!rawPage) notFound();

  const page = serialisePage(rawPage);
  const badges = await getVisibleBadgesForOwner(page.owner);

  let team = null;
  if (page.isTeam) {
    const TeamProfile = await getTeamProfileModel();
    team = await TeamProfile.findOne({ ownerEmail: page.owner }).lean();
  }

  const verifiedPlayers = Array.isArray(team?.members)
    ? team.members.filter((member) => member?.verified)
    : [];

  return (
    <main className="min-h-screen text-white" style={{ backgroundColor: page.bgColor }}>
      <section className="mx-auto flex min-h-screen w-full max-w-2xl flex-col px-4 py-8">
        <div className="overflow-hidden rounded-[2rem] border border-white/10 bg-black/45 shadow-2xl backdrop-blur-xl">
          {page.bannerImage && (
            <div className="h-44 w-full overflow-hidden bg-white/5 sm:h-56">
              <img src={page.bannerImage} alt={`${page.displayName} banner`} className="h-full w-full object-cover" />
            </div>
          )}

          <div className="px-5 pb-8 pt-8 text-center">
            {page.profileImage && (
              <div className={`mx-auto h-28 w-28 overflow-hidden rounded-full bg-black/30 shadow-xl ring-1 ring-white/10 ${page.bannerImage ? "-mt-20" : ""}`}>
                <img src={page.profileImage} alt={page.displayName} className="h-full w-full object-cover" />
              </div>
            )}

            <div className="mt-5 flex items-center justify-center gap-2">
              <h1 className="text-3xl font-black tracking-tight text-white">{page.displayName}</h1>
              {page.isTeam ? <VerifiedTeamBadge /> : null}
            </div>

            {badges.length > 0 && (
              <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
                {badges.map((badge, index) => (
                  <ProfileBadge key={`${badge.name}-${index}`} badge={badge} />
                ))}
              </div>
            )}

            {page.bio && (
              <p className="mx-auto mt-3 max-w-xl whitespace-pre-wrap text-sm leading-6 text-white/75">{page.bio}</p>
            )}

            {team && (
              <div className="mt-8 text-left">
                <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                  <div className="text-xs font-black uppercase tracking-[0.2em] text-blue-300">About</div>
                  {team.description ? (
                    <p className="mt-3 text-sm leading-6 text-white/70">{team.description}</p>
                  ) : (
                    <p className="mt-3 text-sm text-white/40">No team description yet.</p>
                  )}

                  <div className="mt-5 grid gap-3 sm:grid-cols-3">
                    {team.region ? <div className="rounded-xl bg-black/25 p-3"><div className="text-xs text-white/40">Region</div><div className="font-bold">{team.region}</div></div> : null}
                    {team.game ? <div className="rounded-xl bg-black/25 p-3"><div className="text-xs text-white/40">Game</div><div className="font-bold">{team.game}</div></div> : null}
                    <div className="rounded-xl bg-black/25 p-3"><div className="text-xs text-white/40">Recruiting</div><div className="font-bold">{team.recruiting ? "Open" : "Closed"}</div></div>
                  </div>
                </div>

                {verifiedPlayers.length > 0 && (
                  <div className="mt-5 rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                    <div className="text-xs font-black uppercase tracking-[0.2em] text-blue-300">Players</div>
                    <div className="mt-4 grid gap-3 sm:grid-cols-2">
                      {verifiedPlayers.map((member, index) => {
                        const href = member.profileUri ? `/${member.profileUri}` : "";
                        const card = (
                          <div className="rounded-xl border border-white/10 bg-black/25 p-3 transition hover:bg-white/[0.06]">
                            <div className="font-black text-white">{member.username || member.profileUri}</div>
                            <div className="text-xs text-white/45">{member.role || "Player"}</div>
                          </div>
                        );

                        return href ? <a key={index} href={href}>{card}</a> : <div key={index}>{card}</div>;
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <PublicLinks uri={page.uri} buttons={page.buttons} links={page.links} />
        </div>
      </section>
    </main>
  );
}
