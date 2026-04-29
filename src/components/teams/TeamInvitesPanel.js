"use client";

import { useEffect, useState } from "react";

export default function TeamInvitesPanel() {
  const [invites, setInvites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState("");

  async function loadInvites() {
    setLoading(true);
    try {
      const res = await fetch("/api/team-invite", { cache: "no-store" });
      const data = await res.json();
      setInvites(data?.invites || []);
    } catch {
      setMsg("Failed to load team invites.");
    } finally {
      setLoading(false);
    }
  }

  async function respond(inviteId, action) {
    setMsg("");

    try {
      const res = await fetch("/api/team-invite", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ inviteId, action }),
      });

      const data = await res.json();

      if (!res.ok) {
        setMsg(data?.error || "Failed to respond to invite.");
        return;
      }

      setMsg(action === "accept" ? "Invite accepted. You are now verified as a player." : "Invite declined.");
      await loadInvites();
    } catch {
      setMsg("Network error.");
    }
  }

  useEffect(() => {
    loadInvites();
  }, []);

  if (loading) {
    return (
      <section className="rounded-2xl border border-white/10 bg-white/5 p-8">
        <h2 className="text-xl font-extrabold">Team Invites</h2>
        <p className="mt-2 text-sm text-white/45">Checking for team invites...</p>
      </section>
    );
  }

  if (!invites.length && !msg) return null;

  return (
    <section className="rounded-2xl border border-blue-500/20 bg-blue-500/5 p-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-blue-300">Team Invites</h2>
          <p className="mt-2 text-sm text-white/55">
            Teams can only list you as a verified player after you accept their invite.
          </p>
        </div>
        <button
          type="button"
          onClick={loadInvites}
          className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-bold text-white/70 hover:bg-white/10"
        >
          Refresh
        </button>
      </div>

      {msg && (
        <div className="mt-4 rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white/70">
          {msg}
        </div>
      )}

      <div className="mt-5 space-y-3">
        {invites.map((invite) => (
          <div key={invite._id} className="rounded-2xl border border-white/10 bg-black/25 p-4">
            <div className="flex items-center gap-3">
              {invite.teamLogo ? (
                <img src={invite.teamLogo} alt={invite.teamName} className="h-11 w-11 rounded-xl object-contain" />
              ) : (
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-500/20 text-sm font-black text-blue-200">
                  {(invite.teamName || invite.teamUri || "T").slice(0, 1).toUpperCase()}
                </div>
              )}

              <div className="min-w-0 flex-1">
                <div className="font-black text-white">
                  {invite.teamName || invite.teamUri} invited you as {invite.role || "Player"}
                </div>
                <div className="text-xs text-white/45">
                  Accepting will add you to their public Players tab and give your profile their team badge.
                </div>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => respond(invite._id, "accept")}
                className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-black text-white hover:bg-blue-500"
              >
                Accept
              </button>
              <button
                type="button"
                onClick={() => respond(invite._id, "decline")}
                className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-black text-white/70 hover:bg-white/10"
              >
                Decline
              </button>
            </div>
          </div>
        ))}

        {!invites.length && msg && (
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 text-sm text-white/45">
            No pending team invites.
          </div>
        )}
      </div>
    </section>
  );
}
