// src/app/(page)/[uri]/page.js
import mongoose from "mongoose";
import { Page } from "@/models/Page";
import { User } from "@/models/User";
import { Ban } from "@/models/Ban";
import PublicLinks from "@/components/PublicLinks";
import ProfileShareButton from "@/components/ProfileShareButton";

const norm = (s) => (s || "").toString().trim().toLowerCase();

function BannedScreen({ reason }) {
  return (
    <div className="min-h-screen bg-[#0b0f14] text-white flex items-center justify-center px-4">
      <div className="w-full max-w-xl rounded-3xl border border-white/10 bg-black/30 p-8 text-center">
        <h1 className="text-3xl font-black">This page has been banned</h1>
        <p className="mt-3 text-white/75">This profile is not available.</p>

        <div className="mt-6 rounded-2xl border border-red-400/20 bg-red-500/10 p-4 text-left">
          <div className="text-xs font-bold uppercase tracking-[0.24em] text-red-200/80">
            Reason
          </div>
          <div className="mt-2 text-sm text-red-50">
            {reason || "No reason provided."}
          </div>
        </div>
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

  const uriBan = await Ban.findOne({
    type: "uri",
    identifier: norm(uri),
  }).lean();

  if (uriBan) {
    return <BannedScreen reason={uriBan.reason} />;
  }

  const page = await Page.findOne({ uri }).lean();

  if (!page) {
    return (
      <div className="min-h-screen bg-[#0b0f14] text-white flex items-center justify-center px-4">
        <div className="w-full max-w-xl rounded-3xl border border-white/10 bg-black/30 p-8 text-center">
          <h1 className="text-3xl font-black">Not found</h1>
          <p className="mt-3 text-white/75">This page doesn’t exist.</p>
        </div>
      </div>
    );
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
  const banner = page.bannerImage;
  const who = norm(page.uri);
  const isFounder = who === "itsnicbtw";
  const isOfficial = who === "biolinkhq";

  return (
    <main
      className="min-h-screen text-white"
      style={bgStyle}
    >
      <div className="min-h-screen bg-black/40 backdrop-blur-[1px]">
        <div className="mx-auto flex min-h-screen w-full max-w-3xl flex-col px-4 py-8 sm:px-6">
          <div className="overflow-hidden rounded-[32px] border border-white/10 bg-[#050b18]/80 shadow-[0_20px_80px_rgba(0,0,0,0.55)] backdrop-blur-xl">
            {banner ? (
              <div className="h-48 w-full sm:h-56">
                <img
                  src={banner}
                  alt={`${page.displayName || page.uri} banner`}
                  className="h-full w-full object-cover"
                />
              </div>
            ) : (
              <div className="h-24 w-full bg-gradient-to-r from-blue-900/60 via-indigo-900/50 to-slate-900/60 sm:h-28" />
            )}

            <div className="px-5 pb-6 sm:px-8">
              <div className="-mt-12 flex flex-col gap-4 sm:-mt-14 sm:flex-row sm:items-end sm:justify-between">
                <div className="flex items-end gap-4">
                  <img
                    src={avatar}
                    alt={page.displayName || page.uri}
                    className="h-24 w-24 rounded-full border-4 border-[#050b18] object-cover shadow-xl sm:h-28 sm:w-28"
                  />

                  <div className="pb-1">
                    <h1 className="text-2xl font-black leading-tight sm:text-3xl">
                      {page.displayName || user?.name || page.uri}
                    </h1>

                    {(isFounder || isOfficial) && (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {isFounder && <Badge tone="gold">Founder</Badge>}
                        {isOfficial && <Badge>Official</Badge>}
                      </div>
                    )}
                  </div>
                </div>

                <div className="sm:pb-2">
                  <ProfileShareButton
                    displayName={page.displayName || user?.name || page.uri}
                    username={page.uri}
                    bio={page.bio}
                    avatar={avatar}
                  />
                </div>
              </div>

              <div className="mt-5 space-y-3">
                {!!page.location && (
                  <div className="text-sm font-medium text-white/65">
                    {page.location}
                  </div>
                )}

                {!!page.bio && (
                  <p className="max-w-2xl text-sm leading-6 text-white/85 sm:text-base">
                    {page.bio}
                  </p>
                )}

                <div className="text-sm font-semibold text-white/45">
                  /{page.uri}
                </div>
              </div>

              <div className="mt-8">
                <PublicLinks
                  uri={page.uri}
                  buttons={page.buttons}
                  links={page.links}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
