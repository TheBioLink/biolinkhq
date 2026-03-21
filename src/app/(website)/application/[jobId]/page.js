// src/app/application/[jobId]/page.js
"use client";
import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { v4 as uuidv4 } from "uuid";

// ── 30 HARD SCREENING QUESTIONS ──
const questions = [
  { id: "q1", question: "How many years of full-time professional experience do you have managing social media for brands/clients that generated measurable revenue or profit growth? List 2–3 specific examples with exact metrics (e.g. +$X revenue, +Y% ROAS).", type: "textarea" },
  { id: "q2", question: "What is the largest monthly ad spend you have personally managed across platforms? What was the average ROAS/ROI achieved?", type: "textarea" },
  { id: "q3", question: "Describe your single most profitable social media campaign ever (revenue generated or profit margin). Include platforms, budget, strategy, exact results, and why it worked.", type: "textarea" },
  { id: "q4", question: "Provide a case study where you turned around an underperforming account (stagnant/declining). What metrics improved and by how much?", type: "textarea" },
  { id: "q5", question: "What is your proven process for scaling follower growth while maintaining or increasing engagement rate? Give numbers from a real account.", type: "textarea" },
  { id: "q6", question: "Which platforms do you have the deepest expertise in for driving direct sales/conversions in 2025–2026? Rank them and explain why with recent examples.", type: "textarea" },
  { id: "q7", question: "How do you adapt strategy when a major platform changes its algorithm (e.g. TikTok FYP shifts, Instagram Reels priority changes)? Cite a specific adaptation you made in the last 12 months.", type: "textarea" },
  { id: "q8", question: "Describe your exact method for identifying high-ROI UGC or influencer content. How do you vet and negotiate deals?", type: "textarea" },
  { id: "q9", question: "What tools/stack do you use daily for scheduling, analytics, listening, and reporting? Why these over alternatives?", type: "textarea" },
  { id: "q10", question: "How do you calculate and optimize cost-per-acquisition (CPA) or cost-per-purchase across paid social campaigns?", type: "textarea" },
  { id: "q11", question: "Give an example of a crisis (shadowban, backlash, negative virality) you managed. What actions did you take and what was the outcome (sentiment recovery, follower retention)?", type: "textarea" },
  { id: "q12", question: "How do you build and maintain a consistent brand voice across 5+ platforms? Provide a real example where this drove measurable results.", type: "textarea" },
  { id: "q13", question: "What is your approach to A/B testing creatives, copy, and targeting? Share results from your best test.", type: "textarea" },
  { id: "q14", question: "How do you use lookalike audiences and retargeting to scale profitable campaigns? Include platform-specific tactics.", type: "textarea" },
  { id: "q15", question: "Describe your 30/60/90-day plan for taking over an existing brand's socials with the goal of increasing monthly revenue by 30%+.", type: "textarea" },
  { id: "q16", question: "How do you stay ahead of emerging trends (e.g. new formats, AI tools, platform features) and turn them into revenue opportunities?", type: "textarea" },
  { id: "q17", question: "What KPIs do you prioritize when the primary business goal is profit, not vanity metrics?", type: "textarea" },
  { id: "q18", question: "Tell us about a time you had to push back on a client/brand decision that would hurt performance. What happened?", type: "textarea" },
  { id: "q19", question: "How do you collaborate with other teams (e.g. product, e-commerce, design) to align social with revenue goals?", type: "textarea" },
  { id: "q20", question: "Propose a strategy for launching a brand-new social account from 0 followers that could generate revenue within 90 days. Platforms, content pillars, monetization path.", type: "textarea" },
  { id: "q21", question: "What email(s) would you recommend we use for creating new accounts you manage? Why those specifically (security, branding, recovery)?", type: "textarea" },
  { id: "q22", question: "If we approve you to propose new social accounts, how would you structure ownership/handover so the company retains full control?", type: "textarea" },
  { id: "q23", question: "Why do you want to work with BiolinkHQ specifically? How do you see profit-sharing working in practice for you?", type: "textarea" },
  { id: "q24", question: "What is your biggest social media failure and what did you learn that made you better at driving profits?", type: "textarea" },
  { id: "q25", question: "How do you forecast revenue impact from social initiatives (e.g. expected monthly recurring revenue from a new campaign)?", type: "textarea" },
  { id: "q26", question: "Describe your process for auditing an existing social media presence before taking it over. What red flags cause you to walk away?", type: "textarea" },
  { id: "q27", question: "How do you handle burnout while maintaining high performance on multiple client/brand accounts?", type: "textarea" },
  { id: "q28", question: "What emerging social platform or feature do you think will be the biggest revenue driver in 2026–2027? Why and how would you capitalize on it?", type: "textarea" },
  { id: "q29", question: "Provide links to 2–3 live accounts or campaigns you personally grew/managed that generated significant revenue (blur sensitive data if needed).", type: "textarea" },
  { id: "q30", question: "In 500 words or less: Sell yourself as the best possible social media manager for a profit-focused, high-growth project like BiolinkHQ.", type: "textarea" },
];

export default function JobApplication() {
  const params = useParams();
  const jobId = params.jobId;

  const [applicationId] = useState(() => uuidv4());

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    discordUsername: "",
    biolinkHqUsername: "",
  });

  const [answers, setAnswers] = useState(
    questions.reduce((acc, q) => ({ ...acc, [q.id]: "" }), {})
  );

  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const [copyIdSuccess, setCopyIdSuccess] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleAnswerChange = (id, value) => {
    setAnswers((prev) => ({ ...prev, [id]: value }));
  };

  const formatApplication = () => {
    let text = `💰 **APPLICATION ID: ${applicationId}**\n\n`;
    text += `**Job:** Social Media Manager (Profit-Share)\n`;
    text += `**Submitted at:** ${new Date().toUTCString()}\n\n`;
    text += `**Full Name:** ${formData.fullName || "—"}\n`;
    text += `**Email:** ${formData.email || "—"}\n`;
    text += `**Discord Username:** ${formData.discordUsername || "—"}\n`;
    text += `**BiolinkHQ Username:** ${formData.biolinkHqUsername || "—"}\n\n`;
    text += `**Compensation:** Profit split from revenue generated\n`;
    text += `**Account Rules:** Propose new accounts → use approved emails only → BiolinkHQ owns & sets up\n\n`;
    text += `──────────────────────────────\n\n`;

    questions.forEach((q, i) => {
      text += `**Q${i + 1}:** ${q.question}\n`;
      text += `**A:** ${answers[q.id]?.trim() || "—"}\n\n`;
      text += `──────────────────────────────\n\n`;
    });

    return text;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.email || !formData.discordUsername || !formData.biolinkHqUsername) {
      alert("Email, Discord username, and BiolinkHQ username are required.");
      return;
    }

    const missing = questions.some((q) => !answers[q.id]?.trim());
    if (missing) {
      alert("All 30 questions are required. This is a selective, profit-sharing position.");
      return;
    }

    setLoading(true);

    const payload = {
      content: formatApplication(),
      username: "BiolinkHQ Applications",
      avatar_url: "https://biolinkhq.com/favicon.ico",
    };

    try {
      const res = await fetch(process.env.NEXT_PUBLIC_WEBHOOK, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Submission failed");

      setSubmitted(true);
    } catch (err) {
      alert("Error submitting application. Please try again.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const copyFullApp = () => {
    navigator.clipboard.writeText(formatApplication());
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2500);
  };

  const copyAppId = () => {
    navigator.clipboard.writeText(applicationId);
    setCopyIdSuccess(true);
    setTimeout(() => setCopyIdSuccess(false), 2500);
  };

  if (jobId !== "social-media-manager") {
    return (
      <div className="min-h-screen bg-[#0a0f1a] text-white flex items-center justify-center px-4 py-12">
        <div className="text-center max-w-lg">
          <h1 className="text-4xl font-black mb-6">Position Not Found</h1>
          <p className="text-xl text-white/70 mb-8">
            This job opening does not exist or is no longer available.
          </p>
          <Link href="/application" className="text-blue-400 hover:text-blue-300 text-lg">
            ← View All Open Positions
          </Link>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-[#0a0f1a] text-white flex items-center justify-center px-4 py-12">
        <div className="max-w-3xl text-center">
          <div className="text-7xl mb-8">✅</div>
          <h1 className="text-5xl font-black mb-6">Application Received</h1>

          <div className="bg-black/30 border border-blue-500/30 rounded-2xl p-8 mb-10">
            <p className="text-2xl font-bold text-blue-300 mb-4">
              Your Application ID
            </p>
            <div className="text-2xl font-mono bg-black/50 p-4 rounded-xl mb-4 break-all">
              {applicationId}
            </div>
            <p className="text-white/80 mb-6 text-lg">
              **Save this ID now.**<br />
              When we contact you (via Discord/email), we will ask for it to verify your application.<br />
              This protects you from fake/scam messages pretending to be us.
            </p>
            <button
              onClick={copyAppId}
              className="inline-flex items-center gap-3 bg-blue-600 hover:bg-blue-500 px-8 py-4 rounded-xl text-lg font-bold transition mb-6"
            >
              {copyIdSuccess ? "✅ ID Copied!" : "Copy Application ID"}
            </button>
          </div>

          <button
            onClick={copyFullApp}
            className="inline-flex items-center gap-3 bg-white/10 hover:bg-white/20 px-10 py-5 rounded-2xl text-xl font-bold transition mb-8"
          >
            {copySuccess ? "✅ Full App Copied!" : "Copy Full Application (for records)"}
          </button>

          <Link href="/application" className="block text-blue-400 hover:text-blue-300 text-lg mt-4">
            ← Back to Open Positions
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0f1a] text-white py-16 px-6">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-5xl md:text-6xl font-black tracking-tight mb-4">
            Apply for Social Media Manager (Profit-Share)
          </h1>
          <p className="text-xl text-white/70">
            This is a selective, high-bar process. Only complete, revenue-proven applications will be reviewed.
          </p>
          <p className="mt-4 text-blue-300 font-medium">
            After submission you will receive a unique Application ID to verify our future contact with you.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-12">
          {/* Basic Info */}
          <div className="grid md:grid-cols-2 gap-8 bg-black/20 p-8 rounded-3xl border border-white/10">
            <div>
              <label className="block text-sm font-bold mb-3 text-white/80">FULL NAME</label>
              <input
                type="text"
                name="fullName"
                value={formData.fullName}
                onChange={handleInputChange}
                className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-lg focus:border-blue-500 focus:outline-none"
                placeholder="Your Name"
              />
            </div>
            <div>
              <label className="block text-sm font-bold mb-3 text-white/80">EMAIL <span className="text-red-400">*</span></label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-lg focus:border-blue-500 focus:outline-none"
                placeholder="you@domain.com"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-bold mb-3 text-white/80">DISCORD USERNAME <span className="text-red-400">*</span></label>
              <input
                type="text"
                name="discordUsername"
                value={formData.discordUsername}
                onChange={handleInputChange}
                className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-lg focus:border-blue-500 focus:outline-none"
                placeholder="@username or username#0000"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-bold mb-3 text-white/80">BIOLINKHQ USERNAME <span className="text-red-400">*</span></label>
              <input
                type="text"
                name="biolinkHqUsername"
                value={formData.biolinkHqUsername}
                onChange={handleInputChange}
                className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-lg focus:border-blue-500 focus:outline-none"
                placeholder="yourusername"
                required
              />
            </div>
          </div>

          {/* Questions */}
          <div className="space-y-12">
            {questions.map((q, i) => (
              <div key={q.id} className="bg-black/20 p-8 rounded-3xl border border-white/10">
                <label className="block text-lg font-bold mb-4">
                  Question {i + 1}: {q.question} <span className="text-red-400">*</span>
                </label>
                <textarea
                  value={answers[q.id]}
                  onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                  className="w-full h-48 bg-white/5 border border-white/10 rounded-2xl px-6 py-5 text-base focus:border-blue-500 focus:outline-none resize-y min-h-[140px]"
                  placeholder="Be detailed. Include numbers, platforms, dates, results..."
                  required
                />
              </div>
            ))}
          </div>

          <div className="pt-10 text-center">
            <button
              type="submit"
              disabled={loading}
              className="w-full max-w-md mx-auto bg-blue-600 hover:bg-blue-500 disabled:bg-gray-800 disabled:cursor-not-allowed text-white font-black text-2xl py-6 rounded-3xl transition flex items-center justify-center gap-4 shadow-xl"
            >
              {loading ? "SUBMITTING..." : "SUBMIT – I WANT TO DRIVE PROFITS"}
            </button>
            <p className="mt-6 text-white/50 text-sm">
              Only top performers will be contacted. Expect Discord follow-up.
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
