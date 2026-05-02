"use client";

import { useEffect, useState } from "react";

const APPLIES_OPTIONS = [
  { value: "all", label: "Everything" },
  { value: "badges", label: "Badges only" },
  { value: "all_subscriptions", label: "All subscriptions" },
  { value: "basic", label: "Basic plan only" },
  { value: "premium", label: "Premium plan only" },
  { value: "exclusive", label: "Exclusive plan only" },
];

function formatDate(value) {
  if (!value) return "Never";
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function StatusPill({ active, expired, limitReached }) {
  if (!active) return <span className="rounded-full bg-white/10 px-2 py-0.5 text-xs font-bold text-white/45">Disabled</span>;
  if (expired) return <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-xs font-bold text-amber-300">Expired</span>;
  if (limitReached) return <span className="rounded-full bg-red-500/15 px-2 py-0.5 text-xs font-bold text-red-300">Limit reached</span>;
  return <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-xs font-bold text-emerald-300">Active</span>;
}

export default function PromoCodePanel() {
  const [promos, setPromos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");
  const [expandedId, setExpandedId] = useState(null);

  // Form state
  const [code, setCode] = useState("");
  const [description, setDescription] = useState("");
  const [discountPercent, setDiscountPercent] = useState("20");
  const [appliesTo, setAppliesTo] = useState(["all"]);
  const [maxUses, setMaxUses] = useState("0");
  const [maxUsesPerUser, setMaxUsesPerUser] = useState("1");
  const [expiresAt, setExpiresAt] = useState("");

  async function load() {
    setLoading(true);
    try {
      const res = await fetch("/api/promo", { cache: "no-store" });
      const data = await res.json();
      setPromos(data.promos || []);
    } catch {
      setMsg("Failed to load promo codes");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  function toggleAppliesTo(val) {
    setAppliesTo((prev) => {
      if (val === "all") return ["all"];
      const without = prev.filter((v) => v !== "all");
      if (without.includes(val)) return without.filter((v) => v !== val) || ["all"];
      return [...without, val];
    });
  }

  async function create(e) {
    e.preventDefault();
    setMsg("");
    setSaving(true);
    try {
      const res = await fetch("/api/promo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code,
          description,
          discountPercent: Number(discountPercent),
          appliesTo,
          maxUses: Number(maxUses),
          maxUsesPerUser: Number(maxUsesPerUser),
          expiresAt: expiresAt || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setMsg(data.error || "Failed to create"); return; }
      setMsg(`Promo code "${data.promo.code}" created!`);
      setCode(""); setDescription(""); setDiscountPercent("20");
      setAppliesTo(["all"]); setMaxUses("0"); setMaxUsesPerUser("1"); setExpiresAt("");
      await load();
    } catch { setMsg("Network error"); }
    finally { setSaving(false); }
  }

  async function patchPromo(id, action, extra = {}) {
    setMsg("");
    const res = await fetch("/api/promo", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, action, ...extra }),
    });
    const data = await res.json();
    if (!res.ok) { setMsg(data.error || "Action failed"); return; }
    await load();
  }

  return (
    <section className="space-y-6">
      {/* Create form */}
      <div className="overflow-hidden rounded-3xl border border-purple-500/20 bg-purple-500/5">
        <div className="border-b border-white/10 p-5">
          <div className="text-xs font-black uppercase tracking-[0.2em] text-purple-300/80">Promo Codes</div>
          <h2 className="mt-2 text-2xl font-black">Create a promo code</h2>
          <p className="mt-1 text-sm text-white/50">Apply discounts to badges or subscription plans.</p>
        </div>

        <form onSubmit={create} className="grid gap-4 p-5 md:grid-cols-2">
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-[0.15em] text-white/50">Code</label>
            <input
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9_-]/g, ""))}
              placeholder="SUMMER20"
              maxLength={24}
              className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 font-mono font-bold text-white outline-none focus:border-purple-400/60"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-[0.15em] text-white/50">Discount %</label>
            <div className="relative">
              <input
                type="number"
                min="1" max="99"
                value={discountPercent}
                onChange={(e) => setDiscountPercent(e.target.value)}
                className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none focus:border-purple-400/60"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-white/40">%</span>
            </div>
          </div>

          <div className="space-y-2 md:col-span-2">
            <label className="text-xs font-bold uppercase tracking-[0.15em] text-white/50">Description (optional)</label>
            <input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Summer sale 2025"
              className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none focus:border-purple-400/60"
            />
          </div>

          <div className="space-y-2 md:col-span-2">
            <label className="text-xs font-bold uppercase tracking-[0.15em] text-white/50">Applies to</label>
            <div className="flex flex-wrap gap-2">
              {APPLIES_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => toggleAppliesTo(opt.value)}
                  className={`rounded-xl px-3 py-2 text-xs font-bold transition ${
                    appliesTo.includes(opt.value)
                      ? "bg-purple-600 text-white"
                      : "border border-white/10 bg-white/5 text-white/60 hover:bg-white/10"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-[0.15em] text-white/50">Max total uses</label>
            <input
              type="number" min="0"
              value={maxUses}
              onChange={(e) => setMaxUses(e.target.value)}
              className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none focus:border-purple-400/60"
            />
            <p className="text-xs text-white/30">0 = unlimited</p>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-[0.15em] text-white/50">Max uses per user</label>
            <input
              type="number" min="1"
              value={maxUsesPerUser}
              onChange={(e) => setMaxUsesPerUser(e.target.value)}
              className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none focus:border-purple-400/60"
            />
          </div>

          <div className="space-y-2 md:col-span-2">
            <label className="text-xs font-bold uppercase tracking-[0.15em] text-white/50">Expires at (optional)</label>
            <input
              type="datetime-local"
              value={expiresAt}
              onChange={(e) => setExpiresAt(e.target.value)}
              className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none focus:border-purple-400/60"
            />
          </div>

          {msg && (
            <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white/70 md:col-span-2">
              {msg}
            </div>
          )}

          <button
            type="submit"
            disabled={saving || !code || !discountPercent}
            className="rounded-2xl bg-purple-600 px-5 py-3 text-sm font-black text-white hover:bg-purple-500 disabled:cursor-not-allowed disabled:opacity-50 md:col-span-2"
          >
            {saving ? "Creating..." : "Create promo code"}
          </button>
        </form>
      </div>

      {/* Promo list */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-black">All promo codes</h3>
          <button onClick={load} className="text-sm text-purple-400 hover:text-purple-300 underline">Refresh</button>
        </div>

        {loading && (
          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 text-white/40">Loading...</div>
        )}

        {!loading && promos.length === 0 && (
          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 text-white/40">No promo codes yet.</div>
        )}

        {promos.map((promo) => {
          const expired = promo.expiresAt && new Date(promo.expiresAt) < new Date();
          const limitReached = promo.maxUses > 0 && promo.usedCount >= promo.maxUses;
          const isExpanded = expandedId === String(promo._id);

          return (
            <div key={promo._id} className="overflow-hidden rounded-3xl border border-white/10 bg-[#101827]">
              <div className="flex flex-wrap items-center justify-between gap-3 p-5">
                <div className="flex items-center gap-4">
                  <div className="rounded-2xl border border-purple-500/20 bg-purple-500/10 px-4 py-2">
                    <span className="font-mono text-lg font-black text-purple-200">{promo.code}</span>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-2xl font-black text-white">{promo.discountPercent}% off</span>
                      <StatusPill active={promo.active} expired={expired} limitReached={limitReached} />
                    </div>
                    <div className="mt-1 text-xs text-white/40">
                      {promo.description || "No description"} •{" "}
                      {promo.maxUses > 0 ? `${promo.usedCount}/${promo.maxUses} uses` : `${promo.usedCount} uses`} •{" "}
                      Expires: {formatDate(promo.expiresAt)}
                    </div>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {promo.appliesTo.map((a) => (
                        <span key={a} className="rounded-full bg-white/10 px-2 py-0.5 text-xs text-white/50">
                          {APPLIES_OPTIONS.find((o) => o.value === a)?.label || a}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => setExpandedId(isExpanded ? null : String(promo._id))}
                    className="rounded-xl bg-white/10 px-3 py-2 text-xs font-bold text-white/70 hover:bg-white/15"
                  >
                    {isExpanded ? "Hide" : "Details"}
                  </button>
                  <button
                    onClick={() => patchPromo(promo._id, "toggle")}
                    className={`rounded-xl px-3 py-2 text-xs font-bold transition ${promo.active ? "bg-amber-500/15 text-amber-200 hover:bg-amber-500/25" : "bg-emerald-500/15 text-emerald-200 hover:bg-emerald-500/25"}`}
                  >
                    {promo.active ? "Disable" : "Enable"}
                  </button>
                  <button
                    onClick={() => { if (confirm(`Delete promo code "${promo.code}"?`)) patchPromo(promo._id, "delete"); }}
                    className="rounded-xl bg-red-500/15 px-3 py-2 text-xs font-bold text-red-200 hover:bg-red-500/25"
                  >
                    Delete
                  </button>
                </div>
              </div>

              {isExpanded && (
                <div className="border-t border-white/10 bg-black/20 p-5">
                  <h4 className="mb-3 text-sm font-black text-white/60 uppercase tracking-[0.15em]">Usage history ({promo.usages?.length || 0})</h4>
                  {promo.usages?.length === 0 ? (
                    <p className="text-sm text-white/30">No usages yet.</p>
                  ) : (
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {promo.usages.map((u, i) => (
                        <div key={i} className="flex items-center justify-between rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-xs">
                          <span className="text-white/70">{u.userEmail}</span>
                          <span className="text-white/40">{u.appliedTo || "—"}</span>
                          <span className="text-white/40">{formatDate(u.usedAt)}</span>
                          {u.discountAmount > 0 && <span className="text-emerald-300">-£{(u.discountAmount / 100).toFixed(2)}</span>}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
