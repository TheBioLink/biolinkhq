"use client";

import { useEffect, useMemo, useRef, useState } from "react";

function isImage(file) {
  return file && file.type && file.type.startsWith("image/");
}

async function uploadImage(file, type) {
  const toBase64 = (f) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(f);
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
    });

  const fileBase64 = await toBase64(file);

  const res = await fetch("/api/upload", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      fileBase64,
      type,
    }),
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data?.error || data?.details || "Upload failed");
  }

  return data.url;
}

export default function PageSettingsForm({ page, user }) {
  const [displayName, setDisplayName] = useState(page?.displayName || "");
  const [bio, setBio] = useState(page?.bio || "");
  const [location, setLocation] = useState(page?.location || "");

  const [profileImage, setProfileImage] = useState(
    page?.profileImage || user?.image || ""
  );
  const [bannerImage, setBannerImage] = useState(page?.bannerImage || "");

  const [profilePreview, setProfilePreview] = useState(
    page?.profileImage || user?.image || ""
  );
  const [bannerPreview, setBannerPreview] = useState(page?.bannerImage || "");

  const [saving, setSaving] = useState(false);
  const [uploadingProfile, setUploadingProfile] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const [msg, setMsg] = useState("");

  const profileInputRef = useRef(null);
  const bannerInputRef = useRef(null);

  useEffect(() => {
    setProfileImage(page?.profileImage || user?.image || "");
    setBannerImage(page?.bannerImage || "");
    setProfilePreview(page?.profileImage || user?.image || "");
    setBannerPreview(page?.bannerImage || "");
    setDisplayName(page?.displayName || "");
    setBio(page?.bio || "");
    setLocation(page?.location || "");
  }, [page, user]);

  const initials = useMemo(() => {
    const base = (displayName || user?.name || user?.email || "U").trim();
    return base.slice(0, 1).toUpperCase();
  }, [displayName, user]);

  async function onPickProfile(file) {
    if (!file) return;
    if (!isImage(file)) {
      setMsg("Please select an image file.");
      return;
    }
    if (file.size > 6 * 1024 * 1024) {
      setMsg("Profile image must be under 6MB.");
      return;
    }

    setMsg("");
    const localUrl = URL.createObjectURL(file);
    const previousPreview = profilePreview;
    setProfilePreview(localUrl);

    try {
      setUploadingProfile(true);
      const url = await uploadImage(file, "avatar");
      setProfileImage(url);
      setProfilePreview(url);
      setMsg("Profile image uploaded.");
    } catch (e) {
      setProfilePreview(previousPreview || profileImage || "");
      setMsg(e?.message || "Upload failed");
    } finally {
      setUploadingProfile(false);
      if (profileInputRef.current) profileInputRef.current.value = "";
      URL.revokeObjectURL(localUrl);
    }
  }

  async function onPickBanner(file) {
    if (!file) return;
    if (!isImage(file)) {
      setMsg("Please select an image file.");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setMsg("Banner image must be under 10MB.");
      return;
    }

    setMsg("");
    const localUrl = URL.createObjectURL(file);
    const previousPreview = bannerPreview;
    setBannerPreview(localUrl);

    try {
      setUploadingBanner(true);
      const url = await uploadImage(file, "banner");
      setBannerImage(url);
      setBannerPreview(url);
      setMsg("Banner uploaded.");
    } catch (e) {
      setBannerPreview(previousPreview || bannerImage || "");
      setMsg(e?.message || "Upload failed");
    } finally {
      setUploadingBanner(false);
      if (bannerInputRef.current) bannerInputRef.current.value = "";
      URL.revokeObjectURL(localUrl);
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
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-white/10 bg-black/20 p-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-gray-400">Profile photo</div>
              <div className="mt-1 text-xs text-gray-500">
                PNG/JPG/WebP • up to 6MB
              </div>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => profileInputRef.current?.click()}
                disabled={uploadingProfile || saving}
                className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-bold text-gray-100 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {uploadingProfile ? "Uploading..." : "Upload"}
              </button>

              {profileImage && (
                <button
                  type="button"
                  disabled={uploadingProfile || saving}
                  onClick={() => {
                    setProfileImage("");
                    setProfilePreview("");
                    setMsg("");
                  }}
                  className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-bold text-gray-200 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Remove
                </button>
              )}
            </div>
          </div>

          <div className="mt-5 flex items-center gap-4">
            <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-full border border-white/10 bg-white/5">
              {profilePreview ? (
                <img
                  src={profilePreview}
                  alt="Profile preview"
                  className="h-full w-full object-cover"
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

        <div className="rounded-2xl border border-white/10 bg-black/20 p-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-gray-400">Banner</div>
              <div className="mt-1 text-xs text-gray-500">
                PNG/JPG/WebP • up to 10MB
              </div>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => bannerInputRef.current?.click()}
                disabled={uploadingBanner || saving}
                className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-bold text-gray-100 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {uploadingBanner ? "Uploading..." : "Upload"}
              </button>

              {bannerImage && (
                <button
                  type="button"
                  disabled={uploadingBanner || saving}
                  onClick={() => {
                    setBannerImage("");
                    setBannerPreview("");
                    setMsg("");
                  }}
                  className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-bold text-gray-200 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Remove
                </button>
              )}
            </div>
          </div>

          <div className="mt-5 overflow-hidden rounded-2xl border border-white/10 bg-white/5">
            <div className="aspect-[16/6] w-full">
              {bannerPreview ? (
                <img
                  src={bannerPreview}
                  alt="Banner preview"
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-gray-500">
                  No banner uploaded
                </div>
              )}
            </div>
          </div>

          <div className="mt-3 text-xs text-gray-500">
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

      <div className="grid gap-6 md:grid-cols-2">
        <div>
          <label className="mb-2 block text-sm font-semibold text-gray-200">
            Display name
          </label>
          <input
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            className="w-full rounded-xl border border-white/10 bg-black/30 p-3 text-gray-100 outline-none placeholder:text-gray-500 focus:ring-2 focus:ring-blue-500/50"
            placeholder="Your name"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-semibold text-gray-200">
            Location
          </label>
          <input
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="w-full rounded-xl border border-white/10 bg-black/30 p-3 text-gray-100 outline-none placeholder:text-gray-500 focus:ring-2 focus:ring-blue-500/50"
            placeholder="City, Country"
          />
        </div>

        <div className="md:col-span-2">
          <label className="mb-2 block text-sm font-semibold text-gray-200">
            Bio
          </label>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            rows={4}
            className="w-full rounded-xl border border-white/10 bg-black/30 p-3 text-gray-100 outline-none placeholder:text-gray-500 focus:ring-2 focus:ring-blue-500/50"
            placeholder="Tell people who you are…"
          />
        </div>
      </div>

      <div className="flex items-center gap-4">
        <button
          disabled={saving || uploadingProfile || uploadingBanner}
          type="submit"
          className="rounded-xl bg-blue-600 px-6 py-3 font-extrabold text-white hover:bg-blue-500 disabled:opacity-60"
        >
          {saving ? "Saving..." : "Save changes"}
        </button>

        {msg && <div className="text-sm text-gray-300">{msg}</div>}
      </div>
    </form>
  );
}
