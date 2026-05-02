"use client";

import toast from "react-hot-toast";

export async function upload(ev, callbackFn, type = "avatar") {
  const file = ev.target.files?.[0];
  if (!file) return;

  const uploadPromise = new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onloadend = async () => {
      try {
        const res = await fetch("/api/upload", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            fileBase64: reader.result,
            type, // "avatar" or "banner"
          }),
        });

        const json = await res.json();

        if (!res.ok) {
          console.error("❌ Upload failed:", json);
          return reject(json?.error || "Upload failed");
        }

        callbackFn(json.url);
        resolve(json.url);

      } catch (err) {
        console.error("❌ Upload error:", err);
        reject("Upload failed");
      }
    };

    reader.onerror = () => reject("File read failed");

    reader.readAsDataURL(file);
  });

  await toast.promise(uploadPromise, {
    loading: "Uploading...",
    success: "Uploaded!",
    error: "Upload error!",
  });
}
