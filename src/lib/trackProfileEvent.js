// src/lib/trackProfileEvent.js
export async function trackProfileEvent(uri, type, target = "") {
  try {
    const payload = JSON.stringify({ uri, type, target });

    if (typeof navigator !== "undefined" && navigator.sendBeacon) {
      const blob = new Blob([payload], { type: "application/json" });
      navigator.sendBeacon("/api/analytics/track", blob);
      return;
    }

    await fetch("/api/analytics/track", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: payload,
      keepalive: true,
    });
  } catch {}
}
