"use client";

import { getIconForUrl } from "@/libs/linkIcons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faLink } from "@fortawesome/free-solid-svg-icons";

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

export default function PublicLinks({ uri, buttons = [], links = [] }) {
  const buttonsArr = Array.isArray(buttons) ? buttons : [];
  const linksArr = Array.isArray(links) ? links : [];

  return (
    <>
      {/* ✅ BUTTONS (distinct style) */}
      {buttonsArr.length > 0 && (
        <div className="px-4 mt-6 space-y-3">
          {buttonsArr.map((b, idx) => {
            const href = normalizeHref(b?.url);
            if (!href) return null;

            const Icon = getIconForUrl(href);

            return (
              <a
                key={idx}
                href={href}
                target={href.startsWith("/") ? "_self" : "_blank"}
                rel="noreferrer"
                onClick={() => trackClick(uri, href)}
                className="w-full flex items-center justify-center gap-3 rounded-2xl px-5 py-4
                           bg-blue-600 hover:bg-blue-500 text-white font-extrabold
                           shadow-lg shadow-blue-500/10 transition"
              >
                <Icon />
                <span className="truncate">{b.label || "Open"}</span>
              </a>
            );
          })}
        </div>
      )}

      {/* ✅ LINKS (card style, different from buttons) */}
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
                className="w-full flex items-center justify-between bg-white/5 border border-white/10
                           rounded-xl p-4 hover:bg-white/10 transition"
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

      {/* If no icons match */}
      {buttonsArr.length === 0 && linksArr.length === 0 && (
        <div className="px-4 mt-8 text-center text-gray-400">
          <FontAwesomeIcon icon={faLink} className="mr-2" />
          No links added yet.
        </div>
      )}
    </>
  );
}
