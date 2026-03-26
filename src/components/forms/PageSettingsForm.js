"use client";

import { useState } from "react";

export default function PageSettingsForm({ page }) {
  const [bgImage, setBgImage] = useState(page?.bgImage || "");
  const [bgType, setBgType] = useState(page?.bgType || "color");
  const [bgColor, setBgColor] = useState(page?.bgColor || "#0b0f14");

  async function save() {
    await fetch("/api/page", {
      method: "POST",
      body: JSON.stringify({
        bgImage,
        bgType,
        bgColor,
      }),
    });

    alert("Saved");
  }

  return (
    <div className="space-y-6">

      {/* Background Type */}
      <div>
        <label className="text-sm">Background Type</label>

        <select
          value={bgType}
          onChange={(e) => setBgType(e.target.value)}
          className="w-full mt-2 p-2 rounded bg-black/40"
        >
          <option value="color">Color</option>
          <option value="image">Image / GIF</option>
        </select>
      </div>

      {/* Color */}
      {bgType === "color" && (
        <input
          type="color"
          value={bgColor}
          onChange={(e) => setBgColor(e.target.value)}
        />
      )}

      {/* GIF URL */}
      {bgType === "image" && (
        <div>
          <label className="text-sm">GIF / Image URL</label>

          <input
            type="text"
            value={bgImage}
            onChange={(e) => setBgImage(e.target.value)}
            placeholder="https://media.giphy.com/..."
            className="w-full mt-2 p-2 rounded bg-black/40"
          />
        </div>
      )}

      <button
        onClick={save}
        className="bg-blue-600 px-4 py-2 rounded"
      >
        Save
      </button>
    </div>
  );
}
