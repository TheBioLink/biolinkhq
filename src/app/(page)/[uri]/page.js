// src/app/(page)/[uri]/page.js
import mongoose from "mongoose";
import { Page } from "@/models/Page";
import { User } from "@/models/User";
import { Ban } from "@/models/Ban";
import PublicLinks from "@/components/PublicLinks";
import ProfileShareButton from "@/components/ProfileShareButton";
import ProfileAnalyticsTracker from "@/components/analytics/ProfileAnalyticsTracker";

const norm = (s) => (s || "").toString().trim().toLowerCase();

function BannedScreen({ reason }) {
  return (
    <div className="min-h-screen bg-[#0b0f14] text-white flex items-center justify-center px-4">
      <div className="w-full max-w-xl rounded-3xl border border-white/10 bg-black/30 p-8 text-center">
        <h1 className="text-3xl font-black">This page has been banned</h1>
        <p className="mt-3 text-white/75">This profile is not available.</p>

        <div className="mt-6 rounded-2xl border border-red-400/20 bg-red-500/10 p-4 text-left">
          <div className="text-xs font-bold uppercase tracking-[0.24em] text-red-200/80">
            Reason
          </div>
          <div className="mt-2 text-sm text-red-50">
            {reason || "No reason provided."}
          </div>
        </div>
      </div>
    </div>
  );
}

function Badge({ children, tone = "blue" }) {
  const base =
    "inline-flex items-center rounded-full px-3 py-1 text-xs font-extrabold border";
  const tones = {
    blue: "bg-blue-500/15 text-blue-200 border-blue-400/20",
    gold: "bg-yellow-500/15 text-yellow-200 border-yellow-400/20",
  };

  return <span className={`${base} ${tones[tone] || tones.blue}`}>{children}</span>;
}

export default async function PageByUri({ params }) {
  const { uri } = params;

  await mongoose.connect(process.env.MONGO_URI);

  const uriBan = await Ban.findOne({
    type: "uri",
    identifier: norm(uri),
  }).lean();

  if (uriBan) {
    return <BannedScreen reason={uriBan.reason} />;
  }

  const page = await Page.findOne({ uri }).lean();

  if (!page) {
    return (
      <div className="min-h-screen bg-[#0b0f14
