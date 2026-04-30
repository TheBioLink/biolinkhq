"use client";

import { useEffect } from "react";

export default function AdBlock({ slot = "1234567890" }) {
  useEffect(() => {
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch (e) {
      console.log("Adsense error:", e);
    }
  }, []);

  return (
    <div style={{ width: "100%", margin: "20px 0" }}>
      <ins
        className="adsbygoogle"
        style={{ display: "block" }}
        data-ad-client="ca-pub-8336311096274398"
        data-ad-slot={slot}
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
    </div>
  );
}
