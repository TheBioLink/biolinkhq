"use client";

import AdBlock from "./AdBlock";

export default function AdWrapper({ slot }) {
  return (
    <div className="w-full max-w-4xl mx-auto my-6">
      <AdBlock slot={slot} />
    </div>
  );
}
