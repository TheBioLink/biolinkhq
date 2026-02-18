import mongoose from "mongoose";
import { Page } from "@/models/Page";
import { User } from "@/models/User";
import PublicLinks from "@/components/PublicLinks";

export default async function PageByUri({ params }) {
  const { uri } = params;

  await mongoose.connect(process.env.MONGO_URI);

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

  // Background support (color / image)
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

  return (
    <div className="min-h-screen text-gray-100" style={bgStyle}>
      <div className="max-w-2xl mx-auto">
        {/* Banner */}
        {banner ? (
          <img
            src={banner}
            alt="banner"
            className="w-full h-40 md:h-56 object-cover rounded-b-2xl"
          />
        ) : (
          <div className="w-full h-32 md:h-44 bg-white/5 border-b border-white/10 rounded-b-2xl" />
        )}

        {/* Avatar */}
        <div className="-mt-10 flex justify-center">
          <img
            src={avatar}
            alt="profile"
            className="w-24 h-24 rounded-full border-4 border-[#0b0f14] object-cover shadow"
          />
        </div>

        {/* Header */}
        <div className="text-center px-4 mt-3">
          <h1 className="text-3xl font-bold">
            {page.displayName || user?.name || page.uri}
          </h1>

          {!!page.location && (
            <p className="text-gray-300 mt-1">{page.location}</p>
          )}

          {!!page.bio && <p className="text-gray-300 mt-2">{page.bio}</p>}

          <div className="text-gray-400 text-sm mt-2">/{page.uri}</div>
        </div>

        {/* Interactive links/buttons (Client Component) */}
        <PublicLinks uri={page.uri} buttons={page.buttons} links={page.links} />
      </div>
    </div>
  );
}
