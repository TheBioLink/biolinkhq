"use client";

import { useState, useEffect } from "react";

export default function MessagesClient() {
  const [search, setSearch] = useState("");
  const [results, setResults] = useState([]);
  const [target, setTarget] = useState("");
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");

  async function searchUsers(q) {
    if (!q) return setResults([]);

    const res = await fetch("/api/messages", {
      method: "PUT",
      body: JSON.stringify({ query: q }),
    });

    const data = await res.json();
    setResults(data.users || []);
  }

  async function load() {
    if (!target) return;
    const res = await fetch(`/api/messages?user=${target}`);
    const data = await res.json();
    setMessages(data.messages || []);
  }

  async function send() {
    if (!text) return;

    await fetch("/api/messages", {
      method: "POST",
      body: JSON.stringify({ username: target, body: text }),
    });

    setText("");
    load();
  }

  async function block() {
    await fetch("/api/messages", {
      method: "PATCH",
      body: JSON.stringify({ action: "block", username: target }),
    });
    setTarget("");
    setMessages([]);
  }

  async function report() {
    const reason = prompt("Report reason?");
    if (!reason) return;

    await fetch("/api/messages", {
      method: "PATCH",
      body: JSON.stringify({ action: "report", username: target, reason }),
    });
  }

  useEffect(() => {
    const t = setTimeout(() => searchUsers(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    const i = setInterval(load, 3000);
    return () => clearInterval(i);
  }, [target]);

  return (
    <div className="space-y-4">
      <input
        placeholder="Search username..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full p-2 bg-black/30 border border-white/10 rounded"
      />

      {search && results.length > 0 && (
        <div className="border border-white/10 rounded bg-black/40">
          {results.map((u) => (
            <div
              key={u.uri}
              onClick={() => {
                setTarget(u.uri);
                setSearch("");
                setResults([]);
              }}
              className="cursor-pointer p-2 hover:bg-white/10"
            >
              {u.uri}
            </div>
          ))}
        </div>
      )}

      {target && (
        <div className="flex gap-2">
          <button onClick={block} className="px-3 py-1 bg-red-500 rounded">Block</button>
          <button onClick={report} className="px-3 py-1 bg-yellow-500 rounded">Report</button>
        </div>
      )}

      <div className="h-80 overflow-y-auto border border-white/10 rounded p-3 bg-black/20">
        {messages.map((m) => (
          <div key={m.id} className="mb-2">
            <span className={m.isMine ? "text-blue-400" : "text-white/70"}>
              {m.isMine ? "You" : target}:
            </span>{" "}
            {m.body}
          </div>
        ))}
      </div>

      {target && (
        <div className="flex gap-2">
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="flex-1 p-2 bg-black/30 border border-white/10 rounded"
          />
          <button onClick={send} className="px-4 py-2 bg-blue-500 rounded">
            Send
          </button>
        </div>
      )}
    </div>
  );
}
