"use client";

import { useState } from "react";

export default function PageSettingsForm({ page, user }) {
  const [displayName, setDisplayName] = useState(page?.displayName || user?.name || "");
  const [bio, setBio] = useState(page?.bio || "");
  const [msg, setMsg] = useState("");
  const [saving, setSaving] = useState(false);

  async function save() {
    setMsg("");
    setSaving(true);
    try {
      const res = await fetch("/api/page", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ displayName, bio }),
      });
      const data = await res.json();
      if (!res.ok) return setMsg(data?.error || "Save failed");
      setMsg("Saved!");
    } catch {
      setMsg("Network error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="bg-white shadow rounded-md p-4 mb-4">
      <h2 className="text-xl font-bold mb-3">Profile</h2>

      <label className="block text-sm font-semibold mb-1">Display name</label>
      <input
        className="w-full border p-2 rounded mb-3"
        value={displayName}
        onChange={(e) => setDisplayName(e.target.value)}
      />

      <label className="block text-sm font-semibold mb-1">Bio</label>
      <textarea
        className="w-full border p-2 rounded mb-3"
        rows={3}
        value={bio}
        onChange={(e) => setBio(e.target.value)}
      />

      {msg && <div className="text-sm mb-2">{msg}</div>}

      <button
        onClick={save}
        disabled={saving}
        className="bg-blue-500 hover:bg-blue-300 text-white font-bold px-4 py-2 rounded disabled:opacity-60"
      >
        {saving ? "Saving..." : "Save"}
      </button>
    </div>
  );
}
