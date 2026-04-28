import mongoose from "mongoose";
import { notFound } from "next/navigation";
import { Page } from "@/models/Page";
import { getBadgeModels } from "@/models/Badge";
import { getTeamProfileModel } from "@/models/TeamProfile";
import PublicLinks from "@/components/PublicLinks";

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
    isTeam: page.isTeam,
  };
}

async function getVisibleBadgesForOwner(ownerEmail) {
  if (!ownerEmail) return [];
  const { BadgeModel, UserBadgeModel } = await getBadgeModels();

  const ownedBadges = await UserBadgeModel.find({ ownerEmail: normalise(ownerEmail), visible: { $ne: false } }).lean();
  const badgeIds = ownedBadges.map((b) => b.badgeId).filter(Boolean);
  if (!badgeIds.length) return [];

  const badges = await BadgeModel.find({ _id: { $in: badgeIds }, isActive: { $ne: false } }).lean();

  return badges.map((b) => ({ name: b.name, icon: b.icon }));
}

export default async function PublicProfilePage({ params }) {
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

  return (
    <main className="min-h-screen text-white" style={{ backgroundColor: page.bgColor }}>
      <section className="mx-auto flex min-h-screen w-full max-w-2xl flex-col px-4 py-8">
        <div className="rounded-[2rem] border border-white/10 bg-black/45 shadow-2xl backdrop-blur-xl">

          {page.bannerImage && (
            <div className="h-44 w-full overflow-hidden">
              <img src={page.bannerImage} className="h-full w-full object-cover" />
            </div>
          )}

          <div className="px-5 pb-8 pt-8 text-center">
            {page.profileImage && (
              <div className={`mx-auto h-28 w-28 overflow-hidden rounded-full ${page.bannerImage ? "-mt-20" : ""}`}>
                <img src={page.profileImage} className="h-full w-full object-cover" />
              </div>
            )}

            <div className="flex items-center justify-center gap-2 mt-5">
              <h1 className="text-3xl font-black">{page.displayName}</h1>

              {page.isTeam && (
                <div className="group relative">
                  <div className="h-6 w-6 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-bold">
                    ✓
                  </div>
                  <div className="absolute top-8 left-1/2 -translate-x-1/2 scale-0 group-hover:scale-100 transition bg-black border border-white/10 text-xs px-2 py-1 rounded-lg whitespace-nowrap">
                    Verified Team
                  </div>
                </div>
              )}
            </div>

            {badges.length > 0 && (
              <div className="mt-3 flex flex-wrap justify-center gap-2">
                {badges.map((b, i) => (
                  <img key={i} src={b.icon} className="h-6 w-6" />
                ))}
              </div>
            )}

            {page.bio && (
              <p className="mt-3 text-sm text-white/70">{page.bio}</p>
            )}

            {team && (
              <div className="mt-6 text-left">
                <h2 className="text-lg font-bold text-blue-300">Team</h2>
                <p className="text-white/70 mt-2">{team.description}</p>

                {team.members?.length > 0 && (
                  <div className="mt-4 grid grid-cols-2 gap-2">
                    {team.members.map((m, i) => (
                      <div key={i} className="bg-white/5 p-2 rounded">
                        <div>{m.username}</div>
                        <div className="text-xs text-white/50">{m.role}</div>
                      </div>
                    ))}
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
