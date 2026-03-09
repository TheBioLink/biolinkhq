// src/components/TrustpilotReviewCollector.js
"use client";

import { useEffect } from "react";

export default function TrustpilotReviewCollector() {
  useEffect(() => {
    if (typeof window === "undefined") return;

    const existing = document.querySelector(
      'script[src*="widget.trustpilot.com/bootstrap/v5/tp.widget.bootstrap.min.js"]'
    );

    const loadWidget = () => {
      if (window.Trustpilot?.loadFromElement) {
        const element = document.querySelector(".trustpilot-widget");
        if (element) {
          window.Trustpilot.loadFromElement(element, true);
        }
      }
    };

    if (existing) {
      loadWidget();
      return;
    }

    const script = document.createElement("script");
    script.src =
      "https://widget.trustpilot.com/bootstrap/v5/tp.widget.bootstrap.min.js";
    script.async = true;
    script.onload = loadWidget;
    document.body.appendChild(script);
  }, []);

  return (
    <div className="mx-auto mt-16 w-full max-w-4xl rounded-2xl border border-white/10 bg-white/5 p-4 sm:p-6">
      <div className="mb-4 text-center">
        <h2 className="text-2xl font-extrabold text-white">
          Love BiolinkHQ?
        </h2>
        <p className="mt-2 text-sm text-gray-400">
          Leave us a review on Trustpilot.
        </p>
      </div>

      <div
        className="trustpilot-widget"
        data-locale="en-GB"
        data-template-id="56278e9abfbbba0bdcd568bc"
        data-businessunit-id="69af4f84cf43f35707535ac0"
        data-style-height="52px"
        data-style-width="100%"
        data-token="3d6b65fe-ddcf-4f62-bfc3-c9232d68e141"
      >
        <a
          href="https://uk.trustpilot.com/review/biolinkhq.lol"
          target="_blank"
          rel="noopener noreferrer"
        >
          Trustpilot
        </a>
      </div>
    </div>
  );
}
