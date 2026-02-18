"use client";

import { useState } from "react";

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function PageSettingsForm({ page, user }) {
  const [displayName, setDisplayName] = useState(page?.displayName || user?.name || "");
  const [bio, setBio] = useState(page?.bio || "");
  const [profileImage, setProfileImage] = useState(page?.profileImage || user?.image || "");
  const [bannerImage, setBannerImage] = useState(page?.bannerImage || "");
  const [msg, setMsg] = useState("");
  const [saving, setSaving] = useState(false);

  async function uploadImage(file, type) {
    const fileBase64 = await fileToBase64(file);

    const res = await fetch("/api/cloudinary", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fileBase64, type }),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data?.error || "Upload failed");
    return data.url;
  }

  async function handleUpload(e, type) {
    const file = e.target.files?.[0];
    if (!file) return;

    setMsg("");
    try {
      const url = await uploadImage(file, type);
      if (type === "avatar") setProfileImage(url);
      if (type === "banner") setBannerImage(url);
      setMsg(`${type} uploaded`);
    } catch (err) {
      setMsg(err.message || "Upload error");
    }
  }

  async function save() {
    setMsg("");
    setSaving(true);
    try {
      const res = await fetch("/api/page", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ displayName, bio, profileImage, bannerImage }),
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

      <div className="grid md:grid-cols-2 gap-4 mb-4">
        <div>
          <label className="block text-sm font-semibold mb-1">Profile photo</label>
          {profileImage ? (
            <img src={profileImage} alt="profile" className="w-24 h-24 rounded-full object-cover border mb-2" />
          ) : (
            <div className="w-24 h-24 rounded-full border mb-2" />
          )}
          <input type="file" accept="image/*" onChange={(e) => handleUpload(e, "avatar")} />
        </div>

        <div>
          <label className="block text-sm font-semibold mb-1">Banner</label>
          {bannerImage ? (
            <img src={bannerImage} alt="banner" className="w-full h-24 rounded-md object-cover border mb-2" />
          ) : (
            <div className="w-full h-24 rounded-md border mb-2" />
          )}
          <input type="file" accept="image/*" onChange={(e) => handleUpload(e, "banner")} />
        </div>
      </div>

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
