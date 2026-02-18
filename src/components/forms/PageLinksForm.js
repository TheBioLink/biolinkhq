"use client";

import { useState } from "react";

export default function PageLinksForm({ page }) {
  const [links, setLinks] = useState(Array.isArray(page?.links) ? page.links : []);
  const [msg, setMsg] = useState("");
  const [saving, setSaving] = useState(false);

  function updateLink(i, key, value) {
    setLinks((prev) => {
      const copy = [...prev];
      copy[i] = { ...(copy[i] || {}), [key]: value };
      return copy;
    });
  }

  function addLink() {
    setLinks((prev) => [...prev, { title: "", url: "" }]);
  }

  function removeLink(i) {
    setLinks((prev) => prev.filter((_, idx) => idx !== i));
  }

  async function save() {
    setMsg("");
    setSaving(true);
    try {
      const res = await fetch("/api/page", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ links }),
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
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-xl font-bold">Links</h2>
        <button
          onClick={addLink}
          className="border px-3 py-1 rounded hover:bg-gray-50 font-semibold"
          type="button"
        >
          + Add
        </button>
      </div>

      <div className="space-y-3">
        {links.map((l, i) => (
          <div key={i} className="border rounded p-3">
            <div className="flex gap-2">
              <input
                className="w-1/3 border p-2 rounded"
                placeholder="Title"
                value={l?.title || ""}
                onChange={(e) => updateLink(i, "title", e.target.value)}
              />
              <input
                className="w-2/3 border p-2 rounded"
                placeholder="https://..."
                value={l?.url || ""}
                onChange={(e) => updateLink(i, "url", e.target.value)}
              />
            </div>

            <button
              onClick={() => removeLink(i)}
              className="text-red-600 text-sm mt-2"
              type="button"
            >
              Remove
            </button>
          </div>
        ))}
      </div>

      {msg && <div className="text-sm mt-3">{msg}</div>}

      <button
        onClick={save}
        disabled={saving}
        className="mt-3 bg-blue-500 hover:bg-blue-300 text-white font-bold px-4 py-2 rounded disabled:opacity-60"
      >
        {saving ? "Saving..." : "Save links"}
      </button>
    </div>
  );
}
