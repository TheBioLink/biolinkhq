// src/components/analytics/ProfileAnalyticsTracker.js
"use client";

import { useEffect } from "react";
import { trackProfileEvent } from "@/lib/trackProfileEvent";

export default function ProfileAnalyticsTracker({ uri }) {
  useEffect(() => {
    if (!uri) return;

    trackProfileEvent(uri, "page_view");

    function onClick(event) {
      const anchor = event.target.closest("a[href]");
      if (!anchor) return;

      const href = anchor.getAttribute("href") || "";
      if (!href) return;

      const isExternal =
        href.startsWith("http://") ||
        href.startsWith("https://") ||
        href.startsWith("mailto:") ||
        href.startsWith("tel:");

      if (!isExternal) return;

      trackProfileEvent(uri, "outbound_click", href);
    }

    document.addEventListener("click", onClick);

    return () => {
      document.removeEventListener("click", onClick);
    };
  }, [uri]);

  return null;
}
