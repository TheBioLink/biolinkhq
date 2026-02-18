"use client";

import { getIconForUrl } from "@/libs/linkIcons";
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
} from "@fortawesome/free-brands-svg-icons";

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

function isLegacyButton(b) {
  return b && typeof b === "object" && ("key" in b || "value" in b);
}

function normalizeHref(raw) {
  const v = (raw || "").toString().trim();
  if (!v) return "";

  // Already absolute / special schemes → keep as-is
  if (
    v.startsWith("http://") ||
    v.startsWith("https://") ||
    v.startsWith("mailto:") ||
    v.startsWith("tel:")
  ) {
    return v;
  }

  // Relative path like "/contact" → keep relative (do NOT prepend domain manually)
  if (v.startsWith("/")) return v;

  // If user typed "google.com" without scheme → make it https
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

export default function PublicLinks({ uri, buttons = [], links = [] }) {
  const buttonsArr = Array.isArray(buttons)
    ? buttons
    : buttons && typeof buttons === "object"
    ? Object.entries(buttons)
        .filter(([, v]) => v)
        .map(([key, value]) => ({ key, value }))
    : [];

  const linksArr = Array.isArray(links) ? links : [];

  return (
    <>
      {/* Buttons */}
      <div className="px-4 mt-6 space-y-3">
        {buttonsArr.map((b, idx) => {
          // New style: {label,url}
          if (b?.label && b?.url && !isLegacyButton(b)) {
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
                className="w-full flex items-center justify-center gap-2 bg-white/5 border border-white/10 rounded-xl p-4 font-bold shadow-sm hover:shadow transition"
              >
                <Icon />
                <span>{b.label}</span>
              </a>
            );
          }

          // Legacy style: {key,value}
          const key = b?.key || "link";
          const value = b?.value || b?.url || "";
          if (!value) return null;

          let href =
            key === "email"
              ? `mailto:${value}`
              : key === "phone"
              ? `tel:${value}`
              : normalizeHref(value);

          if (!href) return null;

          const icon = iconsMap[key] || faLink;

          return (
            <a
              key={idx}
              href={href}
              target={href.startsWith("/") ? "_self" : "_blank"}
              rel="noreferrer"
              onClick={() => trackClick(uri, href)}
              className="w-full flex items-center justify-center gap-2 bg-white/5 border border-white/10 rounded-xl p-4 font-bold shadow-sm hover:shadow transition"
            >
              <FontAwesomeIcon icon={icon} />
              <span className="truncate">{value}</span>
            </a>
          );
        })}
      </div>

      {/* Links */}
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
              className="w-full flex items-center justify-between bg-white/5 border border-white/10 rounded-xl p-4 shadow-sm hover:shadow transition"
            >
              <div className="flex items-center gap-3">
                <Icon />
                <span className="font-semibold">{l.title || l.url}</span>
              </div>
              <span className="text-gray-400">›</span>
            </a>
          );
        })}
      </div>
    </>
  );
}
