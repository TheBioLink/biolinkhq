import mongoose from "mongoose";
import Link from "next/link";
import { Page } from "@/models/Page";
import { User } from "@/models/User";
import { Ban } from "@/models/Ban";
import PublicLinks from "@/components/PublicLinks";
import ProfileShareButton from "@/components/ProfileShareButton";
import ProfileAnalyticsTracker from "@/components/analytics/ProfileAnalyticsTracker";
import { getLinkedProfileModel } from "@/models/LinkedProfile";

const norm = (s) => (s || "").toString().trim().toLowerCase();

function BannedScreen({ reason }) {
  return (
    <div className="min-h-screen bg-[#0a0f1a] px-6 py-12 text-white">
      <div className="mx-auto max-w-2xl rounded-3xl border border-red-400/20 bg-red-500/10 p-8">
        <h1 className="text-3xl font-black">This page has been banned</h1>
        <p className="mt-4 text-white/75">This profile is not available.</p>

        <div className="mt-6 rounded-2xl border border-white/10 bg-black/20 p-4">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-white/40">
            Reason
          </p>
          <p className="mt-2 text-white/90">{reason || "No reason provided."}</p>
        </div>
      </div>
    </div>
  );
}

function NotFoundScreen() {
  return (
    <div className="min-h-screen bg-[#0a0f1a] px-6 py-12 text-white">
      <div className="mx-auto max-w-2xl rounded-3xl border border-white/10 bg-white/5 p-8">
        <h1 className="text-3xl font-black">Not found</h1>
        <p className="mt-4 text-white/70">This page doesn’t exist.</p>
      </div>
    </div>
  );
}

function Badge({ children, tone = "blue" }) {
  const base =
    "inline-flex items-center rounded-full px-3 py-1 text-xs font-extrabold border";
  const tones = {
    blue: "bg-blue-500/15 text-blue-200 border-blue-400/20",
    gold: "bg-yellow-500/15 text-yellow-200 border-yellow-400/20",
  };

  return <span className={`${base} ${tones[tone] || tones.blue}`}>{children}</span>;
}

export default async function PageByUri({ params }) {
  const { uri } = params;

  await mongoose.connect(process.env.MONGO_URI);

  const normalizedUri = norm(uri);

  const uriBan = await Ban.findOne({
    type: "uri",
    identifier: normalizedUri,
  }).lean();

  if (uriBan) {
    return <BannedScreen reason={uriBan.reason} />;
  }

  const page = await Page.findOne({ uri }).lean();
  if (!page) {
    return <NotFoundScreen />;
  }

  const ownerEmail = norm(page.owner);
  if (ownerEmail) {
    const emailBan = await Ban.findOne({
      type: "email",
      identifier: ownerEmail,
    }).lean();

    if (emailBan) {
      return <BannedScreen reason={emailBan.reason} />;
    }
  }

  const user = await User.findOne({ email: page.owner }).lean();

  const linkedPsid = user?.psid || null;
  let linkedProfile = null;

  if (linkedPsid) {
    const LinkedProfile = await getLinkedProfileModel();
    linkedProfile = await LinkedProfile.findOne({
      psid: linkedPsid,
      enabled: true,
    }).lean();
  }

  const bgStyle =
    page.bgType === "image" && page.bgImage
      ? {
          backgroundImage: `url(${page.bgImage})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }
      : {
          backgroundColor: page.bgColor || "#0b0f14",
        };

  const avatar = page.profileImage || user?.image || "/assets/logo.webp";
  const banner = page.bannerImage || "";
  const who = norm(page.uri);
  const isFounder = who === "ceosolace" || who === "itsnicbtw";
  const isOfficial = who === "biolinkhq";

  return (
    <div className="min-h-screen text-white" style={bgStyle}>
      <ProfileAnalyticsTracker uri={page.uri} owner={page.owner} />

      <div className="min-h-screen bg-black/40 px-4 py-8 backdrop-blur-sm">
        <div className="mx-auto max-w-2xl">
          <div className="overflow-hidden rounded-[2rem] border border-white/10 bg-[#0f1722]/80 shadow-2xl">
            {banner ? (
              <div
                className="h-40 w-full bg-cover bg-center"
                style={{ backgroundImage: `url(${banner})` }}
              />
            ) : (
              <div className="h-24 w-full bg-gradient-to-r from-blue-600/30 via-cyan-500/20 to-purple-600/30" />
            )}

            <div className="px-6 pb-8">
              <div className="-mt-12 flex items-end justify-between gap-4">
                <img
                  src={avatar}
                  alt={page.displayName || user?.name || page.uri}
                  className="h-24 w-24 rounded-3xl border-4 border-[#0f1722] object-cover shadow-xl"
                />

                <div className="flex items-center gap-2">
                  <ProfileShareButton />
                </div>
              </div>

              <div className="mt-5 text-center">
                <h1 className="text-3xl font-black tracking-tight">
                  {page.displayName || user?.name || page.uri}
                </h1>

                {(isFounder || isOfficial) && (
                  <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
                    {isFounder ? <Badge tone="gold">Founder</Badge> : null}
                    {isOfficial ? <Badge tone="blue">Official</Badge> : null}
                  </div>
                )}

                {page.location ? (
                  <p className="mt-3 text-sm text-white/65">{page.location}</p>
                ) : null}

                {page.bio ? (
                  <p className="mx-auto mt-4 max-w-xl text-sm leading-7 text-white/80">
                    {page.bio}
                  </p>
                ) : null}

                <p className="mt-4 text-xs font-black uppercase tracking-[0.24em] text-white/40">
                  /{page.uri}
                </p>

                {linkedProfile ? (
                  <div className="mt-4">
                    <Link
                      href={`/esports/${linkedPsid}`}
                      className="inline-flex items-center rounded-2xl border border-blue-400/20 bg-blue-500/10 px-4 py-3 text-sm font-extrabold text-blue-200 hover:bg-blue-500/15"
                    >
                      View Esports Identity
                    </Link>
                  </div>
                ) : null}
              </div>

              <div className="mt-8">
                <PublicLinks page={page} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
