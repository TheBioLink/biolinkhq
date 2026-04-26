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

  async function loadReports() {
    const res = await fetch("/api/messages?admin=1");
    const data = await res.json();
    setReports(data.reports || []);
  }

  async function action(type, reportId) {
    await fetch("/api/messages", {
      method: "PATCH",
      body: JSON.stringify({ action: type, reportId }),
    });
    loadReports();
  }

  useEffect(() => {
    loadReports();
  }, []);

  return (
    <div className="space-y-4">
      {reports.map(r => (
        <div key={r._id} className="border border-white/10 p-4 rounded">
          <div className="font-bold">@{r.reportedUsername}</div>
          <div className="text-sm text-white/50">Email: {r.reportedEmail}</div>
          <div className="text-sm text-white/50">Reported by: {r.reporterEmail}</div>
          <div className="mt-2">{r.reason}</div>

          <div className="mt-3 flex gap-2">
            <button onClick={()=>action("report-status", r._id)} className="bg-blue-500 px-3 py-1 rounded">Review</button>
            <button onClick={()=>action("ban-reported", r._id)} className="bg-red-500 px-3 py-1 rounded">Ban</button>
          </div>
        </div>
      ))}
    </div>
  );
}
