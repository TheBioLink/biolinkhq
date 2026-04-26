"use client";

import { useEffect, useMemo, useState } from "react";

function toBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function formatDate(value) {
  if (!value) return "No expiry";
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export default function BadgesClient() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [buying, setBuying] = useState(false);

  const [name, setName] = useState("");
  const [type, setType] = useState("public");
  const [assignTo, setAssignTo] = useState("");
  const [claimLimit, setClaimLimit] = useState("");
  const [claimEndsAt, setClaimEndsAt] = useState("");
  const [iconBase64, setIconBase64] = useState("");

  const [manageUser, setManageUser] = useState({});

  async function load() {
    setError("");
    const res = await fetch("/api/badges", { cache: "no-store" });
    const d = await res.json();
    if (!res.ok) setError(d?.error || "Failed to load badges");
    setData(d);
  }

  async function buyCustomBadges() {
    setBuying(true);
    setError("");
    try {
      const res = await fetch("/api/stripe/create-badge-session", { method: "POST" });
      const d = await res.json();
      if (!res.ok) {
        setError(d?.error || "Failed to start checkout");
        return;
      }
      if (d.url) window.location.href = d.url;
    } catch {
      setError("Failed to start checkout");
    } finally {
      setBuying(false);
    }
  }

  async function createBadge() {
    setSaving(true);
    setError("");

    const res = await fetch("/api/badges", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        type,
        assignTo,
        iconBase64,
        claimLimit: claimLimit ? Number(claimLimit) : 0,
        claimEndsAt: claimEndsAt || null,
        isCustom: !data?.isAdmin,
      }),
    });

    const body = await res.json();
    if (!res.ok) setError(body?.error || "Failed to create badge");

    if (res.ok) {
      setName("");
      setType("public");
      setAssignTo("");
      setClaimLimit("");
      setClaimEndsAt("");
      setIconBase64("");
      await load();
    }

    setSaving(false);
  }

  async function patchBadge(payload) {
    setError("");
    const res = await fetch("/api/badges", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const body = await res.json();
    if (!res.ok) setError(body?.error || "Badge action failed");
    await load();
  }

  async function handleIconUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setIconBase64(await toBase64(file));
  }

  useEffect(() => {
    load();
  }, []);

  const ownedIds = useMemo(() => {
    return new Set((data?.myBadges || []).map((x) => String(x.badgeId)));
  }, [data]);

  if (!data) {
    return (
      <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-8 text-white/50">
        Loading badges...
      </div>
    );
  }

  const isAdmin = Boolean(data.isAdmin);
  const credits = Number(data.customBadgeCredits || 0);

  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-sm font-bold text-red-200">
          {error}
        </div>
      )}

      {!isAdmin && (
        <section className="overflow-hidden rounded-3xl border border-white/10 bg-[#101827] shadow-2xl">
          <div className="border-b border-white/10 bg-white/[0.03] p-5">
            <div className="text-xs font-black uppercase tracking-[0.2em] text-emerald-300/80">
              Custom badges
            </div>
            <h2 className="mt-2 text-2xl font-black">Make your own badges</h2>
            <p className="mt-2 text-sm text-white/50">
              Pay £1.50 to unlock 3 custom badge credits, your credits appear here.
            </p>
          </div>

          <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="rounded-2xl border border-white/10 bg-black/20 px-5 py-4">
              <div className="text-xs font-bold uppercase tracking-[0.16em] text-white/35">Available credits</div>
              <div className="mt-1 text-3xl font-black">{credits}</div>
            </div>

            <button
              onClick={buyCustomBadges}
              disabled={buying}
              className="rounded-2xl bg-emerald-500 px-5 py-3 text-sm font-black text-white hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {buying ? "Opening Stripe..." : "Buy 3 custom badges for £1.50"}
            </button>
          </div>
        </section>
      )}

      {(isAdmin || credits > 0) && (
        <section className="overflow-hidden rounded-3xl border border-white/10 bg-[#101827] shadow-2xl">
          <div className="border-b border-white/10 bg-white/[0.03] p-5">
            <div className="text-xs font-black uppercase tracking-[0.2em] text-blue-300/80">
              {isAdmin ? "Admin badge control" : "Custom badge creator"}
            </div>
            <h2 className="mt-2 text-2xl font-black">
              {isAdmin ? "Create a badge" : "Create your custom badge"}
            </h2>
            <p className="mt-2 text-sm text-white/50">
              {isAdmin
                ? "Upload an icon, choose public or private, add claim limits, and optionally assign private badges to a user."
                : "Each custom badge costs 1 credit and is automatically added to your profile."}
            </p>
          </div>

          <div className="grid gap-5 p-5 lg:grid-cols-[220px_1fr]">
            <div className="rounded-3xl border border-white/10 bg-black/20 p-4 text-center">
              <div className="mx-auto flex h-28 w-28 items-center justify-center overflow-hidden rounded-3xl border border-white/10 bg-white/[0.04]">
                {iconBase64 ? (
                  <img src={iconBase64} alt="Badge preview" className="h-full w-full object-cover" />
                ) : (
                  <span className="text-sm text-white/35">Icon preview</span>
                )}
              </div>
              <label className="mt-4 block cursor-pointer rounded-2xl bg-white/10 px-4 py-3 text-sm font-bold text-white/80 hover:bg-white/15">
                Upload icon
                <input type="file" accept="image/*" onChange={handleIconUpload} className="hidden" />
              </label>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="space-y-2">
                <span className="text-sm font-bold text-white/70">Badge name</span>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Founder, Staff, Verified..."
                  className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 outline-none focus:border-blue-400/60"
                />
              </label>

              {isAdmin && (
                <label className="space-y-2">
                  <span className="text-sm font-bold text-white/70">Badge type</span>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                    className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 outline-none focus:border-blue-400/60"
                  >
                    <option value="public">Public claimable</option>
                    <option value="private">Private/admin assigned</option>
                  </select>
                </label>
              )}

              {isAdmin && (
                <>
                  <label className="space-y-2">
                    <span className="text-sm font-bold text-white/70">Claim limit</span>
                    <input
                      value={claimLimit}
                      onChange={(e) => setClaimLimit(e.target.value.replace(/[^0-9]/g, ""))}
                      placeholder="0 = unlimited"
                      className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 outline-none focus:border-blue-400/60"
                    />
                  </label>

                  <label className="space-y-2">
                    <span className="text-sm font-bold text-white/70">Claimable until</span>
                    <input
                      type="datetime-local"
                      value={claimEndsAt}
                      onChange={(e) => setClaimEndsAt(e.target.value)}
                      className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 outline-none focus:border-blue-400/60"
                    />
                  </label>
                </>
              )}

              {isAdmin && type === "private" && (
                <label className="space-y-2 md:col-span-2">
                  <span className="text-sm font-bold text-white/70">Assign to username</span>
                  <input
                    value={assignTo}
                    onChange={(e) => setAssignTo(e.target.value)}
                    placeholder="itsnicbtw"
                    className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 outline-none focus:border-blue-400/60"
                  />
                </label>
              )}

              <button
                onClick={createBadge}
                disabled={saving || name.trim().length < 2 || (!isAdmin && !iconBase64)}
                className="rounded-2xl bg-blue-600 px-5 py-3 text-sm font-black text-white hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50 md:col-span-2"
              >
                {saving ? "Creating..." : isAdmin ? "Create badge" : "Use 1 credit and create badge"}
              </button>
            </div>
          </div>
        </section>
      )}

      <section className="space-y-4">
        <div className="flex items-end justify-between gap-3">
          <div>
            <h2 className="text-2xl font-black">Badge library</h2>
            <p className="mt-1 text-sm text-white/45">Claim public badges or manage assigned ones.</p>
          </div>
          <div className="rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-xs font-bold text-white/50">
            {data.badges?.length || 0} badges
          </div>
        </div>

        {!data.badges?.length && (
          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-8 text-center text-white/45">
            No badges yet.
          </div>
        )}

        <div className="grid gap-4 lg:grid-cols-2">
          {data.badges?.map((badge) => {
            const owned = ownedIds.has(String(badge._id));
            const ownedRecord = data.myBadges?.find((x) => String(x.badgeId) === String(badge._id));
            const expired = badge.claimEndsAt && new Date(badge.claimEndsAt) < new Date();
            const limitedOut = badge.claimLimit && badge.claimCount >= badge.claimLimit;

            return (
              <article key={badge._id} className="rounded-3xl border border-white/10 bg-[#101827] p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex min-w-0 items-center gap-4">
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04]">
                      {badge.icon ? (
                        <img src={badge.icon} alt={badge.name} className="h-full w-full object-cover" />
                      ) : (
                        <span className="text-lg font-black">{badge.name?.slice(0, 1) || "?"}</span>
                      )}
                    </div>
                    <div className="min-w-0">
                      <h3 className="truncate text-lg font-black">{badge.name}</h3>
                      <div className="mt-1 flex flex-wrap gap-2 text-xs font-bold text-white/45">
                        <span className="rounded-full bg-white/10 px-2 py-1">{badge.type}</span>
                        <span className="rounded-full bg-white/10 px-2 py-1">
                          {badge.claimLimit ? `${badge.claimCount}/${badge.claimLimit} claimed` : `${badge.claimCount || 0} claimed`}
                        </span>
                        <span className="rounded-full bg-white/10 px-2 py-1">{formatDate(badge.claimEndsAt)}</span>
                      </div>
                    </div>
                  </div>

                  {owned ? (
                    <button
                      onClick={() => patchBadge({ action: "toggle", badgeId: badge._id })}
                      className="rounded-xl bg-white/10 px-3 py-2 text-xs font-bold text-white/70 hover:bg-white/15"
                    >
                      {ownedRecord?.visible ? "Hide" : "Show"}
                    </button>
                  ) : badge.type === "public" ? (
                    <button
                      disabled={expired || limitedOut}
                      onClick={() => patchBadge({ action: "claim", badgeId: badge._id })}
                      className="rounded-xl bg-blue-600 px-3 py-2 text-xs font-bold text-white hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      {expired ? "Expired" : limitedOut ? "Limit reached" : "Claim"}
                    </button>
                  ) : (
                    <span className="rounded-xl bg-white/10 px-3 py-2 text-xs font-bold text-white/45">Private</span>
                  )}
                </div>

                {isAdmin && (
                  <div className="mt-5 rounded-2xl border border-white/10 bg-black/20 p-3">
                    <div className="mb-2 text-xs font-black uppercase tracking-[0.16em] text-white/35">Admin manage</div>
                    <div className="flex flex-col gap-2 sm:flex-row">
                      <input
                        value={manageUser[badge._id] || ""}
                        onChange={(e) => setManageUser((prev) => ({ ...prev, [badge._id]: e.target.value }))}
                        placeholder="username"
                        className="min-w-0 flex-1 rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm outline-none focus:border-blue-400/60"
                      />
                      <button
                        onClick={() => patchBadge({ action: "assign", badgeId: badge._id, username: manageUser[badge._id] })}
                        className="rounded-xl bg-emerald-500/15 px-3 py-2 text-xs font-bold text-emerald-200 hover:bg-emerald-500/25"
                      >
                        Give
                      </button>
                      <button
                        onClick={() => patchBadge({ action: "remove", badgeId: badge._id, username: manageUser[badge._id] })}
                        className="rounded-xl bg-yellow-500/15 px-3 py-2 text-xs font-bold text-yellow-200 hover:bg-yellow-500/25"
                      >
                        Remove
                      </button>
                      <button
                        onClick={() => patchBadge({ action: "deactivate", badgeId: badge._id })}
                        className="rounded-xl bg-red-500/15 px-3 py-2 text-xs font-bold text-red-200 hover:bg-red-500/25"
                      >
                        Disable
                      </button>
                    </div>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      </section>
    </div>
  );
}
