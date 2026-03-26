import mongoose from "mongoose";
import { Page } from "@/models/Page";
import { User } from "@/models/User";
import { Ban } from "@/models/Ban";
import PublicLinks from "@/components/PublicLinks";
import ProfileShareButton from "@/components/ProfileShareButton";
import ProfileAnalyticsTracker from "@/components/analytics/ProfileAnalyticsTracker";

const norm = (s) => (s || "").toString().trim().toLowerCase();

function BannedScreen({ reason }) {
  return (
    <div className="min-h-screen bg-[#0b0f14] flex items-center justify-center text-white">
      <div className="p-8 rounded-2xl bg-black/40 border border-white/10 text-center">
        <h1 className="text-2xl font-bold">Page banned</h1>
        <p className="mt-3 text-white/70">{reason || "No reason provided."}</p>
      </div>
    </div>
  );
}

function NotFoundScreen() {
  return (
    <div className="min-h-screen bg-[#0b0f14] flex items-center justify-center text-white">
      <h1 className="text-2xl font-bold">Page not found</h1>
    </div>
  );
}

export default async function PageByUri({ params }) {
  const { uri } = params;

  await mongoose.connect(process.env.MONGO_URI);

  const page = await Page.findOne({ uri }).lean();
  if (!page) return <NotFoundScreen />;

  const uriBan = await Ban.findOne({
    type: "uri",
    identifier: norm(uri),
  }).lean();

  if (uriBan) return <BannedScreen reason={uriBan.reason} />;

  const emailBan = await Ban.findOne({
    type: "email",
    identifier: norm(page.owner),
  }).lean();

  if (emailBan) return <BannedScreen reason={emailBan.reason} />;

  const user = await User.findOne({ email: page.owner }).lean();

  // ✅ GIF / Image Background
  const bgUrl = (page.bgImage || "").trim();
  const isGif = bgUrl.toLowerCase().endsWith(".gif");

  const bgStyle =
    page.bgType === "image" && bgUrl
      ? {
          backgroundImage: `url(${bgUrl})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
        }
      : {
          backgroundColor: page.bgColor || "#0b0f14",
        };

  const avatar = page.profileImage || user?.image || "/assets/logo.webp";

  return (
    <main className="min-h-screen text-white" style={bgStyle}>
      <ProfileAnalyticsTracker uri={page.uri} />

      {/* Overlay */}
      <div
        className={`min-h-screen ${
          isGif
            ? "bg-black/70 backdrop-blur-md"
            : "bg-black/40 backdrop-blur-sm"
        }`}
      >
        <div className="max-w-2xl mx-auto p-6">
          <div className="bg-[#050b18]/80 rounded-3xl border border-white/10 p-6">

            <div className="flex items-center gap-4">
              <img
                src={avatar}
                className="w-20 h-20 rounded-full object-cover"
              />

              <div>
                <h1 className="text-2xl font-bold">
                  {page.displayName || user?.name || page.uri}
                </h1>
                <p className="text-white/50">@{page.uri}</p>
              </div>
            </div>

            {page.bio && (
              <p className="mt-4 text-white/80">{page.bio}</p>
            )}

            <div className="mt-6">
              <PublicLinks
                uri={page.uri}
                buttons={page.buttons}
                links={page.links}
              />
            </div>

            <div className="mt-6">
              <ProfileShareButton
                url={`${process.env.NEXTAUTH_URL}/${page.uri}`}
                displayName={page.displayName}
                username={page.uri}
                bio={page.bio}
                avatar={avatar}
              />
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
