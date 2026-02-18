import { Page } from "@/models/Page";
import { User } from "@/models/User";
import mongoose from "mongoose";
import { getIconForUrl } from "@/libs/linkIcons";
import {
  faEnvelope,
  faGlobe,
  faLink,
  faPhone,
} from "@fortawesome/free-solid-svg-icons";
import {
  faFacebook,
  faGithub,
  faInstagram,
  faLinkedin,
  faTiktok,
  faTwitter,
  faYoutube,
} from "@fortawesome/free-brands-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

const iconsMap = {
  email: faEnvelope,
  phone: faPhone,
  website: faGlobe,
  link: faLink,
  instagram: faInstagram,
  tiktok: faTiktok,
  youtube: faYoutube,
  twitter: faTwitter,
  facebook: faFacebook,
  linkedin: faLinkedin,
  github: faGithub,
};

// OPTIONAL: your old “buttons” system might use keys like email/phone/instagram.
// If you switched fully to {label,url} buttons, we still render those too.
function isLegacyButton(b) {
  return b && typeof b === "object" && ("key" in b || "value" in b);
}

export default async function PageByUri({ params }) {
  const { uri } = params;

  await mongoose.connect(process.env.MONGO_URI);

  const page = await Page.findOne({ uri }).lean();
  if (!page) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold">Not found</h1>
          <p className="text-gray-500 mt-2">This page doesn’t exist.</p>
        </div>
      </div>
    );
  }

  // get owner user info (fallback avatar)
  const user = await User.findOne({ email: page.owner }).lean();

  // Track view
  try {
    await fetch(`${process.env.NEXTAUTH_URL || ""}/api/click`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      // same API is used for clicks; we store view event too
      body: JSON.stringify({ uri: page.uri, type: "view" }),
      cache: "no-store",
    });
  } catch {}

  const avatar = page.profileImage || user?.image || "/assets/logo.webp";

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Banner */}
      <div className="max-w-2xl mx-auto">
        {page.bannerImage ? (
          <img
            src={page.bannerImage}
            alt="banner"
            className="w-full h-40 md:h-56 object-cover rounded-b-2xl"
          />
        ) : (
          <div className="w-full h-32 md:h-44 bg-white rounded-b-2xl border-b" />
        )}

        {/* Avatar */}
        <div className="-mt-10 flex justify-center">
          <img
            src={avatar}
            alt="profile"
            className="w-24 h-24 rounded-full border-4 border-white object-cover shadow"
          />
        </div>

        {/* Header */}
        <div className="text-center px-4 mt-3">
          <h1 className="text-3xl font-bold">
            {page.displayName || user?.name || page.uri}
          </h1>
          {page.bio && <p className="text-gray-600 mt-2">{page.bio}</p>}
          <div className="text-gray-400 text-sm mt-2">/{page.uri}</div>
        </div>

        {/* Buttons (supports BOTH styles) */}
        <div className="px-4 mt-6 space-y-3">
          {Array.isArray(page.buttons) &&
            page.buttons.map((b, idx) => {
              // New style: {label,url}
              if (b?.label && b?.url && !isLegacyButton(b)) {
                const Icon = getIconForUrl(b.url);
                return (
                  <a
                    key={idx}
                    href={b.url}
                    target="_blank"
                    rel="noreferrer"
                    onClick={async () => {
                      try {
                        await fetch("/api/click", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({
                            uri: page.uri,
                            type: "click",
                            url: b.url,
                          }),
                        });
                      } catch {}
                    }}
                    className="w-full flex items-center justify-center gap-2 bg-white border rounded-xl p-4 font-bold shadow-sm hover:shadow transition"
                  >
                    <Icon />
                    <span>{b.label}</span>
                  </a>
                );
              }

              // Legacy style example: {key:'instagram', value:'https://...'}
              const key = b?.key || "link";
              const value = b?.value || b?.url || "";
              const icon = iconsMap[key] || faLink;

              if (!value) return null;

              const href =
                key === "email"
                  ? `mailto:${value}`
                  : key === "phone"
                  ? `tel:${value}`
                  : value;

              return (
                <a
                  key={idx}
                  href={href}
                  target={key === "email" || key === "phone" ? "_self" : "_blank"}
                  rel="noreferrer"
                  onClick={async () => {
                    try {
                      await fetch("/api/click", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                          uri: page.uri,
                          type: "click",
                          url: href,
                        }),
                      });
                    } catch {}
                  }}
                  className="w-full flex items-center justify-center gap-2 bg-white border rounded-xl p-4 font-bold shadow-sm hover:shadow transition"
                >
                  <FontAwesomeIcon icon={icon} />
                  <span className="truncate">{value}</span>
                </a>
              );
            })}
        </div>

        {/* Links */}
        <div className="px-4 mt-8 mb-12 space-y-3">
          {Array.isArray(page.links) &&
            page.links.map((l, idx) => {
              if (!l?.url) return null;
              const Icon = getIconForUrl(l.url);

              return (
                <a
                  key={idx}
                  href={l.url}
                  target="_blank"
                  rel="noreferrer"
                  onClick={async () => {
                    try {
                      await fetch("/api/click", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                          uri: page.uri,
                          type: "click",
                          url: l.url,
                        }),
                      });
                    } catch {}
                  }}
                  className="w-full flex items-center justify-between bg-white border rounded-xl p-4 shadow-sm hover:shadow transition"
                >
                  <div className="flex items-center gap-3">
                    <Icon />
                    <span className="font-semibold">{l.title || l.url}</span>
                  </div>
                  <span className="text-gray-300">›</span>
                </a>
              );
            })}
        </div>
      </div>
    </div>
  );
}
