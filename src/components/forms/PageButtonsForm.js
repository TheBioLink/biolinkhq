"use client";

import { useState } from "react";

export default function PageButtonsForm({ page }) {
  const [buttons, setButtons] = useState(Array.isArray(page?.buttons) ? page.buttons : []);
  const [msg, setMsg] = useState("");
  const [saving, setSaving] = useState(false);

  function updateBtn(i, key, value) {
    setButtons((prev) => {
      const copy = [...prev];
      copy[i] = { ...(copy[i] || {}), [key]: value };
      return copy;
    });
  }

  function addBtn() {
    setButtons((prev) => [...prev, { label: "", url: "" }]);
  }

  function removeBtn(i) {
    setButtons((prev) => prev.filter((_, idx) => idx !== i));
  }

  async function save() {
    setMsg("");
    setSaving(true);
    try {
      const res = await fetch("/api/page", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ buttons }),
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
        <h2 className="text-xl font-bold">Buttons</h2>
        <button
          onClick={addBtn}
          className="border px-3 py-1 rounded hover:bg-gray-50 font-semibold"
          type="button"
        >
          + Add
        </button>
      </div>

      <div className="space-y-3">
        {buttons.map((b, i) => (
          <div key={i} className="border rounded p-3">
            <div className="flex gap-2">
              <input
                className="w-1/3 border p-2 rounded"
                placeholder="Label (e.g. Instagram)"
                value={b?.label || ""}
                onChange={(e) => updateBtn(i, "label", e.target.value)}
              />
              <input
                className="w-2/3 border p-2 rounded"
                placeholder="https://..."
                value={b?.url || ""}
                onChange={(e) => updateBtn(i, "url", e.target.value)}
              />
            </div>

            <button
              onClick={() => removeBtn(i)}
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
        {saving ? "Saving..." : "Save buttons"}
      </button>
    </div>
  );
}
