"use client";

import { useMemo, useState } from "react";

function toList(input) {
  return (input || "")
    .split(",")
    .map((v) => v.trim())
    .filter(Boolean);
}

function toTournamentRows(input) {
  return (input || "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [event = "", placement = "", year = ""] = line.split("|").map((v) => v.trim());
      return { event, placement, year };
    });
}

function fromTournamentRows(rows = []) {
  return rows.map((row) => [row.event, row.placement, row.year].join(" | ")).join("\n");
}

export default function EsportsProfileForm({ initialProfile, psid }) {
  const base = useMemo(
    () => ({
      enabled: false,
      featured: false,
      gamerTag: "",
      headline: "",
      primaryGame: "",
      secondaryGames: [],
      roles: [],
      region: "",
      country: "",
      rank: "",
      peakRank: "",
      teamStatus: "",
      orgTypeWanted: [],
      languages: [],
      yearsCompeting: "",
      availability: "",
      timezoneLabel: "",
      achievements: [],
      tournamentHistory: [],
      vodLinks: [],
      orgFitTags: [],
      strengths: [],
      lookingFor: [],
      anonymousBio: "",
      socials: {
        x: "",
        twitch: "",
        youtube: "",
        discord: "",
      },
      privacy: {
        showRealName: false,
        showLocation: false,
        hidePersonalLinks: true,
        showMainProfileLink: false,
        allowSearchIndexing: true,
        contactMode: "request-only",
      },
      ...(initialProfile || {}),
      socials: {
        x: "",
        twitch: "",
        youtube: "",
        discord: "",
        ...(initialProfile?.socials || {}),
      },
      privacy: {
        showRealName: false,
        showLocation: false,
        hidePersonalLinks: true,
        showMainProfileLink: false,
        allowSearchIndexing: true,
        contactMode: "request-only",
        ...(initialProfile?.privacy || {}),
      },
    }),
    [initialProfile]
  );

  const [form, setForm] = useState(base);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  function setField(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function setPrivacy(key, value) {
    setForm((prev) => ({
      ...prev,
      privacy: { ...prev.privacy, [key]: value },
    }));
  }

  function setSocial(key, value) {
    setForm((prev) => ({
      ...prev,
      socials: { ...prev.socials, [key]: value },
    }));
  }

  async function onSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setMessage("");

    try {
      const res = await fetch("/api/esports-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!res.ok) {
        setMessage(data?.error || "Failed to save");
        return;
      }

      setMessage("Esports identity saved.");
    } catch {
      setMessage("Network error.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-xl font-extrabold text-white">Esports Identity</h2>
            <p className="text-sm text-white/60">
              Private-first profile for scouting, org discovery, and recruitment.
            </p>
          </div>

          <div className="rounded-xl border border-blue-400/20 bg-blue-500/10 px-4 py-2 text-sm font-bold text-blue-300">
            PSID: {psid}
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-amber-300/20 bg-amber-500/10 p-4 text-sm text-amber-200">
        Messaging is coming soon. Profiles can still be discovered, viewed, and shared now.
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/5 p-5 space-y-4">
        <h3 className="text-lg font-extrabold text-white">Core identity</h3>

        <label className="flex items-center gap-3 text-white">
          <input
            type="checkbox"
            checked={form.enabled}
            onChange={(e) => setField("enabled", e.target.checked)}
          />
          Enable esports profile
        </label>

        <div className="grid gap-4 md:grid-cols-2">
          <input value={form.gamerTag} onChange={(e) => setField("gamerTag", e.target.value)} placeholder="Gamer tag" className="rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none" />
          <input value={form.headline} onChange={(e) => setField("headline", e.target.value)} placeholder="Headline" className="rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none" />
          <input value={form.primaryGame} onChange={(e) => setField("primaryGame", e.target.value)} placeholder="Primary game" className="rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none" />
          <input value={form.region} onChange={(e) => setField("region", e.target.value)} placeholder="Region" className="rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none" />
          <input value={form.country} onChange={(e) => setField("country", e.target.value)} placeholder="Country" className="rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none" />
          <input value={form.rank} onChange={(e) => setField("rank", e.target.value)} placeholder="Current rank" className="rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none" />
          <input value={form.peakRank} onChange={(e) => setField("peakRank", e.target.value)} placeholder="Peak rank" className="rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none" />
          <input value={form.yearsCompeting} onChange={(e) => setField("yearsCompeting", e.target.value)} placeholder="Years competing" className="rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none" />

          <select
            value={form.teamStatus}
            onChange={(e) => setField("teamStatus", e.target.value)}
            className="rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none"
          >
            <option value="">Team status</option>
            <option value="lft">Looking for team</option>
            <option value="fa">Free agent</option>
            <option value="on-team">Currently on team</option>
            <option value="coach">Coach</option>
            <option value="manager">Manager</option>
            <option value="analyst">Analyst</option>
            <option value="creator">Creator</option>
          </select>

          <input value={form.timezoneLabel} onChange={(e) => setField("timezoneLabel", e.target.value)} placeholder="Timezone / play hours" className="rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none" />
        </div>

        <textarea
          value={form.anonymousBio}
          onChange={(e) => setField("anonymousBio", e.target.value)}
          placeholder="Anonymous esports bio"
          rows={4}
          className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none"
        />
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/5 p-5 space-y-4">
        <h3 className="text-lg font-extrabold text-white">Competitive profile</h3>

        <div className="grid gap-4 md:grid-cols-2">
          <input defaultValue={form.roles.join(", ")} onChange={(e) => setField("roles", toList(e.target.value))} placeholder="Roles" className="rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none" />
          <input defaultValue={form.secondaryGames.join(", ")} onChange={(e) => setField("secondaryGames", toList(e.target.value))} placeholder="Secondary games" className="rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none" />
          <input defaultValue={form.languages.join(", ")} onChange={(e) => setField("languages", toList(e.target.value))} placeholder="Languages" className="rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none" />
          <input defaultValue={form.orgTypeWanted.join(", ")} onChange={(e) => setField("orgTypeWanted", toList(e.target.value))} placeholder="Wanted org types" className="rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none" />
          <input defaultValue={form.orgFitTags.join(", ")} onChange={(e) => setField("orgFitTags", toList(e.target.value))} placeholder="Org fit tags" className="rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none" />
          <input defaultValue={form.strengths.join(", ")} onChange={(e) => setField("strengths", toList(e.target.value))} placeholder="Strengths" className="rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none" />
          <input defaultValue={form.lookingFor.join(", ")} onChange={(e) => setField("lookingFor", toList(e.target.value))} placeholder="Looking for" className="rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none" />
          <input defaultValue={form.achievements.join(", ")} onChange={(e) => setField("achievements", toList(e.target.value))} placeholder="Achievements" className="rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none" />
          <input defaultValue={form.vodLinks.join(", ")} onChange={(e) => setField("vodLinks", toList(e.target.value))} placeholder="VOD links" className="rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none" />
        </div>

        <textarea
          value={form.availability}
          onChange={(e) => setField("availability", e.target.value)}
          placeholder="Availability"
          rows={3}
          className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none"
        />

        <textarea
          defaultValue={fromTournamentRows(form.tournamentHistory)}
          onChange={(e) => setField("tournamentHistory", toTournamentRows(e.target.value))}
          placeholder="Tournament history: one per line, format: Event | Placement | Year"
          rows={5}
          className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none"
        />
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/5 p-5 space-y-4">
        <h3 className="text-lg font-extrabold text-white">Socials</h3>

        <div className="grid gap-4 md:grid-cols-2">
          <input value={form.socials.x} onChange={(e) => setSocial("x", e.target.value)} placeholder="X / Twitter URL" className="rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none" />
          <input value={form.socials.twitch} onChange={(e) => setSocial("twitch", e.target.value)} placeholder="Twitch URL" className="rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none" />
          <input value={form.socials.youtube} onChange={(e) => setSocial("youtube", e.target.value)} placeholder="YouTube URL" className="rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none" />
          <input value={form.socials.discord} onChange={(e) => setSocial("discord", e.target.value)} placeholder="Discord tag / server invite" className="rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none" />
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/5 p-5 space-y-4">
        <h3 className="text-lg font-extrabold text-white">Privacy & discovery</h3>

        <div className="grid gap-4 md:grid-cols-2">
          <label className="flex items-center gap-3 text-white">
            <input type="checkbox" checked={form.privacy.showRealName} onChange={(e) => setPrivacy("showRealName", e.target.checked)} />
            Show real name
          </label>

          <label className="flex items-center gap-3 text-white">
            <input type="checkbox" checked={form.privacy.showLocation} onChange={(e) => setPrivacy("showLocation", e.target.checked)} />
            Show location
          </label>

          <label className="flex items-center gap-3 text-white">
            <input type="checkbox" checked={form.privacy.hidePersonalLinks} onChange={(e) => setPrivacy("hidePersonalLinks", e.target.checked)} />
            Hide personal links
          </label>

          <label className="flex items-center gap-3 text-white">
            <input type="checkbox" checked={form.privacy.showMainProfileLink} onChange={(e) => setPrivacy("showMainProfileLink", e.target.checked)} />
            Show main BioLink link
          </label>

          <label className="flex items-center gap-3 text-white md:col-span-2">
            <input type="checkbox" checked={form.privacy.allowSearchIndexing} onChange={(e) => setPrivacy("allowSearchIndexing", e.target.checked)} />
            Allow this profile to appear in discovery
          </label>
        </div>

        <select
          value={form.privacy.contactMode}
          onChange={(e) => setPrivacy("contactMode", e.target.value)}
          className="rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none"
        >
          <option value="public">Public contact</option>
          <option value="request-only">Request only</option>
          <option value="private">Private</option>
        </select>
      </div>

      <div className="flex items-center gap-4">
        <button
          type="submit"
          disabled={saving}
          className="rounded-xl bg-blue-600 px-5 py-3 font-bold text-white hover:bg-blue-500 disabled:opacity-60"
        >
          {saving ? "Saving..." : "Save esports identity"}
        </button>

        {message ? <p className="text-sm text-white/70">{message}</p> : null}
      </div>
    </form>
  );
}
