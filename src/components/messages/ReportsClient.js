"use client";

import { useEffect, useState } from "react";

function formatDate(value) {
  if (!value) return "";
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export default function ReportsClient() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  async function loadReports() {
    setLoading(true);
    const res = await fetch("/api/messages?admin=1", { cache: "no-store" });
    const data = await res.json();
    setReports(data.reports || []);
    setLoading(false);
  }

  async function updateReport(reportId, status) {
    await fetch("/api/messages", {
      method: "PATCH",
      body: JSON.stringify({ action: "report-status", reportId, status }),
    });
    await loadReports();
  }

  useEffect(() => {
    loadReports();
  }, []);

  if (loading) {
    return (
      <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-8 text-white/50">
        Loading reports...
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
        <div className="text-sm font-bold uppercase tracking-[0.18em] text-white/40">
          Open reports
        </div>
        <div className="mt-2 text-4xl font-black">{reports.length}</div>
        <p className="mt-2 text-sm text-white/50">
          Reports are only visible to the account using the @itsnicbtw profile.
        </p>
      </div>

      {reports.length ? (
        reports.map((report) => (
          <article
            key={report._id}
            className="overflow-hidden rounded-3xl border border-white/10 bg-[#10141f] shadow-2xl"
          >
            <div className="flex flex-col gap-4 border-b border-white/10 p-5 md:flex-row md:items-start md:justify-between">
              <div>
                <div className="text-xs font-bold uppercase tracking-[0.18em] text-red-300/80">
                  Message report
                </div>
                <h2 className="mt-2 text-2xl font-black">
                  @{report.reportedUsername || "unknown"}
                </h2>
                <p className="mt-1 text-sm text-white/45">
                  Reported by @{report.reporterUsername || "unknown"} • {formatDate(report.createdAt)}
                </p>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => updateReport(report._id, "reviewed")}
                  className="rounded-xl bg-blue-500/10 px-4 py-2 text-sm font-bold text-blue-200 hover:bg-blue-500/20"
                >
                  Mark reviewed
                </button>
                <button
                  onClick={() => updateReport(report._id, "closed")}
                  className="rounded-xl bg-white/10 px-4 py-2 text-sm font-bold text-white/70 hover:bg-white/15"
                >
                  Close
                </button>
              </div>
            </div>

            <div className="grid gap-5 p-5 lg:grid-cols-[1fr_1.2fr]">
              <section className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <h3 className="text-sm font-black text-white/70">Reason</h3>
                <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-white/75">
                  {report.reason || "No reason provided."}
                </p>
              </section>

              <section className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <h3 className="text-sm font-black text-white/70">Recent message context</h3>
                <div className="mt-3 space-y-2">
                  {report.recentMessages?.length ? (
                    report.recentMessages.map((message, index) => (
                      <div key={index} className="rounded-xl bg-white/[0.04] p-3">
                        <div className="mb-1 text-xs font-bold text-white/40">
                          {message.fromUsername || "user"} • {formatDate(message.createdAt)}
                        </div>
                        <div className="text-sm text-white/75">{message.body}</div>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-white/45">No message context was saved.</p>
                  )}
                </div>
              </section>
            </div>
          </article>
        ))
      ) : (
        <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-8 text-center text-white/50">
          No open reports right now.
        </div>
      )}
    </div>
  );
}
