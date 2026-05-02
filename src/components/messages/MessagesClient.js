"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";

export default function MessagesClient({ initialMessages = [] }) {
  const router = useRouter();

  const [messages, setMessages] = useState(initialMessages);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [reportReason, setReportReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [moderationMode, setModerationMode] = useState(false);

  const containerRef = useRef(null);

  // ❌ FIX: no auto scroll forcing bottom
  useEffect(() => {
    // intentionally NOT forcing scroll
  }, [messages]);

  async function sendReport(message) {
    try {
      setLoading(true);

      const payload = {
        messageId: message._id,
        content: message.content,
        sender: message.sender,
        createdAt: message.createdAt,
        reason: reportReason || "No reason provided",
        chatLog: messages, // full context logs
      };

      const res = await fetch(
        "https://www.biolinkhq.lol/api/reports/create",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );

      if (!res.ok) throw new Error("Failed to submit report");

      setSelectedMessage(null);
      setReportReason("");

      // redirect to dashboard reports page
      router.push("/account/reports");
    } catch (err) {
      console.error(err);
      alert("Failed to report message");
    } finally {
      setLoading(false);
    }
  }

  async function deleteMessage(messageId) {
    try {
      await fetch("/api/messages/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messageId }),
      });

      setMessages((prev) =>
        prev.filter((m) => m._id !== messageId)
      );
    } catch (err) {
      console.error(err);
    }
  }

  async function flagMessage(messageId) {
    try {
      await fetch("/api/messages/flag", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messageId }),
      });
    } catch (err) {
      console.error(err);
    }
  }

  return (
    <div className="flex h-screen bg-[#0b0f19] text-white">
      {/* LEFT: CHAT LIST */}
      <div className="flex w-full flex-col border-r border-white/10">
        {/* HEADER */}
        <div className="flex items-center justify-between border-b border-white/10 p-4">
          <h1 className="text-lg font-bold">Messages</h1>

          <button
            onClick={() => setModerationMode(!moderationMode)}
            className={`rounded-lg px-3 py-1 text-xs font-bold transition ${
              moderationMode
                ? "bg-red-500 text-black"
                : "bg-white/10 text-white"
            }`}
          >
            {moderationMode ? "Moderation ON" : "Moderation"}
          </button>
        </div>

        {/* CHAT AREA */}
        <div
          ref={containerRef}
          className="flex-1 space-y-3 overflow-y-auto p-4"
        >
          {messages.map((msg) => (
            <div
              key={msg._id}
              className="group relative flex flex-col rounded-xl border border-white/10 bg-white/5 p-3"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-white/80">
                    {msg.sender?.name || "Unknown"}
                  </p>
                  <p className="text-base">{msg.content}</p>
                  <p className="mt-1 text-xs text-white/40">
                    {new Date(msg.createdAt).toLocaleString()}
                  </p>
                </div>

                {/* MODERATION BUTTONS */}
                {moderationMode && (
                  <div className="flex gap-2 opacity-0 transition group-hover:opacity-100">
                    <button
                      onClick={() => flagMessage(msg._id)}
                      className="rounded bg-yellow-500 px-2 py-1 text-xs text-black"
                    >
                      Flag
                    </button>

                    <button
                      onClick={() => deleteMessage(msg._id)}
                      className="rounded bg-red-500 px-2 py-1 text-xs text-black"
                    >
                      Delete
                    </button>

                    <button
                      onClick={() => setSelectedMessage(msg)}
                      className="rounded bg-blue-500 px-2 py-1 text-xs text-white"
                    >
                      Report
                    </button>
                  </div>
                )}
              </div>

              {/* normal report button */}
              {!moderationMode && (
                <button
                  onClick={() => setSelectedMessage(msg)}
                  className="mt-2 text-left text-xs text-blue-400 hover:underline"
                >
                  Report message
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* RIGHT: REPORT PANEL */}
      {selectedMessage && (
        <div className="w-[400px] border-l border-white/10 bg-[#0f1629] p-4">
          <h2 className="text-lg font-bold">Report Message</h2>

          <div className="mt-4 rounded-lg border border-white/10 bg-white/5 p-3">
            <p className="text-sm text-white/60">Message:</p>
            <p className="text-white">{selectedMessage.content}</p>
          </div>

          <textarea
            className="mt-4 w-full rounded-lg border border-white/10 bg-black/40 p-2 text-sm text-white"
            placeholder="Reason for report..."
            value={reportReason}
            onChange={(e) => setReportReason(e.target.value)}
          />

          <button
            onClick={() => sendReport(selectedMessage)}
            disabled={loading}
            className="mt-4 w-full rounded-lg bg-red-500 px-4 py-2 text-sm font-bold text-black hover:bg-red-400 disabled:opacity-50"
          >
            {loading ? "Submitting..." : "Submit Report"}
          </button>

          <button
            onClick={() => setSelectedMessage(null)}
            className="mt-2 w-full text-xs text-white/50 hover:text-white"
          >
            Cancel
          </button>

          {/* CHAT LOGS */}
          <div className="mt-6">
            <h3 className="text-sm font-bold text-white/70">
              Chat Logs (Context)
            </h3>
            <div className="mt-2 max-h-[200px] overflow-y-auto text-xs text-white/50">
              {messages.slice(-10).map((m) => (
                <div key={m._id}>
                  {m.sender?.name}: {m.content}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
