// src/app/application/[jobId]/page.js
"use client";
import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { v4 as uuidv4 } from "uuid";

// ── 10 PROFESSIONAL SCREENING QUESTIONS ──
const questions = [
  {
    id: "q1",
    question: "How many years of full-time experience do you have managing social media accounts that directly generated revenue or profit? Provide 2–3 specific examples with metrics (revenue, ROAS, CPA, etc.).",
  },
  {
    id: "q2",
    question: "What is the largest monthly ad spend you have personally managed? What average ROAS or ROI did you achieve across those campaigns?",
  },
  {
    id: "q3",
    question: "Describe your most profitable social media campaign to date (revenue or profit generated). Include platforms, budget, key strategies, exact results and why it succeeded.",
  },
  {
    id: "q4",
    question: "Provide a case study where you took over an underperforming or declining account and turned it around. Include before/after metrics.",
  },
  {
    id: "q5",
    question: "What is your proven framework for scaling follower growth while maintaining or improving engagement rate and revenue performance? Include real numbers.",
  },
  {
    id: "q6",
    question: "Rank the platforms where you have the strongest expertise for driving direct sales/conversions in 2025–2026. Provide recent examples.",
  },
  {
    id: "q7",
    question: "How do you adapt strategy when a major platform algorithm changes significantly? Give a concrete example from the past 12 months.",
  },
  {
    id: "q8",
    question: "Describe your process for identifying and scaling high-ROI UGC or influencer partnerships. How do you measure and optimize these?",
  },
  {
    id: "q9",
    question: "What KPIs do you prioritize when the business goal is profit rather than vanity metrics? How do you report these to stakeholders?",
  },
  {
    id: "q10",
    question: "In 400 words or less: Why are you the best fit to drive revenue growth for BiolinkHQ through social media? Sell us on your value.",
  },
];

const MAX_EMBED_DESCRIPTION = 3900; // Discord embed description limit

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

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleAnswerChange = (id, value) => {
    setAnswers((prev) => ({ ...prev, [id]: value }));
  };

  const isFormValid = () => {
    return (
      formData.email &&
      formData.discordUsername &&
      formData.biolinkHqUsername &&
      questions.every((q) => answers[q.id]?.trim().length > 0)
    );
  };

  const createBasicEmbed = () => {
    return {
      title: `Application ID: ${applicationId}`,
      description: `**Position:** Social Media Manager (Profit-Share)\n**Submitted:** ${new Date().toUTCString()}\n\n**Full Name:** ${formData.fullName || "—"}\n**Email:** ${formData.email || "—"}\n**Discord:** ${formData.discordUsername || "—"}\n**BiolinkHQ Username:** ${formData.biolinkHqUsername || "—"}\n\n**Compensation:** Profit split from revenue generated\n**Account Rules:** New accounts proposed by applicant, created with approved emails only, final setup & ownership by BiolinkHQ`,
      color: 0x1E90FF, // Blue
      footer: { text: "BiolinkHQ Application" },
    };
  };

  const createAnswersEmbeds = () => {
    const embeds = [];
    let currentDescription = "";

    questions.forEach((q, i) => {
      const answer = answers[q.id]?.trim() || "—";
      const entry = `**Q${i + 1}:** ${q.question}\n**Answer:** ${answer}\n\n`;

      if (currentDescription.length + entry.length > MAX_EMBED_DESCRIPTION) {
        embeds.push({
          title: embeds.length === 0 ? "Application Answers (Part 1)" : `Answers (Part ${embeds.length + 1})`,
          description: currentDescription.trim(),
          color: 0x00BFFF,
        });
        currentDescription = "";
      }

      currentDescription += entry;
    });

    if (currentDescription.trim()) {
      embeds.push({
        title: embeds.length === 0 ? "Application Answers" : `Answers (Part ${embeds.length + 1})`,
        description: currentDescription.trim(),
        color: 0x00BFFF,
      });
    }

    return embeds;
  };

  const sendToWebhook = async (embeds) => {
    const payload = {
      embeds,
      username: "BiolinkHQ Applications",
      avatar_url: "https://biolinkhq.com/favicon.ico",
    };

    const res = await fetch(process.env.NEXT_PUBLIC_WEBHOOK, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errorText = await res.text().catch(() => "Unknown");
      throw new Error(`Webhook failed (${res.status}): ${errorText}`);
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
      // Send basic info embed
      await sendToWebhook([createBasicEmbed()]);

      // Send answers embeds
      const answerEmbeds = createAnswersEmbeds();
      for (const embed of answerEmbeds) {
        await sendToWebhook([embed]);
        await new Promise((r) => setTimeout(r, 1500)); // avoid rate limits
      }

      setSubmitted(true);
    } catch (err) {
      console.error("Submission error:", err);
      setErrorMessage(err.message || "Failed to submit application. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const copyFullApp = () => {
    let text = `Application ID: ${applicationId}\n\n`;
    text += `Name: ${formData.fullName || "—"}\nEmail: ${formData.email || "—"}\nDiscord: ${formData.discordUsername || "—"}\nBiolinkHQ: ${formData.biolinkHqUsername || "—"}\n\n`;
    questions.forEach((q, i) => {
      text += `Q${i + 1}: ${q.question}\nA: ${answers[q.id]?.trim() || "—"}\n\n`;
    });
    navigator.clipboard.writeText(text);
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
          <p className="text-xl text-white/70 mb-8">This job opening does not exist or is no longer available.</p>
          <Link href="/application" className="text-blue-400 hover:text-blue-300 text-lg underline">← View All Open Positions</Link>
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
          <p className="text-xl text-white/80 mb-10">Thank you. Only top candidates will be contacted.</p>

          <div className="bg-gradient-to-br from-blue-900/30 to-black/50 border border-blue-500/40 rounded-2xl p-8 mb-10">
            <p className="text-2xl font-bold text-blue-300 mb-4">Your Application ID</p>
            <div className="text-2xl font-mono bg-black/60 p-5 rounded-xl mb-6 break-all select-all">
              {applicationId}
            </div>
            <p className="text-white/80 text-lg mb-6">
              **Save this ID.** When we contact you, provide this ID to confirm legitimacy.
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

          <Link href="/application" className="text-blue-400 hover:text-blue-300 text-lg underline">← Back to Open Positions</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0f1a] text-white py-16 px-6">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-16">
          <div className="inline-block bg-blue-900/40 text-blue-300 px-6 py-2 rounded-full font-semibold tracking-wide mb-6">
            Selective Recruitment – Profit-Share Role
          </div>
          <h1 className="text-5xl md:text-6xl font-black tracking-tight mb-6">
            Social Media Manager Application
          </h1>
          <p className="text-xl text-white/80 max-w-3xl mx-auto mb-6">
            High-bar process for revenue-focused talent. Only exceptional applications will proceed.
          </p>
          <p className="text-lg text-blue-300 font-medium">
            Upon submission you will receive a unique Application ID for verification.
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
            <h2 className="text-2xl font-bold mb-6 text-blue-300">Applicant Information</h2>
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

          {/* Questions */}
          <section className="space-y-10">
            <h2 className="text-2xl font-bold text-center text-blue-300">Screening Questions</h2>
            <p className="text-center text-white/60 mb-8">
              Provide detailed, metric-driven answers. All questions required.
            </p>

            {questions.map((q, i) => (
              <div key={q.id} className="bg-black/30 border border-white/10 rounded-3xl p-8">
                <label className="block text-lg font-semibold mb-4 text-white">
                  Question {i + 1}: {q.question} <span className="text-red-400">*</span>
                </label>
                <textarea
                  value={answers[q.id]}
                  onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                  className="w-full h-40 bg-white/5 border border-white/10 rounded-xl px-5 py-4 text-base focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30 resize-y min-h-[160px] transition"
                  placeholder="Be specific, include numbers, platforms, results..."
                  required
                />
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
                "Submit Application"
              )}
            </button>

            {!isFormValid() && (
              <p className="mt-4 text-red-400 text-sm">
                Please complete all required fields.
              </p>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
