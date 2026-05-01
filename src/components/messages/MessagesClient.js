"use client";

import { useEffect, useState } from "react";

export default function MessagesClient() {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadMessages() {
      try {
        const res = await fetch("/api/messages");
        const data = await res.json();

        setMessages(data.messages || []);
      } catch (err) {
        console.error("Failed to load messages:", err);
      } finally {
        setLoading(false);
      }
    }

    loadMessages();
  }, []);

  if (loading) {
    return <div className="text-white/60">Loading messages...</div>;
  }

  return (
    <div className="space-y-3">
      {messages.length === 0 ? (
        <p className="text-white/50">No messages yet</p>
      ) : (
        messages.map((msg) => (
          <div
            key={msg.id}
            className={`rounded-xl p-3 ${
              msg.isMine
                ? "bg-blue-500/20 text-right"
                : "bg-white/5"
            }`}
          >
            <p>{msg.body}</p>
          </div>
        ))
      )}
    </div>
  );
}
