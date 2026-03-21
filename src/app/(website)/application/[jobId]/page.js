// src/app/application/[jobId]/page.js
"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { v4 as uuidv4 } from "uuid";

// ── 30 HARD SCREENING QUESTIONS ──
const questions = [
  // (your full list of 30 questions here - kept the same)
  { id: "q1", question: "How many years of full-time professional experience do you have managing social media for brands/clients that generated measurable revenue or profit growth? List 2–3 specific examples with exact metrics (e.g. +$X revenue, +Y% ROAS).", type: "textarea" },
  // ... rest of questions q2 to q30 ...
  { id: "q30", question: "In 500 words or less: Sell yourself as the best possible social media manager for a profit-focused, high-growth project like BiolinkHQ.", type: "textarea" },
];

const MAX_MESSAGE_LENGTH = 1800; // Discord safe limit per message

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
  const [errorMessage, setErrorMessage] = useState("");
  const [copySuccess, setCopySuccess] = useState(false);
  const [copyIdSuccess, setCopyIdSuccess] = useState(false);

  // Track character counts for each answer
  const [charCounts, setCharCounts] = useState(
    questions.reduce((acc, q) => ({ ...acc, [q.id]: 0 }), {})
  );

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleAnswerChange = (id, value) => {
    setAnswers((prev) => ({ ...prev, [id]: value }));
    setCharCounts((prev) => ({ ...prev, [id]: value.length }));
  };

  const isFormValid = () => {
    return (
      formData.email &&
      formData.discordUsername &&
      formData.biolinkHqUsername &&
      questions.every((q) => answers[q.id]?.trim().length > 0)
    );
  };

  const formatBasicInfo = () => {
    return `💼 **APPLICATION ID:** ${applicationId}\n\n` +
           `**Position:** Social Media Manager (Profit-Share)\n` +
           `**Submitted:** ${new Date().toUTCString()}\n\n` +
           `**Full Name:** ${formData.fullName || "—"} \n` +
           `**Email:** ${formData.email || "—"} \n` +
           `**Discord Username:** ${formData.discordUsername || "—"} \n` +
           `**BiolinkHQ Username:** ${formData.biolinkHqUsername || "—"} \n\n` +
           `**Compensation Model:** Profit split from revenue generated\n` +
           `**Account Creation Rules:** Applicant may propose new accounts using only approved company emails. Final setup and ownership remain with BiolinkHQ.\n\n`;
  };

  const chunkAnswers = () => {
    let text = "📋 **Detailed Answers**\n\n";
    questions.forEach((q, i) => {
      text += `**Q${i + 1}:** ${q.question}\n**Answer:** ${answers[q.id]?.trim() || "—"} \n\n──────────────────────────────\n\n`;
    });

    const chunks = [];
    let current = "";
    const lines = text.split("\n");

    for (const line of lines) {
      if (current.length + line.length + 1 > MAX_MESSAGE_LENGTH) {
        chunks.push(current.trim());
        current = "";
      }
      current += line + "\n";
    }
    if (current.trim()) chunks.push(current.trim());

    return chunks;
  };

  const sendToWebhook = async (content) => {
    const payload = {
      content,
      username: "BiolinkHQ Applications",
      avatar_url: "https://biolinkhq.com/favicon.ico",
    };

    const res = await fetch(process.env.NEXT_PUBLIC_WEBHOOK, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errorText = await res.text().catch(() => "Unknown error");
      throw new Error(`Webhook error ${res.status}: ${errorText}`);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage("");

    if (!isFormValid()) {
      setErrorMessage("Please complete all required fields.");
      return;
    }

    setLoading(true);

    try {
      // Send basic info first
      await sendToWebhook(formatBasicInfo());

      // Send answers in chunks
      const chunks = chunkAnswers();
      for (const chunk of chunks) {
        await sendToWebhook(chunk);
        // Small delay to avoid rate limiting
        await new Promise((resolve) => setTimeout(resolve, 1200));
      }

      setSubmitted(true);
    } catch (err) {
      console.error("Submission failed:", err);
      setErrorMessage(err.message || "Failed to submit application. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  const copyFullApp = () => {
    const fullText = formatBasicInfo() + chunkAnswers().join("\n\n");
    navigator.clipboard.writeText(fullText);
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
          <Link href="/application" className="text-blue-400 hover:text-blue-300 text-lg underline">
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
          <div className="text-7xl mb-8">🎯</div>
          <h1 className="text-5xl font-black mb-6">Application Submitted Successfully</h1>
          <p className="text-xl text-white/80 mb-10">
            Thank you for your submission. Only top candidates will be contacted via Discord.
          </p>

          <div className="bg-gradient-to-br from-blue-900/30 to-black/50 border border-blue-500/40 rounded-2xl p-8 mb-10">
            <p className="text-2xl font-bold text-blue-300 mb-6">Your Application ID</p>
            <div className="text-2xl font-mono bg-black/60 p-5 rounded-xl mb-6 break-all select-all">
              {applicationId}
            </div>
            <p className="text-white/80 text-lg mb-6">
              **Important:** Save this ID. When we reach out, please provide it to verify your application and protect against impersonation.
            </p>
            <button
              onClick={copyAppId}
              className="w-full sm:w-auto bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 px-8 rounded-xl transition mb-6 text-lg flex items-center justify-center gap-3 mx-auto"
            >
              {copyIdSuccess ? "✅ ID Copied!" : "Copy Application ID"}
            </button>
          </div>

          <button
            onClick={copyFullApp}
            className="bg-white/10 hover:bg-white/20 text-white font-bold py-4 px-10 rounded-xl transition text-lg flex items-center gap-3 mx-auto mb-10"
          >
            {copySuccess ? "✅ Full Application Copied!" : "Copy Full Application (Backup)"}
          </button>

          <Link href="/application" className="text-blue-400 hover:text-blue-300 text-lg underline">
            ← Return to Open Positions
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0f1a] text-white py-16 px-6">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-16">
          <div className="inline-block bg-blue-900/40 text-blue-300 px-6 py-2 rounded-full font-semibold tracking-wide mb-6">
            Selective Recruitment – Profit-Share Opportunity
          </div>
          <h1 className="text-5xl md:text-6xl font-black tracking-tight mb-6">
            Social Media Manager Application
          </h1>
          <p className="text-xl text-white/80 max-w-3xl mx-auto mb-6">
            We are looking for exceptional talent who can drive real revenue growth. This is a high-bar, selective process.
          </p>
          <p className="text-lg text-blue-300 font-medium">
            After submission you will receive a unique Application ID for verification.
          </p>
        </div>

        {errorMessage && (
          <div className="bg-red-900/40 border border-red-500/50 text-red-200 p-6 rounded-2xl mb-10 text-center">
            {errorMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-12">
          {/* Basic Information */}
          <section className="bg-black/30 border border-white/10 rounded-3xl p-8">
            <h2 className="text-2xl font-bold mb-6 text-blue-300">Personal Information</h2>
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <label className="block text-sm font-medium mb-2 text-white/80">Full Name</label>
                <input
                  type="text"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleInputChange}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-5 py-3 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition"
                  placeholder="Your full name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 text-white/80">
                  Email <span className="text-red-400">*</span>
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-5 py-3 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition"
                  placeholder="you@domain.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 text-white/80">
                  Discord Username <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  name="discordUsername"
                  value={formData.discordUsername}
                  onChange={handleInputChange}
                  required
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-5 py-3 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition"
                  placeholder="@username or username#0000"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 text-white/80">
                  BiolinkHQ Username <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  name="biolinkHqUsername"
                  value={formData.biolinkHqUsername}
                  onChange={handleInputChange}
                  required
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-5 py-3 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition"
                  placeholder="yourusername"
                />
              </div>
            </div>
          </section>

          {/* Screening Questions */}
          <section className="space-y-10">
            <h2 className="text-2xl font-bold text-center text-blue-300">Screening Questions</h2>
            <p className="text-center text-white/60 mb-8">
              All questions are required. Provide detailed, metric-driven responses.
            </p>

            {questions.map((q, i) => (
              <div key={q.id} className="bg-black/30 border border-white/10 rounded-3xl p-8">
                <label className="block text-lg font-semibold mb-4 text-white">
                  Question {i + 1}: {q.question} <span className="text-red-400">*</span>
                </label>
                <textarea
                  value={answers[q.id]}
                  onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                  className="w-full h-40 bg-white/5 border border-white/10 rounded-xl px-5 py-4 text-base focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30 resize-y min-h-[140px] transition"
                  placeholder="Provide detailed, specific answers with metrics where possible..."
                  required
                />
                <div className="mt-2 text-right text-sm text-white/50">
                  {charCounts[q.id]} characters
                </div>
              </div>
            ))}
          </section>

          <div className="pt-12 text-center">
            <button
              type="submit"
              disabled={loading || !isFormValid()}
              className={`w-full max-w-lg mx-auto py-6 px-10 rounded-2xl font-black text-2xl transition-all shadow-xl ${
                loading || !isFormValid()
                  ? "bg-gray-700 cursor-not-allowed"
                  : "bg-blue-600 hover:bg-blue-500 active:scale-98"
              }`}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-3">
                  <svg className="animate-spin h-6 w-6" viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  </svg>
                  Submitting...
                </span>
              ) : (
                "Submit Application – Drive Profits"
              )}
            </button>

            {!isFormValid() && (
              <p className="mt-4 text-red-400 text-sm">
                Please complete all required fields before submitting.
              </p>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
