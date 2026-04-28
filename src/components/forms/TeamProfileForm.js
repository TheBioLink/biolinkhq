"use client";

import { useState } from "react";

export default function TeamProfileForm({ team }) {
  const [tagline, setTagline] = useState(team?.tagline || "");
  const [description, setDescription] = useState(team?.description || "");
  const [game, setGame] = useState(team?.game || "");
  const [region, setRegion] = useState(team?.region || "");
  const [recruiting, setRecruiting] = useState(Boolean(team?.recruiting));
  const [members, setMembers] = useState(Array.isArray(team?.members) ? team.members : []);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  function addMember() {
    setMembers((prev) => [...prev, { username: "", role: "" }]);
  }

  function updateMember(index, key, value) {
    setMembers((prev) => {
      const copy = [...prev];
      copy[index] = { ...(copy[index] || {}), [key]: value };
      return copy;
    });
  }

  function removeMember(index) {
    setMembers((prev) => prev.filter((_, i) => i !== index));
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
          <input
            value={tagline}
            onChange={(e) => setTagline(e.target.value)}
            placeholder="Elite esports organisation"
            className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none focus:border-blue-400/60"
          />
        </label>

        <label className="space-y-2">
          <span className="text-sm font-bold text-white/70">Main game</span>
          <input
            value={game}
            onChange={(e) => setGame(e.target.value)}
            placeholder="Fortnite, Valorant, Rocket League..."
            className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none focus:border-blue-400/60"
          />
        </label>

        <label className="space-y-2">
          <span className="text-sm font-bold text-white/70">Region</span>
          <input
            value={region}
            onChange={(e) => setRegion(e.target.value)}
            placeholder="EU, UK, NA..."
            className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none focus:border-blue-400/60"
          />
        </label>

        <label className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/30 px-4 py-3">
          <input
            type="checkbox"
            checked={recruiting}
            onChange={(e) => setRecruiting(e.target.checked)}
          />
          <span className="text-sm font-bold text-white/70">Currently recruiting</span>
        </label>
      </div>

      <label className="space-y-2 block">
        <span className="text-sm font-bold text-white/70">Team description</span>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={4}
          placeholder="Explain what the team is, what you do, achievements, recruitment info, or content focus."
          className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none focus:border-blue-400/60"
        />
      </label>

      <div className="rounded-3xl border border-white/10 bg-black/20 p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-black">Roster</h3>
            <p className="text-sm text-white/45">Add players, staff, managers or creators.</p>
          </div>
          <button
            type="button"
            onClick={addMember}
            className="rounded-xl bg-white/10 px-3 py-2 text-sm font-bold hover:bg-white/15"
          >
            Add member
          </button>
        </div>

        <div className="mt-4 space-y-3">
          {members.map((member, index) => (
            <div key={index} className="grid gap-2 rounded-2xl border border-white/10 bg-white/[0.03] p-3 sm:grid-cols-[1fr_1fr_auto]">
              <input
                value={member.username || ""}
                onChange={(e) => updateMember(index, "username", e.target.value)}
                placeholder="Username"
                className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-white outline-none"
              />
              <input
                value={member.role || ""}
                onChange={(e) => updateMember(index, "role", e.target.value)}
                placeholder="Role"
                className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-white outline-none"
              />
              <button
                type="button"
                onClick={() => removeMember(index)}
                className="rounded-xl bg-red-500/15 px-3 py-2 text-sm font-bold text-red-200 hover:bg-red-500/25"
              >
                Remove
              </button>
            </div>
          ))}

          {members.length === 0 && (
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 text-center text-sm text-white/40">
              No members added yet.
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button
          type="button"
          disabled={saving}
          onClick={saveTeam}
          className="rounded-2xl bg-blue-600 px-5 py-3 text-sm font-black text-white hover:bg-blue-500 disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save team profile"}
        </button>
        {msg && <span className="text-sm text-white/55">{msg}</span>}
      </div>
    </div>
  );
}
