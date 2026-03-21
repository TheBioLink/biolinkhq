// src/app/application/page.js
import Link from "next/link";

export default function ApplicationsOverview() {
  const jobs = [
    {
      id: "social-media-manager",
      title: "Social Media Manager (Profit-Share)",
      description:
        "Drive revenue across our social channels. Earn a split of profits generated from the accounts you manage and grow. You may propose new social accounts (using only company-approved emails). Final setup and full ownership retained by BiolinkHQ.",
      requirements: "Proven revenue-driving experience required. Rigorous 10-question screening.",
      badge: "High-Earning • Remote • Selective",
    },
    // You can easily add more jobs here later
    // {
    //   id: "content-strategist",
    //   title: "Content Strategist",
    //   ...
    // }
  ];

  return (
    <div className="min-h-screen bg-[#0a0f1a] text-white py-16 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <div className="inline-block bg-blue-600/20 px-6 py-2 rounded-full text-blue-300 font-bold tracking-widest mb-6">
            OPEN POSITIONS @ BIOLINKHQ
          </div>
          <h1 className="text-5xl md:text-6xl font-black tracking-tight mb-6">
            Join the Team – Drive Profits, Get Paid
          </h1>
          <p className="text-xl md:text-2xl text-white/70 max-w-3xl mx-auto">
            Selective roles with real upside. Only top performers move forward.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {jobs.map((job) => (
            <div
              key={job.id}
              className="bg-black/30 border border-white/10 rounded-3xl p-8 flex flex-col hover:border-blue-500/50 transition-all group"
            >
              <div className="mb-6">
                <span className="inline-block bg-blue-500/20 text-blue-300 px-4 py-1 rounded-full text-sm font-bold mb-4">
                  {job.badge}
                </span>
                <h2 className="text-3xl font-black mb-4">{job.title}</h2>
                <p className="text-white/70 mb-4">{job.description}</p>
                <p className="text-sm text-white/50">{job.requirements}</p>
              </div>

              <div className="mt-auto">
                <Link href={`/application/${job.id}`}>
                  <button className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black text-lg py-5 rounded-2xl transition group-hover:scale-[1.02]">
                    Apply for {job.title} →
                  </button>
                </Link>
              </div>
            </div>
          ))}
        </div>

        {jobs.length === 0 && (
          <div className="text-center py-20 text-white/50 text-xl">
            No open positions right now. Check back soon!
          </div>
        )}

        <div className="mt-16 text-center text-white/40 text-sm">
          Applications are manually reviewed. Expect Discord contact within 72 hours for qualified candidates.
        </div>
      </div>
    </div>
  );
}
