"use client";
import { useEffect, useState, useRef } from "react";
import Link from "next/link";

export default function MessagesClient({ username }) {
  const [query, setQuery] = useState("");
  const [users, setUsers] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [messages, setMessages] = useState([]);
  const [target, setTarget] = useState(null);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    if (username) {
      loadChat();
      const interval = setInterval(loadChat, 5000);
      return () => clearInterval(interval);
    } else {
      loadInbox();
    }
  }, [username]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function loadChat() {
    const res = await fetch(`/api/messages?user=${username}`);
    const data = await res.json();
    setMessages(data.messages || []);
    setTarget(data.target || null);
  }

  async function loadInbox() {
    const res = await fetch("/api/messages");
    const data = await res.json();
    setConversations(data.conversations || []);
  }

  async function searchUsers(value) {
    setQuery(value);
    if (!value.trim()) { setUsers([]); return; }
    const res = await fetch("/api/messages", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query: value }),
    });
    const data = await res.json();
    setUsers(data.users || []);
  }

  async function sendMessage() {
    if (!newMessage.trim() || sending) return;
    setSending(true);
    try {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, body: newMessage.trim() }),
      });
      if (res.ok) {
        setNewMessage("");
        await loadChat();
      }
    } finally {
      setSending(false);
    }
  }

  // ── CHAT VIEW ──
  if (username) {
    return (
      <div className="flex flex-col h-[75vh]">
        <div className="flex items-center gap-3 mb-4">
          <Link
            href="/account/messages"
            className="text-white/50 hover:text-white text-sm"
          >
            ← Back
          </Link>
          {target && (
            <span className="font-bold text-white">
              {target.displayName || target.username}
            </span>
          )}
        </div>

        <div className="flex-1 overflow-y-auto space-y-3 mb-4 pr-1">
          {messages.length === 0 ? (
            <p className="text-white/40 text-sm text-center mt-10">
              No messages yet. Say hello!
            </p>
          ) : (
            messages.map((m, i) => (
              <div
                key={i}
                className={`px-4 py-2 rounded-2xl max-w-[75%] text-sm break-words ${
                  m.isMine
                    ? "bg-blue-600 ml-auto text-white rounded-br-sm"
                    : "bg-white/10 text-white rounded-bl-sm"
                }`}
              >
                {m.body}
              </div>
            ))
          )}
          <div ref={bottomRef} />
        </div>

        <div className="flex gap-2">
          <input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()}
            placeholder={`Message ${target?.displayName || username}...`}
            className="flex-1 rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-white outline-none focus:border-blue-500 transition text-sm"
          />
          <button
            onClick={sendMessage}
            disabled={sending || !newMessage.trim()}
            className="bg-blue-600 hover:bg-blue-500 disabled:opacity-30 text-white font-bold px-5 rounded-xl transition text-sm"
          >
            {sending ? "..." : "Send"}
          </button>
        </div>
      </div>
    );
  }

  // ── INBOX VIEW ──
  return (
    <div className="space-y-4">
      <input
        value={query}
        onChange={(e) => searchUsers(e.target.value)}
        placeholder="Search users to message..."
        className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-white outline-none focus:border-blue-500 transition text-sm"
      />

      {query && users.length > 0 && (
        <div className="space-y-2">
          {users.map((u) => (
            <Link
              key={u.uri}
              href={`/account/messages/${u.uri}`}
              className="flex items-center gap-3 rounded-xl bg-white/5 p-3 hover:bg-white/10 transition"
            >
              {u.profileImage && (
                <img src={u.profileImage} className="w-8 h-8 rounded-full object-cover" alt="" />
              )}
              <div>
                <p className="font-bold text-sm">{u.displayName}</p>
                <p className="text-xs text-white/50">@{u.username}</p>
              </div>
            </Link>
          ))}
        </div>
      )}

      {query && users.length === 0 && (
        <p className="text-white/40 text-sm">No users found</p>
      )}

      {!query && conversations.length > 0 && (
        <div className="space-y-2">
          <p className="text-white/40 text-xs uppercase tracking-wider mb-2">Recent</p>
          {conversations.map((c) => (
            <Link
              key={c.uri}
              href={`/account/messages/${c.uri}`}
              className="flex items-center gap-3 rounded-xl bg-white/5 p-3 hover:bg-white/10 transition"
            >
              {c.profileImage && (
                <img src={c.profileImage} className="w-9 h-9 rounded-full object-cover" alt="" />
              )}
              <div className="flex-1 min-w-0">
                <p className="font-bold text-sm">{c.displayName}</p>
                <p className="text-xs text-white/40 truncate">{c.lastMessage}</p>
              </div>
            </Link>
          ))}
        </div>
      )}

      {!query && conversations.length === 0 && (
        <p className="text-white/40 text-sm text-center mt-8">
          No conversations yet. Search for a user to start chatting!
        </p>
      )}
    </div>
  );
}
