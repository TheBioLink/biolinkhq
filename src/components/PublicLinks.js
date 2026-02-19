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

  if (
    v.startsWith("http://") ||
    v.startsWith("https://") ||
    v.startsWith("mailto:") ||
    v.startsWith("tel:")
  ) {
    return v;
  }

  if (v.startsWith("/")) return v;

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

function iconFromLabelOrUrl(label, href) {
  const l = (label || "").toLowerCase();
  const u = href.toLowerCase();

  if (l.includes("instagram") || u.includes("instagram.com")) return faInstagram;
  if (l.includes("tiktok") || u.includes("tiktok.com")) return faTiktok;
  if (l.includes("youtube") || u.includes("youtube.com") || u.includes("youtu.be")) return faYoutube;
  if (l === "x" || l.includes("twitter") || u.includes("twitter.com") || u.includes("x.com")) return faTwitter;
  if (l.includes("facebook") || u.includes("facebook.com")) return faFacebook;
  if (l.includes("linkedin") || u.includes("linkedin.com")) return faLinkedin;
  if (l.includes("github") || u.includes("github.com")) return faGithub;
  if (l.includes("discord") || u.includes("discord.gg") || u.includes("discord.com")) return faDiscord;
  if (l.includes("email") || href.startsWith("mailto:")) return faEnvelope;
  if (l.includes("phone") || href.startsWith("tel:")) return faPhone;
  if (l.includes("site") || l.includes("website")) return faGlobe;

  return faLink;
}

export default function PublicLinks({ uri, buttons = {}, links = [] }) {
  const linksArr = Array.isArray(links) ? links : [];

  // Handle object buttons
  const objectButtons =
    buttons &&
    typeof buttons === "object" &&
    !Array.isArray(buttons)
      ? Object.entries(buttons)
          .map(([key, value]) => ({ key, value }))
          .filter((b) => b.value && b.value.toString().trim().length > 0)
          .map((b) => {
            const raw = b.value.toString().trim();
            const href =
              b.key === "email"
                ? `mailto:${raw}`
                : b.key === "phone"
                ? `tel:${raw}`
                : normalizeHref(raw);

            const meta = BUTTON_META[b.key] || {
              label: b.key,
              icon: faLink,
            };

            return { label: meta.label, href, icon: meta.icon };
          })
      : [];

  // Handle array buttons
  const arrayButtons = Array.isArray(buttons)
    ? buttons
        .map((b) => {
          const href = normalizeHref(b?.url);
          if (!href) return null;
          return {
            label: b?.label || "Link",
            href,
            icon: iconFromLabelOrUrl(b?.label, href),
          };
        })
        .filter(Boolean)
    : [];

  // Merge + dedupe
  const seen = new Set();
  const iconButtons = [...objectButtons, ...arrayButtons].filter((b) => {
    if (seen.has(b.href)) return false;
    seen.add(b.href);
    return true;
  });

  return (
    <>
      {/* 🔥 Smaller Circle Buttons */}
      {iconButtons.length > 0 && (
        <div className="mt-5 flex flex-wrap justify-center gap-3 px-4">
          {iconButtons.map((b, idx) => (
            <a
              key={`${b.href}-${idx}`}
              href={b.href}
              target={b.href.startsWith("/") ? "_self" : "_blank"}
              rel="noreferrer"
              onClick={() => trackClick(uri, b.href)}
              aria-label={b.label}
              title={b.label}
              className="
                w-12 h-12 rounded-full
                bg-white/5 border border-white/20
                flex items-center justify-center
                hover:bg-white/10 hover:border-white/30
                transition
              "
            >
              <span className="text-lg text-gray-100">
                <FontAwesomeIcon icon={b.icon} />
              </span>
            </a>
          ))}
        </div>
      )}

      {/* Links List */}
      {linksArr.length > 0 && (
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
                className="w-full flex items-center justify-between bg-white/5 border border-white/10 rounded-xl p-4 shadow-sm hover:bg-white/10 transition"
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
      )}

      {iconButtons.length === 0 && linksArr.length === 0 && (
        <div className="px-4 mt-8 text-center text-gray-400">
          No links added yet.
        </div>
      )}
    </>
  );
}
