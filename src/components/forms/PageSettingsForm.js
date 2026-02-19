"use client";

import { useEffect, useMemo, useRef, useState } from "react";

function cx(...s) {
  return s.filter(Boolean).join(" ");
}

function isImage(file) {
  return file && file.type && file.type.startsWith("image/");
}

async function uploadToCloudinary(file) {
  // You must set these env vars on the client as NEXT_PUBLIC_*
  // NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
  // NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

  if (!cloudName || !uploadPreset) {
    throw new Error("Missing Cloudinary env vars");
  }

  const form = new FormData();
  form.append("file", file);
  form.append("upload_preset", uploadPreset);

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
    { method: "POST", body: form }
  );

  const data = await res.json();
  if (!res.ok) throw new Error(data?.error?.message || "Upload failed");
  return data.secure_url;
}

export default function PageSettingsForm({ page, user }) {
  const [displayName, setDisplayName] = useState(page?.displayName || "");
  const [bio, setBio] = useState(page?.bio || "");
  const [location, setLocation] = useState(page?.location || "");

  // Stored URLs (server)
  const [profileImage, setProfileImage] = useState(
    page?.profileImage || user?.image || ""
  );
  const [bannerImage, setBannerImage] = useState(page?.bannerImage || "");

  // Local preview while uploading
  const [profilePreview, setProfilePreview] = useState(profileImage);
  const [bannerPreview, setBannerPreview] = useState(bannerImage);

  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  const profileInputRef = useRef(null);
  const bannerInputRef = useRef(null);

  useEffect(() => {
    setProfilePreview(profileImage);
  }, [profileImage]);

  useEffect(() => {
    setBannerPreview(bannerImage);
  }, [bannerImage]);

  const initials = useMemo(() => {
    const base = (displayName || user?.name || user?.email || "U").trim();
    return base.slice(0, 1).toUpperCase();
  }, [displayName, user]);

  async function onPickProfile(file) {
    if (!file) return;
    if (!isImage(file)) return setMsg("Please select an image file.");
    if (file.size > 6 * 1024 * 1024)
      return setMsg("Profile image must be under 6MB.");

    setMsg("");
    const localUrl = URL.createObjectURL(file);
    setProfilePreview(localUrl);

    try {
      setSaving(true);
      const url = await uploadToCloudinary(file);
      setProfileImage(url);
    } catch (e) {
      setProfilePreview(profileImage);
      setMsg(e?.message || "Upload failed");
    } finally {
      setSaving(false);
    }
  }

  async function onPickBanner(file) {
    if (!file) return;
    if (!isImage(file)) return setMsg("Please select an image file.");
    if (file.size > 10 * 1024 * 1024)
      return setMsg("Banner image must be under 10MB.");

    setMsg("");
    const localUrl = URL.createObjectURL(file);
    setBannerPreview(localUrl);

    try {
      setSaving(true);
      const url = await uploadToCloudinary(file);
      setBannerImage(url);
    } catch (e) {
      setBannerPreview(bannerImage);
      setMsg(e?.message || "Upload failed");
    } finally {
      setSaving(false);
    }
  }

  async function saveAll(e) {
    e.preventDefault();
    setMsg("");
    setSaving(true);

    try {
      const res = await fetch("/api/page", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          displayName,
          bio,
          location,
          profileImage,
          bannerImage,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setMsg(data?.error || "Save failed");
        return;
      }
      setMsg("Saved!");
    } catch {
      setMsg("Network error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={saveAll} className="space-y-8">
      {/* Upload block */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Profile */}
        <div className="rounded-2xl border border-white/10 bg-black/20 p-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-gray-400">Profile photo</div>
              <div className="text-xs text-gray-500 mt-1">
                PNG/JPG/WebP • up to 6MB
              </div>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => profileInputRef.current?.click()}
                className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-sm font-bold text-gray-100 hover:bg-white/10 transition"
              >
                Upload
              </button>
              {profileImage && (
                <button
                  type="button"
                  onClick={() => {
                    setProfileImage("");
                    setProfilePreview("");
                  }}
                  className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-sm font-bold text-gray-200 hover:bg-white/10 transition"
                >
                  Remove
                </button>
              )}
            </div>
          </div>

          <div className="mt-5 flex items-center gap-4">
            <div className="w-20 h-20 rounded-full border border-white/10 bg-white/5 overflow-hidden flex items-center justify-center">
              {profilePreview ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={profilePreview}
                  alt="Profile preview"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="text-2xl font-extrabold text-gray-200">
                  {initials}
                </div>
              )}
            </div>

            <div className="text-sm text-gray-300">
              <div className="font-semibold">Recommended</div>
              <div className="text-gray-400">Square • 512×512 or higher</div>
            </div>
          </div>

          <input
            ref={profileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => onPickProfile(e.target.files?.[0])}
          />
        </div>

        {/* Banner */}
        <div className="rounded-2xl border border-white/10 bg-black/20 p-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-gray-400">Banner</div>
              <div className="text-xs text-gray-500 mt-1">
                PNG/JPG/WebP • up to 10MB
              </div>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => bannerInputRef.current?.click()}
                className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-sm font-bold text-gray-100 hover:bg-white/10 transition"
              >
                Upload
              </button>
              {bannerImage && (
                <button
                  type="button"
                  onClick={() => {
                    setBannerImage("");
                    setBannerPreview("");
                  }}
                  className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-sm font-bold text-gray-200 hover:bg-white/10 transition"
                >
                  Remove
                </button>
              )}
            </div>
          </div>

          <div className="mt-5 rounded-2xl border border-white/10 bg-white/5 overflow-hidden">
            <div className="aspect-[16/6] w-full">
              {bannerPreview ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={bannerPreview}
                  alt="Banner preview"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-500">
                  No banner uploaded
                </div>
              )}
            </div>
          </div>

          <div className="text-xs text-gray-500 mt-3">
            Recommended: 1600×600 (wide)
          </div>

          <input
            ref={bannerInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => onPickBanner(e.target.files?.[0])}
          />
        </div>
      </div>

      {/* Text fields */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="md:col-span-1">
          <label className="block text-sm font-semibold text-gray-200 mb-2">
            Display name
          </label>
          <input
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            className="w-full bg-black/30 border border-white/10 rounded-xl p-3 text-gray-100 placeholder:text-gray-500 outline-none focus:ring-2 focus:ring-blue-500/50"
            placeholder="Your name"
          />
        </div>

        <div className="md:col-span-1">
          <label className="block text-sm font-semibold text-gray-200 mb-2">
            Location
          </label>
          <input
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="w-full bg-black/30 border border-white/10 rounded-xl p-3 text-gray-100 placeholder:text-gray-500 outline-none focus:ring-2 focus:ring-blue-500/50"
            placeholder="City, Country"
          />
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-semibold text-gray-200 mb-2">
            Bio
          </label>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            rows={4}
            className="w-full bg-black/30 border border-white/10 rounded-xl p-3 text-gray-100 placeholder:text-gray-500 outline-none focus:ring-2 focus:ring-blue-500/50"
            placeholder="Tell people who you are…"
          />
        </div>
      </div>

      {/* Save */}
      <div className="flex items-center gap-4">
        <button
          disabled={saving}
          type="submit"
          className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-extrabold disabled:opacity-60"
        >
          {saving ? "Saving..." : "Save changes"}
        </button>

        {msg && <div className="text-sm text-gray-300">{msg}</div>}
      </div>
    </form>
  );
}
