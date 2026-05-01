"use client";

import { useEffect, useState } from "react";

export default function MessagesClient() {
  const [query, setQuery] = useState("");
  const [users, setUsers] = useState([]);
  const [messages, setMessages] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);

  // Load recent messages initially
  useEffect(() => {
    async function loadMessages() {
      try {
        const res = await fetch("/api/messages");
        const data = await res.json();
        setMessages(data.messages || []);
      } catch (err) {
        console.error(err);
      }
    }

    loadMessages();
  }, []);

  // Search users
  async function searchUsers(value) {
    setQuery(value);

    if (!value.trim()) {
      setUsers([]);
      return;
    }

    setLoadingUsers(true);

    try {
      const res = await fetch("/api/messages", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: value }),
      });

      const data = await res.json();
      setUsers(data.users || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingUsers(false);
    }
  }

  return (
    <div className="space-y-6">

      {/* SEARCH BOX */}
      <input
        value={query}
        onChange={(e) => searchUsers(e.target.value)}
        placeholder="Search users..."
        className="w-full rounded-xl bg-white/5 p-3 text-white outline-none"
      />

      {/* SEARCH RESULTS */}
      {loadingUsers && (
        <p className="text-white/50">Searching...</p>
      )}

      {users.length > 0 && (
        <div className="space-y-2">
          {users.map((u) => (
            <a
              key={u.uri}
              href={`/messages/${u.uri}`}
              className="block rounded-xl bg-white/5 p-3 hover:bg-white/10"
            >
              <p className="font-bold">{u.displayName}</p>
              <p className="text-xs text-white/50">@{u.username}</p>
            </a>
          ))}
        </div>
      )}

      {/* RECENT MESSAGES */}
      <div className="space-y-2">
        {messages.length === 0 ? (
          <p className="text-white/50">No messages yet</p>
        ) : (
          messages.map((msg, i) => (
            <div
              key={i}
              className="rounded-xl bg-white/5 p-3"
            >
              <p className="text-sm">{msg.body}</p>
            </div>
          ))
        )}
      </div>

    </div>
  );
}
