import mongoose from "mongoose";
import { Page } from "@/models/Page";
import { User } from "@/models/User";
import { Ban } from "@/models/Ban";
import PublicLinks from "@/components/PublicLinks";

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

  // Block banned profile URIs
  const uriBan = await Ban.findOne({ type: "uri", identifier: uri.toLowerCase() }).lean();
  if (uriBan) {
    return (
      <div className="min-h-screen bg-[#0b0f14] text-gray-100 flex items-center justify-center p-6">
        <div className="text-center max-w-lg">
          <h1 className="text-3xl font-extrabold">This page isn’t available</h1>
          <p className="text-gray-400 mt-3">
            This profile has been disabled.
          </p>
        </div>
      </div>
    );
  }

  const page = await Page.findOne({ uri }).lean();
  if (!page) {
    return (
      <div className="min-h-screen bg-[#0b0f14] text-gray-100 flex items-center justify-center p-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold">Not found</h1>
          <p className="text-gray-400 mt-2">This page doesn’t exist.</p>
        </div>
      </div>
    );
  }

  const user = await User.findOne({ email: page.owner }).lean();

  const bgStyle =
    page.bgType === "image" && page.bgImage
      ? {
          backgroundImage: `url(${page.bgImage})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }
      : { backgroundColor: page.bgColor || "#0b0f14" };

  const avatar = page.profileImage || user?.image || "/assets/logo.webp";
  const banner = page.bannerImage;

  const who = (page.uri || "").toLowerCase();
  const isFounder = who === "ceosolace";
  const isOfficial = who === "biolinkhq";

  return (
    <div className="min-h-screen text-gray-100" style={bgStyle}>
      <div className="max-w-2xl mx-auto">
        {banner ? (
          <img
            src={banner}
            alt="banner"
            className="w-full h-40 md:h-56 object-cover rounded-b-2xl"
          />
        ) : (
          <div className="w-full h-32 md:h-44 bg-white/5 border-b border-white/10 rounded-b-2xl" />
        )}

        <div className="-mt-10 flex justify-center">
          <img
            src={avatar}
            alt="profile"
            className="w-24 h-24 rounded-full border-4 border-[#0b0f14] object-cover shadow"
          />
        </div>

        <div className="text-center px-4 mt-3">
          <h1 className="text-3xl font-extrabold">
            {page.displayName || user?.name || page.uri}
          </h1>

          {/* ✅ badges */}
          {(isFounder || isOfficial) && (
            <div className="mt-3 flex flex-wrap justify-center gap-2">
              {isFounder && <Badge tone="gold">Founder</Badge>}
              {isOfficial && <Badge tone="blue">Official</Badge>}
            </div>
          )}

          {!!page.location && <p className="text-gray-300 mt-2">{page.location}</p>}
          {!!page.bio && <p className="text-gray-300 mt-2">{page.bio}</p>}
          <div className="text-gray-400 text-sm mt-2">/{page.uri}</div>
        </div>

        <PublicLinks uri={page.uri} buttons={page.buttons} links={page.links} />
      </div>
    </div>
  );
}
