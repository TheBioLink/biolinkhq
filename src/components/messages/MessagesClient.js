"use client";

import { useState, useEffect } from "react";

export default function MessagesClient() {
  const [search, setSearch] = useState("");
  const [results, setResults] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [target, setTarget] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");

  async function loadConversations() {
    const res = await fetch("/api/messages");
    const data = await res.json();
    setConversations(data.conversations || []);
  }

  async function searchUsers(q) {
    if (!q) return setResults([]);

    const res = await fetch("/api/messages", {
      method: "PUT",
      body: JSON.stringify({ query: q }),
    });

    const data = await res.json();
    setResults(data.users || []);
  }

  async function loadMessages(username) {
    if (!username) return;
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
    loadConversations();
  }

  useEffect(() => {
    loadConversations();
  }, []);

  useEffect(() => {
    const t = setTimeout(() => searchUsers(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  return (
    <div className="flex gap-4">
      {/* LEFT PANEL */}
      <div className="w-1/3 border border-white/10 rounded p-3 bg-black/30 space-y-3">
        <input
          placeholder="Search..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full p-2 bg-black/40 border border-white/10 rounded"
        />

        {search && results.map((u) => (
          <div
            key={u.uri}
            onClick={() => {
              setSearch("");
              setResults([]);
              loadMessages(u.uri);
            }}
            className="cursor-pointer p-2 hover:bg-white/10 rounded"
          >
            {u.uri}
          </div>
        ))}

        <div className="pt-2 border-t border-white/10">
          {conversations.map((c) => (
            <div
              key={c.username}
              onClick={() => loadMessages(c.username)}
              className="cursor-pointer p-2 hover:bg-white/10 rounded"
            >
              <div className="font-semibold">{c.displayName}</div>
              <div className="text-xs text-white/60 truncate">{c.lastMessage}</div>
            </div>
          ))}
        </div>
      </div>

      {/* RIGHT PANEL */}
      <div className="flex-1 border border-white/10 rounded p-3 bg-black/20 flex flex-col">
        {target ? (
          <>
            <div className="font-bold mb-2">{target.displayName}</div>

            <div className="flex-1 overflow-y-auto space-y-2">
              {messages.map((m) => (
                <div key={m.id} className={`text-sm ${m.isMine ? "text-blue-400" : "text-white"}`}>
                  {m.body}
                </div>
              ))}
            </div>

            <div className="flex gap-2 mt-2">
              <input
                value={text}
                onChange={(e) => setText(e.target.value)}
                className="flex-1 p-2 bg-black/30 border border-white/10 rounded"
              />
              <button onClick={send} className="px-4 py-2 bg-blue-500 rounded">Send</button>
            </div>
          </>
        ) : (
          <div className="text-white/50">Select a conversation</div>
        )}
      </div>
    </div>
  );
}
