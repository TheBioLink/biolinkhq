"use client";

import { useState, useEffect } from "react";

export default function MessagesClient() {
  const [search, setSearch] = useState("");
  const [results, setResults] = useState([]);
  const [target, setTarget] = useState("");
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");

  async function searchUsers() {
    if (!search) return setResults([]);

    const res = await fetch("/api/messages", {
      method: "PUT",
      body: JSON.stringify({ query: search }),
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

  useEffect(() => {
    const i = setInterval(load, 3000);
    return () => clearInterval(i);
  }, [target]);

  return (
    <div className="space-y-4">
      <input
        placeholder="Search username..."
        value={search}
        onChange={(e) => {
          setSearch(e.target.value);
          searchUsers();
        }}
        className="w-full p-2 bg-black/30 border border-white/10 rounded"
      />

      {results.map((u) => (
        <div
          key={u.uri}
          onClick={() => setTarget(u.uri)}
          className="cursor-pointer p-2 hover:bg-white/10 rounded"
        >
          {u.uri}
        </div>
      ))}

      <div className="h-80 overflow-y-auto border border-white/10 rounded p-3 bg-black/20">
        {messages.map((m) => (
          <div key={m._id} className="mb-2">
            <span className="text-blue-400">{m.fromEmail}:</span> {m.body}
          </div>
        ))}
      </div>

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
    </div>
  );
}
