"use client";

import { useEffect, useRef, useState } from "react";

function initials(name = "?") {
  return String(name || "?").slice(0, 1).toUpperCase();
}

function timeLabel(value) {
  if (!value) return "";
  return new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export default function MessagesClient() {
  const [search, setSearch] = useState("");
  const [results, setResults] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [blocked, setBlocked] = useState([]);
  const [target, setTarget] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [isLive, setIsLive] = useState(true);
  const containerRef = useRef(null);

  async function loadBlocked() {
    const res = await fetch("/api/messages?blocked=1");
    const data = await res.json();
    setBlocked(data.blocked || []);
  }

  async function loadConversations() {
    const res = await fetch("/api/messages");
    const data = await res.json();
    setConversations(data.conversations || []);
  }

  async function loadMessages(username) {
    const res = await fetch(`/api/messages?user=${username}`);
    const data = await res.json();
    setMessages(data.messages || []);
    setTarget(data.target);
  }

  async function send() {
    if (!text || !target) return;

    await fetch("/api/messages", {
      method: "POST",
      body: JSON.stringify({ username: target.username, body: text }),
    });

    setText("");
    loadMessages(target.username);
  }

  async function unblock(username) {
    await fetch("/api/messages", {
      method: "PATCH",
      body: JSON.stringify({ action: "unblock", username }),
    });
    loadBlocked();
    loadConversations();
  }

  useEffect(() => {
    loadConversations();
    loadBlocked();
  }, []);

  useEffect(() => {
    if (!isLive || !target) return;

    const i = setInterval(() => loadMessages(target.username), 1200);
    return () => clearInterval(i);
  }, [target, isLive]);

  return (
    <div className="flex h-[70vh] gap-4">
      <div className="w-1/3 overflow-y-auto border border-white/10 p-3">
        <div className="text-xs text-white/40 mb-2">Recent</div>
        {conversations.map(c => (
          <div key={c.username} onClick={()=>loadMessages(c.username)} className="p-2 hover:bg-white/10 cursor-pointer">
            {c.displayName}
          </div>
        ))}

        <div className="mt-4 text-xs text-white/40">Blocked</div>
        {blocked.map(b => (
          <div key={b.username} className="flex justify-between p-2">
            {b.displayName}
            <button onClick={()=>unblock(b.username)} className="text-green-400">Unblock</button>
          </div>
        ))}
      </div>

      <div ref={containerRef} className="flex-1 overflow-y-auto border border-white/10 p-3">
        {messages.map(m => (
          <div key={m.id} className={m.isMine ? "text-right" : "text-left"}>
            {m.body}
          </div>
        ))}
      </div>
    </div>
  );
}
