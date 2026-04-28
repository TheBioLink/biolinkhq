"use client";

import { useState } from "react";

export default function TeamAdminPanel() {
  const [target, setTarget] = useState("");
  const [mode, setMode] = useState("uri");
  const [isTeam, setIsTeam] = useState(true);
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit() {
    setLoading(true);
    setMsg("");

    try {
      const res = await fetch("/api/team-profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          mode === "email"
            ? { targetEmail: target, isTeam }
            : { targetUri: target, isTeam }
        ),
      });

      const data = await res.json();

      if (!res.ok) {
        setMsg(data?.error || "Failed");
        return;
      }

      setMsg(`Updated ${target} → ${isTeam ? "TEAM" : "NORMAL"}`);
      setTarget("");
    } catch {
      setMsg("Network error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="rounded-2xl border border-blue-500/20 bg-blue-500/5 p-8">
      <h2 className="text-xl font-extrabold text-blue-300">Admin: Team Profiles</h2>
      <p className="text-sm text-white/60 mt-2">
        Convert any user into a team profile with advanced dashboard features.
      </p>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <select
          value={mode}
          onChange={(e) => setMode(e.target.value)}
          className="bg-black/30 border border-white/10 rounded-xl p-3 text-white"
        >
          <option value="uri">Username</option>
          <option value="email">Email</option>
        </select>

        <input
          value={target}
          onChange={(e) => setTarget(e.target.value)}
          placeholder={mode === "email" ? "user@email.com" : "username"}
          className="bg-black/30 border border-white/10 rounded-xl p-3 text-white"
        />

        <label className="flex items-center gap-3">
          <input
            type="checkbox"
            checked={isTeam}
            onChange={(e) => setIsTeam(e.target.checked)}
          />
          <span className="text-white/70">Mark as team</span>
        </label>
      </div>

      <button
        onClick={submit}
        disabled={loading}
        className="mt-5 px-5 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-extrabold"
      >
        Apply
      </button>

      {msg && <div className="mt-3 text-sm text-white/70">{msg}</div>}
    </section>
  );
}
