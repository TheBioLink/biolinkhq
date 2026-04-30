"use client";

import { useState } from "react";

function cleanBioLink(value) {
  const raw = String(value || "").trim();
  const withoutOrigin = raw
    .replace(/^https?:\/\/(www\.)?biolinkhq\.lol\//i, "")
    .replace(/^biolinkhq\.lol\//i, "")
    .replace(/^\//, "");

  return withoutOrigin.toLowerCase().replace(/[^a-z0-9_-]/g, "").slice(0, 24);
}

export default function TeamProfileForm({ team }) {
  const [tagline, setTagline] = useState(team?.tagline || "");
  const [description, setDescription] = useState(team?.description || "");
  const [game, setGame] = useState(team?.game || "");
  const [region, setRegion] = useState(team?.region || "");
  const [recruiting, setRecruiting] = useState(Boolean(team?.recruiting));
  const [members, setMembers] = useState(Array.isArray(team?.members) ? team.members : []);
  const [inviteUri, setInviteUri] = useState("");
  const [inviteRole, setInviteRole] = useState("Player");
  const [inviteMsg, setInviteMsg] = useState("");
  const [sendingInvite, setSendingInvite] = useState(false);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  function addMember() {
    setMembers((prev) => [...prev, { username: "", role: "", profileUri: "", profileUrl: "" }]);
  }

  function updateMember(index, key, value) {
    setMembers((prev) => {
      const copy = [...prev];
      copy[index] = { ...(copy[index] || {}), [key]: value };

      if (key === "profileUri") {
        const uri = cleanBioLink(value);
        copy[index].profileUri = uri;
        copy[index].profileUrl = uri ? `/${uri}` : "";
      }

      return copy;
    });
  }

  function removeMember(index) {
    setMembers((prev) => prev.filter((_, i) => i !== index));
  }

  async function sendInvite() {
    const targetUri = cleanBioLink(inviteUri);
    setInviteMsg("");

    if (!targetUri) {
      setInviteMsg("Enter the player's BiolinkHQ username or profile link.");
      return;
    }

    setSendingInvite(true);

    try {
      const res = await fetch("/api/team-invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetUri, role: inviteRole }),
      });

      const data = await res.json();

      if (!res.ok) {
        setInviteMsg(data?.error || "Failed to send invite");
        return;
      }

      setInviteMsg(`Invite sent to /${targetUri}. They must accept it from their dashboard.`);
      setInviteUri("");
      setInviteRole("Player");
    } catch {
      setInviteMsg("Network error");
    } finally {
      setSendingInvite(false);
    }
  }

  async function saveTeam() {
    setSaving(true);
    setMsg("");

    try {
      const res = await fetch("/api/team-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tagline,
          description,
          game,
          region,
          recruiting,
          members,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setMsg(data?.error || "Failed to save team profile");
        return;
      }

      setMsg("Team profile saved.");
    } catch {
      setMsg("Network error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        <label className="space-y-2">
          <span className="text-sm font-bold text-white/70">Team tagline</span>
          <input value={tagline} onChange={(e) => setTagline(e.target.value)} placeholder="Elite esports organisation" className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none focus:border-blue-400/60" />
        </label>

        <label className="space-y-2">
          <span className="text-sm font-bold text-white/70">Main game</span>
          <input value={game} onChange={(e) => setGame(e.target.value)} placeholder="Fortnite, Valorant, Rocket League..." className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none focus:border-blue-400/60" />
        </label>

        <label className="space-y-2">
          <span className="text-sm font-bold text-white/70">Region</span>
          <input value={region} onChange={(e) => setRegion(e.target.value)} placeholder="EU, UK, NA..." className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none focus:border-blue-400/60" />
        </label>

        <label className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/30 px-4 py-3">
          <input type="checkbox" checked={recruiting} onChange={(e) => setRecruiting(e.target.checked)} />
          <span className="text-sm font-bold text-white/70">Currently recruiting</span>
        </label>
      </div>

      <label className="space-y-2 block">
        <span className="text-sm font-bold text-white/70">Team description</span>
        <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={4} placeholder="Explain what the team is, what you do, achievements, recruitment info, or content focus." className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none focus:border-blue-400/60" />
      </label>

      <div className="rounded-3xl border border-blue-500/20 bg-blue-500/5 p-4">
        <h3 className="text-lg font-black text-blue-300">Invite verified player</h3>
        <p className="mt-1 text-sm text-white/45">Add their BiolinkHQ username or full profile link. They only appear as verified after accepting from their own dashboard.</p>

        <div className="mt-4 grid gap-2 sm:grid-cols-[1fr_180px_auto]">
          <input
            value={inviteUri}
            onChange={(e) => setInviteUri(e.target.value)}
            placeholder="biolinkhq.lol/player or player"
            className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-white outline-none"
          />
          <input
            value={inviteRole}
            onChange={(e) => setInviteRole(e.target.value)}
            placeholder="Player role"
            className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-white outline-none"
          />
          <button type="button" disabled={sendingInvite} onClick={sendInvite} className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-black text-white hover:bg-blue-500 disabled:opacity-50">
            {sendingInvite ? "Sending..." : "Send invite"}
          </button>
        </div>

        {inviteMsg && <div className="mt-3 text-sm text-white/60">{inviteMsg}</div>}
      </div>

      <div className="rounded-3xl border border-white/10 bg-black/20 p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-black">Manual roster</h3>
            <p className="text-sm text-white/45">Use this for unverified staff or placeholders. Verified players should be invited above.</p>
          </div>
          <button type="button" onClick={addMember} className="rounded-xl bg-white/10 px-3 py-2 text-sm font-bold hover:bg-white/15">Add manual member</button>
        </div>

        <div className="mt-4 space-y-3">
          {members.map((member, index) => (
            <div key={index} className="grid gap-2 rounded-2xl border border-white/10 bg-white/[0.03] p-3 sm:grid-cols-[1fr_1fr_1fr_auto]">
              <input value={member.username || ""} onChange={(e) => updateMember(index, "username", e.target.value)} placeholder="Display name" className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-white outline-none" />
              <input value={member.role || ""} onChange={(e) => updateMember(index, "role", e.target.value)} placeholder="Role" className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-white outline-none" />
              <input value={member.profileUri || ""} onChange={(e) => updateMember(index, "profileUri", e.target.value)} placeholder="Optional BiolinkHQ link" className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-white outline-none" />
              <button type="button" onClick={() => removeMember(index)} className="rounded-xl bg-red-500/15 px-3 py-2 text-sm font-bold text-red-200 hover:bg-red-500/25">Remove</button>
            </div>
          ))}

          {members.length === 0 && <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 text-center text-sm text-white/40">No manual members added yet.</div>}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button type="button" disabled={saving} onClick={saveTeam} className="rounded-2xl bg-blue-600 px-5 py-3 text-sm font-black text-white hover:bg-blue-500 disabled:opacity-50">{saving ? "Saving..." : "Save team profile"}</button>
        {msg && <span className="text-sm text-white/55">{msg}</span>}
      </div>
    </div>
  );
}
