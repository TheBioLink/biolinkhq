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
  const [loading, setLoading] = useState(false);

  async function loadReports() {
    try {
      setLoading(true);

      const res = await fetch("/api/reports", {
        cache: "no-store",
      });

      const data = await res.json();
      setReports(data.reports || []);
    } catch (err) {
      console.error("Failed to load reports:", err);
    } finally {
      setLoading(false);
    }
  }

  async function closeReport(reportId) {
    try {
      await fetch("/api/reports", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "close",
          reportId,
        }),
      });

      await loadReports();
    } catch (err) {
      console.error(err);
    }
  }

  async function banReported(reportId) {
    const confirmed = confirm(
      "Ban this user and disable their account?"
    );

    if (!confirmed) return;

    try {
      const res = await fetch("/api/reports", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "ban-user",
          reportId,
        }),
      });

      if (!res.ok) throw new Error("Failed to ban user");

      await loadReports();
    } catch (err) {
      console.error(err);
      alert("Ban failed");
    }
  }

  useEffect(() => {
    loadReports();
  }, []);

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
        <div className="text-xs font-bold uppercase tracking-[0.18em] text-white/40">
          Moderation dashboard
        </div>

        <div className="mt-2 text-4xl font-black">
          {loading ? "..." : reports.length}
        </div>

        <p className="mt-2 text-sm text-white/50">
          Review flagged messages, inspect full chat logs, and take action.
        </p>
      </div>

      {/* EMPTY STATE */}
      {!loading && reports.length === 0 && (
        <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-8 text-center text-white/50">
          No active reports
        </div>
      )}

      {/* REPORT LIST */}
      {reports.map((r) => {
        const isOpen = openReportId === r._id;
        const log = r.messageLog?.length
          ? r.messageLog
          : r.recentMessages || [];

        return (
          <article
            key={r._id}
            className="overflow-hidden rounded-3xl border border-white/10 bg-[#10141f]"
          >
            {/* TOP BAR */}
            <div className="flex flex-col gap-4 border-b border-white/10 p-5 md:flex-row md:items-start md:justify-between">
              <div>
                <div className="text-xs font-bold uppercase tracking-[0.18em] text-red-300/80">
                  Message report
                </div>

                <h2 className="mt-2 text-2xl font-black">
                  @{r.reportedUsername || "unknown"}
                </h2>

                <div className="mt-2 space-y-1 text-sm text-white/50">
                  <p>
                    Reporter:{" "}
                    <span className="text-white/80">
                      @{r.reporterUsername || "unknown"}
                    </span>
                  </p>

                  <p className="text-white/40">
                    {formatDate(r.createdAt)}
                  </p>
                </div>
              </div>

              {/* ACTIONS */}
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() =>
                    setOpenReportId(isOpen ? null : r._id)
                  }
                  className="rounded-xl bg-blue-500/10 px-4 py-2 text-sm font-bold text-blue-200 hover:bg-blue-500/20"
                >
                  {isOpen ? "Hide" : "Review"}
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

            {/* BODY */}
            <div className="grid gap-5 p-5 lg:grid-cols-[1fr_1.3fr]">
              {/* REASON */}
              <section className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <h3 className="text-sm font-black text-white/70">
                  Reason
                </h3>
                <p className="mt-3 whitespace-pre-wrap text-sm text-white/75">
                  {r.reason || "No reason provided"}
                </p>
              </section>

              {/* PREVIEW */}
              <section className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <h3 className="text-sm font-black text-white/70">
                  Recent messages
                </h3>

                <div className="mt-3 space-y-2">
                  {(r.recentMessages || []).slice(-3).map((m, i) => (
                    <div
                      key={i}
                      className="rounded-xl bg-white/[0.04] p-3"
                    >
                      <div className="text-xs text-white/40">
                        {m.fromUsername} • {formatDate(m.createdAt)}
                      </div>
                      <div className="text-sm text-white/80">
                        {m.body}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            </div>

            {/* FULL LOG */}
            {isOpen && (
              <div className="border-t border-white/10 bg-black/30 p-5">
                <div className="mb-3 flex justify-between">
                  <h3 className="text-lg font-black">
                    Full chat log
                  </h3>
                  <span className="text-xs text-white/40">
                    {log.length} messages
                  </span>
                </div>

                <div className="max-h-[500px] space-y-3 overflow-y-auto rounded-2xl border border-white/10 bg-[#0d111b] p-4">
                  {log.map((m, i) => (
                    <div
                      key={i}
                      className="flex justify-start"
                    >
                      <div className="max-w-[85%] rounded-2xl bg-white/10 px-4 py-3">
                        <div className="mb-1 text-xs text-white/40">
                          {m.fromUsername} • {formatDate(m.createdAt)}
                        </div>
                        <div className="text-sm text-white">
                          {m.body}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </article>
        );
      })}
    </div>
  );
}
