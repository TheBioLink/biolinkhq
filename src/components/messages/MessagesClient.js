"use client";

import { useEffect, useRef, useState } from "react";

export default function MessagesClient({ initialMessages = [] }) {
  const [messages, setMessages] = useState(initialMessages);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [loading, setLoading] = useState(false);

  const containerRef = useRef(null);

  // ❌ NO AUTO SCROLL (fixes your "forced bottom" issue)
  useEffect(() => {
    // intentionally disabled auto-scroll
  }, [messages]);

  async function reportMessage(message) {
    try {
      setLoading(true);

      const res = await fetch("/api/reports/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messageId: message._id,
          content: message.content,
          sender: message.sender,
          createdAt: message.createdAt,
          chatLog: messages,
        }),
      });

      if (!res.ok) throw new Error("Failed to report");

      setSelectedMessage(null);
      alert("Report sent");
    } catch (err) {
      console.error(err);
      alert("Failed to report message");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex h-screen overflow-hidden bg-[#0b0f19] text-white">
      {/* LEFT PANEL */}
      <div className="flex w-full flex-col border-r border-white/10">
        {/* HEADER */}
        <div className="flex items-center justify-between border-b border-white/10 p-4">
          <div>
            <h1 className="text-lg font-bold">Messages</h1>
            <p className="text-xs text-white/40">Chat with other users</p>
          </div>
        </div>

        {/* MESSAGE LIST */}
        <div
          ref={containerRef}
          className="flex-1 overflow-y-auto p-4 min-h-0"
        >
          {/* EMPTY STATE FIX */}
          {messages.length === 0 && (
            <div className="flex h-full items-center justify-center text-white/40">
              No messages yet
            </div>
          )}

          {/* MESSAGES */}
          {messages.map((msg) => (
            <div
              key={msg._id}
              className="group mb-3 rounded-xl border border-white/10 bg-white/5 p-3"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-sm font-bold text-white/70">
                    {msg.sender?.name || "Unknown"}
                  </div>
                  <div className="text-sm text-white">
                    {msg.content}
                  </div>
                </div>

                {/* REPORT BUTTON */}
                <button
                  onClick={() => setSelectedMessage(msg)}
                  className="opacity-0 transition group-hover:opacity-100 rounded-lg bg-red-500/10 px-3 py-1 text-xs text-red-300 hover:bg-red-500/20"
                >
                  Report
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* RIGHT PANEL (REPORT UI) */}
      {selectedMessage && (
        <div className="w-[380px] border-l border-white/10 bg-[#0f1629] p-4">
          <h2 className="text-lg font-bold">Report Message</h2>

          <div className="mt-4 rounded-xl border border-white/10 bg-white/5 p-3">
            <p className="text-xs text-white/40">Message</p>
            <p className="mt-1 text-white">
              {selectedMessage.content}
            </p>
          </div>

          <div className="mt-4 text-xs text-white/40">
            Sender: {selectedMessage.sender?.name}
          </div>

          <button
            onClick={() => reportMessage(selectedMessage)}
            disabled={loading}
            className="mt-4 w-full rounded-xl bg-red-500 px-4 py-2 text-sm font-bold text-black hover:bg-red-400 disabled:opacity-50"
          >
            {loading ? "Sending..." : "Submit Report"}
          </button>

          <button
            onClick={() => setSelectedMessage(null)}
            className="mt-2 w-full text-xs text-white/40 hover:text-white"
          >
            Cancel
          </button>

          {/* CHAT CONTEXT */}
          <div className="mt-6">
            <h3 className="text-sm font-bold text-white/60">
              Chat context
            </h3>

            <div className="mt-2 max-h-[250px] overflow-y-auto space-y-2 text-xs text-white/40">
              {messages.slice(-8).map((m) => (
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
