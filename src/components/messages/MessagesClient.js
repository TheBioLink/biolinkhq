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

  // SEARCH USERS
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

  // CHAT VIEW
  if (username) {
    return (
      <div className="space-y-4">
        <Link href="/messages" className="text-sm text-white/50 hover:text-white">
          ← Back to inbox
        </Link>
        <div className="space-y-3">
          {messages.length === 0 ? (
            <p className="text-white/50">No messages yet</p>
          ) : (
            messages.map((m, i) => (
              <div
                key={i}
                className={`p-3 rounded-xl max-w-xs ${
                  m.isMine ? "bg-blue-500/20 ml-auto text-right" : "bg-white/5"
                }`}
              >
                {m.body}
              </div>
            ))
          )}
        </div>
      </div>
    );
  }

  // INBOX VIEW
  return (
    <div className="space-y-4">
      <input
        value={query}
        onChange={(e) => searchUsers(e.target.value)}
        placeholder="Search users..."
        className="w-full rounded-xl bg-white/5 p-3 text-white outline-none"
      />
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
