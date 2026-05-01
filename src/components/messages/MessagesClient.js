"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function MessagesClient({ username }) {
  const [query, setQuery] = useState("");
  const [users, setUsers] = useState([]);
  const [messages, setMessages] = useState([]);

  // LOAD CHAT IF USER PAGE
  useEffect(() => {
    if (!username) return;

    async function loadChat() {
      const res = await fetch(`/api/messages?user=${username}`);
      const data = await res.json();
      setMessages(data.messages || []);
    }

    loadChat();
  }, [username]);

  // SEARCH USERS (INBOX MODE)
  async function searchUsers(value) {
    setQuery(value);

    if (!value.trim()) {
      setUsers([]);
      return;
    }

    const res = await fetch("/api/messages", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query: value }),
    });

    const data = await res.json();
    setUsers(data.users || []);
  }

  // 👉 CHAT VIEW (when /messages/[user])
  if (username) {
    return (
      <div className="space-y-3">
        {messages.length === 0 ? (
          <p className="text-white/50">No messages yet</p>
        ) : (
          messages.map((m, i) => (
            <div
              key={i}
              className={`p-3 rounded-xl ${
                m.isMine ? "bg-blue-500/20 ml-auto" : "bg-white/5"
              }`}
            >
              {m.body}
            </div>
          ))
        )}
      </div>
    );
  }

  // 👉 INBOX VIEW (search users)
  return (
    <div className="space-y-4">

      <input
        value={query}
        onChange={(e) => searchUsers(e.target.value)}
        placeholder="Search users..."
        className="w-full rounded-xl bg-white/5 p-3 text-white outline-none"
      />

      {/* USER RESULTS */}
      {users.length > 0 && (
        <div className="space-y-2">
          {users.map((u) => (
            <Link
              key={u.uri}
              href={`/messages/${u.uri}`}
              className="block rounded-xl bg-white/5 p-3 hover:bg-white/10"
            >
              <p className="font-bold">{u.displayName}</p>
              <p className="text-xs text-white/50">@{u.username}</p>
            </Link>
          ))}
        </div>
      )}

    </div>
  );
}
