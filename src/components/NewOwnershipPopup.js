// src/components/NewOwnershipPopup.js
"use client";

import { useEffect, useMemo, useState } from "react";

const STORAGE_KEY = "biolinkhq_new_ownership_popup_closed_v1";
const HIDE_AFTER = new Date("2026-03-21T23:59:59.999Z").getTime();

export default function NewOwnershipPopup() {
  const [ready, setReady] = useState(false);
  const [open, setOpen] = useState(false);

  const expired = useMemo(() => Date.now() > HIDE_AFTER, []);

  useEffect(() => {
    if (expired) {
      setReady(true);
      setOpen(false);
      return;
    }

    const closed = localStorage.getItem(STORAGE_KEY) === "true";
    setOpen(!closed);
    setReady(true);
  }, [expired]);

  function closePopup() {
    localStorage.setItem(STORAGE_KEY, "true");
    setOpen(false);
  }

  if (!ready || expired || !open) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Close popup backdrop"
        onClick={closePopup}
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
      />

      <div className="relative w-full max-w-xl rounded-3xl border border-white/10 bg-[#0b1220] p-6 shadow-[0_25px_80px_rgba(0,0,0,0.55)]">
        <button
          type="button"
          onClick={closePopup}
          aria-label="Close popup"
          className="absolute right-4 top-4 inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-xl text-white transition hover:bg-white/10"
        >
          ×
        </button>

        <div className="mb-3 inline-flex rounded-full border border-blue-400/20 bg-blue-500/10 px-3 py-1 text-xs font-extrabold uppercase tracking-[0.22em] text-blue-300">
          Announcement
        </div>

        <h2 className="text-3xl font-black text-white">
          BiolinkHQ is under new ownership
        </h2>

        <p className="mt-4 text-sm leading-7 text-gray-300 sm:text-base">
          BiolinkHQ is now under new ownership and active development. We have
          already started shipping improvements across the platform, including
          profile sharing, upload and dashboard fixes, visual polish, and
          stability updates.
        </p>

        <p className="mt-4 text-sm leading-7 text-gray-300 sm:text-base">
          This is only the beginning. More improvements, performance upgrades,
          and new features are on the way as we continue building the best
          modern link-in-bio experience possible.
        </p>

        <div className="mt-6 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={closePopup}
            className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-extrabold text-white transition hover:bg-blue-500"
          >
            Got it
          </button>

          <a
            href="/account"
            className="rounded-xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-bold text-white transition hover:bg-white/10"
          >
            Open dashboard
          </a>
        </div>
      </div>
    </div>
  );
}
