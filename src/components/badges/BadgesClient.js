// partial update inside component

// add inside main return before admin panel
{!data.isAdmin && (
  <section className="rounded-3xl border border-white/10 bg-[#101827] p-5">
    <h2 className="text-xl font-black">Custom badges</h2>
    <p className="text-sm text-white/50 mt-1">
      Create your own custom badges. £1.50 gives you 3.
    </p>

    <div className="mt-4 flex items-center gap-3">
      <div className="text-sm font-bold text-white/70">
        Credits: {data.customBadgeCredits || 0}
      </div>

      <button
        onClick={async () => {
          const res = await fetch("/api/stripe/create-badge-session", { method: "POST" });
          const d = await res.json();
          if (d.url) window.location.href = d.url;
        }}
        className="rounded-xl bg-emerald-500 px-4 py-2 text-sm font-bold text-white hover:bg-emerald-400"
      >
        Buy 3 (£1.50)
      </button>
    </div>
  </section>
)

// modify createBadge body
body: JSON.stringify({
  name,
  type,
  assignTo,
  iconBase64,
  claimLimit: claimLimit ? Number(claimLimit) : 0,
  claimEndsAt: claimEndsAt || null,
  isCustom: !data.isAdmin
}),
