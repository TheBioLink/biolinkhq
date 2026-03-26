"use client";

import { useState } from "react";

export default function PageSettingsForm({ page, user }) {
  const [displayName, setDisplayName] = useState(
    page?.displayName || user?.name || ""
  );
  const [bio, setBio] = useState(page?.bio || "");
  const [location, setLocation] = useState(page?.location || "");

  const [bgType, setBgType] = useState(page?.bgType || "color");
  const [bgColor, setBgColor] = useState(page?.bgColor || "#0b0f14");
  const [bgImage, setBgImage] = useState(page?.bgImage || "");

  const [profileImage, setProfileImage] = useState(
    page?.profileImage || user?.image || ""
  );

  const [bannerImage, setBannerImage] = useState(
    page?.bannerImage || ""
  );

  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  const isGif = (bgImage || "").toLowerCase().endsWith(".gif");

  async function save() {
    setLoading(true);
    setSaved(false);

    await fetch("/api/page", {
      method: "POST",
      body: JSON.stringify({
        displayName,
        bio,
        location,
        bgType,
        bgColor,
        bgImage,
        profileImage,
        bannerImage,
      }),
    });

    setLoading(false);
    setSaved(true);

    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div className="space-y-10">

      {/* PROFILE */}
      <Section title="Profile" desc="Basic information shown on your page">
        <Input label="Display Name" value={displayName} setValue={setDisplayName} />
        <Input label="Location" value={location} setValue={setLocation} />

        <Textarea label="Bio" value={bio} setValue={setBio} />

        <Input label="Profile Image URL" value={profileImage} setValue={setProfileImage} />
        <Input label="Banner Image URL" value={bannerImage} setValue={setBannerImage} />
      </Section>

      {/* DESIGN */}
      <Section title="Design" desc="Customize your background">
        <div>
          <label className="label">Background Type</label>
          <select
            value={bgType}
            onChange={(e) => setBgType(e.target.value)}
            className="input"
          >
            <option value="color">Color</option>
            <option value="image">Image / GIF</option>
          </select>
        </div>

        {bgType === "color" && (
          <div>
            <label className="label">Background Color</label>
            <input
              type="color"
              value={bgColor}
              onChange={(e) => setBgColor(e.target.value)}
              className="h-12 w-24 rounded-lg border border-white/10 bg-transparent"
            />
          </div>
        )}

        {bgType === "image" && (
          <div>
            <label className="label">Background Image / GIF URL</label>
            <input
              value={bgImage}
              onChange={(e) => setBgImage(e.target.value)}
              placeholder="https://media.giphy.com/..."
              className="input"
            />

            <p className="text-xs text-white/50 mt-2">
              Supports GIFs (Giphy, Imgur, etc). Keep it lightweight.
            </p>
          </div>
        )}

        {/* 🔥 LIVE PREVIEW */}
        <div className="mt-4">
          <label className="label">Preview</label>

          <div
            className={`h-40 w-full rounded-2xl border border-white/10 ${
              isGif ? "bg-black/60" : ""
            }`}
            style={
              bgType === "image" && bgImage
                ? {
                    backgroundImage: `url(${bgImage})`,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                  }
                : { backgroundColor: bgColor }
            }
          />
        </div>
      </Section>

      {/* SAVE BAR */}
      <div className="flex items-center justify-between pt-4 border-t border-white/10">
        <div className="text-sm text-white/50">
          {saved ? "✅ Saved" : "Changes are not auto-saved"}
        </div>

        <button
          onClick={save}
          disabled={loading}
          className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 transition font-semibold disabled:opacity-50"
        >
          {loading ? "Saving..." : "Save changes"}
        </button>
      </div>
    </div>
  );
}

/* ---------- UI COMPONENTS ---------- */

function Section({ title, desc, children }) {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-bold">{title}</h3>
        <p className="text-sm text-white/50">{desc}</p>
      </div>

      <div className="grid gap-4">{children}</div>
    </div>
  );
}

function Input({ label, value, setValue }) {
  return (
    <div>
      <label className="label">{label}</label>
      <input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className="input"
      />
    </div>
  );
}

function Textarea({ label, value, setValue }) {
  return (
    <div>
      <label className="label">{label}</label>
      <textarea
        value={value}
        onChange={(e) => setValue(e.target.value)}
        rows={3}
        className="input"
      />
    </div>
  );
}
