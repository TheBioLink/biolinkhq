// src/components/dashboard/CreditsCard.js
"use client";

import { useEffect, useState } from "react";

export default function CreditsCard() {
  const [credits, setCredits] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadCredits() {
      try {
        const res = await fetch("/api/credits/me", {
          cache: "no-store",
        });
        const data = await res.json();

        if (res.ok) {
          setCredits(Number(data?.credits || 0));
        }
      } catch {
      } finally {
        setLoading(false);
      }
    }

    loadCredits();
  }, []);

  return (
    <section className="rounded-2xl border border-blue-500/20 bg-gradient-to-b from-blue-500/10 to-white/5 p-8">
      <div className="mb-2 inline-flex rounded-full border border-blue-400/20 bg-blue-500/10 px-3 py-1 text-xs font-extrabold uppercase tracking-[0.22em] text-blue-300">
        Credits
      </div>

      <h2 className="text-2xl font-black text-white">Your site credits</h2>
      <p className="mt-2 text-sm text-white/65">
        You can use credits on supported BiolinkHQ upgrades and features.
      </p>

      <div className="mt-6 rounded-2xl border border-white/10 bg-black/20 p-5">
        <div className="text-xs font-bold uppercase tracking-[0.18em] text-white/45">
          Available balance
        </div>
        <div className="mt-2 text-4xl font-black text-white">
          {loading ? "..." : credits}
        </div>
      </div>
    </section>
  );
}
