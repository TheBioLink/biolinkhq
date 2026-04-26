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
  const [openReportId, setOpenReportId] = useState(null);

  async function loadReports() {
    const res = await fetch("/api/messages?admin=1", { cache: "no-store" });
    const data = await res.json();
    setReports(data.reports || []);
  }

  async function closeReport(reportId) {
    await fetch("/api/messages", {
      method: "PATCH",
      body: JSON.stringify({ action: "report-status", reportId, status: "closed" }),
    });
    await loadReports();
  }

  async function banReported(reportId) {
    const confirmed = confirm("Ban this user and disable their profile?");
    if (!confirmed) return;

    await fetch("/api/messages", {
      method: "PATCH",
      body: JSON.stringify({ action: "ban-reported", reportId }),
    });
    await loadReports();
  }

  useEffect(() => {
    loadReports();
  }, []);

  return (
    <div className="space-y-5">
      <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
        <div className="text-sm font-bold uppercase tracking-[0.18em] text-white/40">
          Open reports
        </div>
        <div className="mt-2 text-4xl font-black">{reports.length}</div>
        <p className="mt-2 text-sm text-white/50">
          Use Review to open the full conversation log. Close removes it from this queue.
        </p>
      </div>

      {reports.length ? reports.map((r) => {
        const isOpen = openReportId === r._id;
        const log = r.messageLog?.length ? r.messageLog : r.recentMessages || [];

        return (
          <article key={r._id} className="overflow-hidden rounded-3xl border border-white/10 bg-[#10141f] shadow-2xl">
            <div className="flex flex-col gap-4 border-b border-white/10 p-5 md:flex-row md:items-start md:justify-between">
              <div>
                <div className="text-xs font-bold uppercase tracking-[0.18em] text-red-300/80">
                  Message report
                </div>
                <h2 className="mt-2 text-2xl font-black">@{r.reportedUsername || "unknown"}</h2>
                <div className="mt-2 space-y-1 text-sm text-white/50">
                  <p>Reported user email: <span className="text-white/75">{r.reportedEmail}</span></p>
                  <p>Reporter: <span className="text-white/75">@{r.reporterUsername || "unknown"}</span></p>
                  <p>Reporter email: <span className="text-white/75">{r.reporterEmail}</span></p>
                  <p>{formatDate(r.createdAt)}</p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setOpenReportId(isOpen ? null : r._id)}
                  className="rounded-xl bg-blue-500/10 px-4 py-2 text-sm font-bold text-blue-200 hover:bg-blue-500/20"
                >
                  {isOpen ? "Hide review" : "Review chat"}
                </button>
                <button
                  onClick={() => closeReport(r._id)}
                  className="rounded-xl bg-white/10 px-4 py-2 text-sm font-bold text-white/70 hover:bg-white/15"
                >
                  Close
                </button>
                <button
                  onClick={() => banReported(r._id)}
                  className="rounded-xl bg-red-500/10 px-4 py-2 text-sm font-bold text-red-200 hover:bg-red-500/20"
                >
                  Ban user
                </button>
              </div>
            </div>

            <div className="grid gap-5 p-5 lg:grid-cols-[1fr_1.2fr]">
              <section className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <h3 className="text-sm font-black text-white/70">Reason</h3>
                <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-white/75">
                  {r.reason || "No reason provided."}
                </p>
              </section>

              <section className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <h3 className="text-sm font-black text-white/70">Quick preview</h3>
                <div className="mt-3 space-y-2">
                  {(r.recentMessages || []).slice(-3).map((m, index) => (
                    <div key={index} className="rounded-xl bg-white/[0.04] p-3">
                      <div className="mb-1 text-xs font-bold text-white/40">
                        {m.fromUsername || "user"} • {formatDate(m.createdAt)}
                      </div>
                      <div className="text-sm text-white/75">{m.body}</div>
                    </div>
                  ))}
                  {!r.recentMessages?.length && <p className="text-sm text-white/45">No preview saved.</p>}
                </div>
              </section>
            </div>

            {isOpen && (
              <section className="border-t border-white/10 bg-black/20 p-5">
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="text-lg font-black">Full conversation log</h3>
                  <span className="text-xs text-white/40">{log.length} messages captured</span>
                </div>

                <div className="max-h-[520px] space-y-3 overflow-y-auto rounded-2xl border border-white/10 bg-[#0d111b] p-4">
                  {log.length ? log.map((m, index) => {
                    const isReported = m.fromEmail === r.reportedEmail || m.fromUsername === r.reportedUsername;

                    return (
                      <div key={index} className={`flex ${isReported ? "justify-start" : "justify-end"}`}>
                        <div className={`max-w-[82%] rounded-2xl px-4 py-3 ${isReported ? "bg-[#2b3140]" : "bg-blue-600"}`}>
                          <div className="mb-1 text-xs font-bold text-white/60">
                            {m.fromUsername || "user"} • {m.fromEmail || "email unavailable"} • {formatDate(m.createdAt)}
                          </div>
                          <div className="whitespace-pre-wrap text-sm leading-relaxed text-white">{m.body}</div>
                        </div>
                      </div>
                    );
                  }) : (
                    <p className="text-sm text-white/45">No full log was captured for this report.</p>
                  )}
                </div>
              </section>
            )}
          </article>
        );
      }) : (
        <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-8 text-center text-white/50">
          No open reports right now.
        </div>
      )}
    </div>
  );
}
