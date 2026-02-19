"use client";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
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
  faDiscord,
} from "@fortawesome/free-brands-svg-icons";
import { getIconForUrl } from "@/libs/linkIcons";

const BUTTON_META = {
  website: { label: "Website", icon: faGlobe },
  email: { label: "Email", icon: faEnvelope },
  phone: { label: "Phone", icon: faPhone },
  instagram: { label: "Instagram", icon: faInstagram },
  tiktok: { label: "TikTok", icon: faTiktok },
  youtube: { label: "YouTube", icon: faYoutube },
  twitter: { label: "X", icon: faTwitter },
  facebook: { label: "Facebook", icon: faFacebook },
  linkedin: { label: "LinkedIn", icon: faLinkedin },
  github: { label: "GitHub", icon: faGithub },
  discord: { label: "Discord", icon: faDiscord },
};

function normalizeHref(raw) {
  const v = (raw || "").toString().trim();
  if (!v) return "";

  // Already absolute / special schemes
  if (
    v.startsWith("http://") ||
    v.startsWith("https://") ||
    v.startsWith("mailto:") ||
    v.startsWith("tel:")
  ) {
    return v;
  }

  // Relative internal
  if (v.startsWith("/")) return v;

  // Domain without scheme
  return `https://${v}`;
}

async function trackClick(uri, url) {
  try {
    await fetch("/api/click", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ uri, type: "click", url }),
    });
  } catch {}
}

export default function PublicLinks({ uri, buttons = {}, links = [] }) {
  // LINKS: array [{title,url}]
  const linksArr = Array.isArray(links) ? links : [];

  // BUTTONS:
  // - expected schema is object: {instagram:"...", email:"..."}
  // - also supports array: [{label,url}]
  const buttonsIsObject =
    buttons && typeof buttons === "object" && !Array.isArray(buttons);
  const buttonsIsArray = Array.isArray(buttons);

  const buttonCards = buttonsIsObject
    ? Object.entries(buttons)
        .map(([key, value]) => ({ key, value }))
        .filter((b) => b.value && b.value.toString().trim().length > 0)
        .map((b) => {
          const key = b.key || "link";
          const raw = (b.value || "").toString().trim();

          // build href for special types
          let href =
            key === "email"
              ? `mailto:${raw}`
              : key === "phone"
              ? `tel:${raw}`
              : normalizeHref(raw);

          const meta = BUTTON_META[key] || { label: key, icon: faLink };
          return { key, href, label: meta.label, icon: meta.icon, raw };
        })
        .filter((b) => b.href)
    : [];

  return (
    <>
      {/* ✅ BUTTONS AS BIG BUTTONS */}
      {buttonCards.length > 0 && (
        <div className="px-4 mt-6 space-y-3">
          {buttonCards.map((b, idx) => (
            <a
              key={`${b.key}-${idx}`}
              href={b.href}
              target={b.href.startsWith("/") ? "_self" : "_blank"}
              rel="noreferrer"
              onClick={() => trackClick(uri, b.href)}
              className="w-full flex items-center justify-between bg-white/5 border border-white/10 rounded-xl p-4 shadow-sm hover:bg-white/10 hover:shadow transition"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-black/30 border border-white/10 flex items-center justify-center">
                  <FontAwesomeIcon icon={b.icon} />
                </div>
                <div className="flex flex-col">
                  <span className="font-bold text-gray-100">{b.label}</span>
                  <span className="text-sm text-gray-400 truncate max-w-[220px] sm:max-w-[360px]">
                    {b.key === "email" || b.key === "phone" ? b.raw : b.href}
                  </span>
                </div>
              </div>

              <span className="text-gray-400 text-xl">›</span>
            </a>
          ))}
        </div>
      )}

      {/* Optional: if you ever store buttons as array [{label,url}] */}
      {buttonsIsArray && buttons.length > 0 && (
        <div className="px-4 mt-6 space-y-3">
          {buttons.map((b, idx) => {
            if (!b?.url) return null;
            const href = normalizeHref(b.url);
            if (!href) return null;
            const Icon = getIconForUrl(href);

            return (
              <a
                key={idx}
                href={href}
                target={href.startsWith("/") ? "_self" : "_blank"}
                rel="noreferrer"
                onClick={() => trackClick(uri, href)}
                className="w-full flex items-center justify-between bg-white/5 border border-white/10 rounded-xl p-4 shadow-sm hover:bg-white/10 hover:shadow transition"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-black/30 border border-white/10 flex items-center justify-center">
                    <Icon />
                  </div>
                  <span className="font-bold text-gray-100">
                    {b.label || b.url}
                  </span>
                </div>
                <span className="text-gray-400 text-xl">›</span>
              </a>
            );
          })}
        </div>
      )}

      {/* LINKS LIST */}
      <div className="px-4 mt-8 mb-12 space-y-3">
        {linksArr.map((l, idx) => {
          const href = normalizeHref(l?.url);
          if (!href) return null;

          const Icon = getIconForUrl(href);

          return (
            <a
              key={idx}
              href={href}
              target={href.startsWith("/") ? "_self" : "_blank"}
              rel="noreferrer"
              onClick={() => trackClick(uri, href)}
              className="w-full flex items-center justify-between bg-white/5 border border-white/10 rounded-xl p-4 shadow-sm hover:bg-white/10 hover:shadow transition"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-black/30 border border-white/10 flex items-center justify-center">
                  <Icon />
                </div>
                <span className="font-semibold text-gray-100">
                  {l.title || l.url}
                </span>
              </div>
              <span className="text-gray-400 text-xl">›</span>
            </a>
          );
        })}
      </div>
    </>
  );
}
