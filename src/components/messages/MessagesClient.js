"use client";
import { useEffect, useState, useRef } from "react";

export default function MessagesClient() {
  const [query, setQuery] = useState("");
  const [users, setUsers] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [activeUser, setActiveUser] = useState(null);
  const [activeUserInfo, setActiveUserInfo] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [blockedList, setBlockedList] = useState([]);
  const [blockLoading, setBlockLoading] = useState(false);

  const bottomRef = useRef(null);
  const containerRef = useRef(null);
  const pollRef = useRef(null);

  useEffect(() => {
    loadInbox();
    loadBlockedList();
  }, []);

  useEffect(() => {
    if (activeUser) {
      loadChat(activeUser);

      pollRef.current = setInterval(() => {
        loadChat(activeUser);
      }, 5000);
    }

    return () => clearInterval(pollRef.current);
  }, [activeUser]);

  // ✅ Smart scroll (ONLY if user is near bottom)
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const distanceFromBottom =
      container.scrollHeight - container.scrollTop - container.clientHeight;

    const isNearBottom = distanceFromBottom < 120;

    if (isNearBottom) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  async function loadInbox() {
    const res = await fetch("/api/messages");
    const data = await res.json();
    setConversations(data.conversations || []);
  }

  async function loadChat(username) {
    const res = await fetch(`/api/messages?user=${username}`);
    const data = await res.json();
    setMessages(data.messages || []);
    if (data.target) setActiveUserInfo(data.target);
  }

  async function loadBlockedList() {
    const res = await fetch("/api/messages/block");
    const data = await res.json();
    setBlockedList(data.blocked || []);
  }

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

  async function sendMessage() {
    if (!newMessage.trim() || sending || !activeUser) return;

    setSending(true);
    try {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: activeUser,
          body: newMessage.trim(),
        }),
      });

      if (res.ok) {
        setNewMessage("");
        await loadChat(activeUser);
        await loadInbox();

        // force scroll ONLY when YOU send
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
      }
    } finally {
      setSending(false);
    }
  }

  async function toggleBlock(username) {
    setBlockLoading(true);
    try {
      const isBlocked = blockedList.includes(
        activeUserInfo?.email?.toLowerCase() || ""
      );

      const res = await fetch("/api/messages/block", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username,
          action: isBlocked ? "unblock" : "block",
        }),
      });

      const data = await res.json();
      if (data.ok) await loadBlockedList();
    } finally {
      setBlockLoading(false);
    }
  }

  function openChat(username, userInfo = null) {
    setActiveUser(username);
    setActiveUserInfo(userInfo);
    setQuery("");
    setUsers([]);
    setMessages([]);

    // scroll on open
    setTimeout(() => {
      bottomRef.current?.scrollIntoView({ behavior: "auto" });
    }, 100);
  }

  function closeChat() {
    setActiveUser(null);
    setActiveUserInfo(null);
    setMessages([]);
    clearInterval(pollRef.current);
    loadInbox();
  }

  const isActiveUserBlocked = activeUserInfo?.email
    ? blockedList.includes(activeUserInfo.email.toLowerCase())
    : false;

  return (
    <div className="flex gap-6 h-[80vh]">

      {/* LEFT SIDEBAR */}
      <div className="w-80 flex flex-col bg-white/[0.03] border border-white/10 rounded-2xl p-4">
        <input
          value={query}
          onChange={(e) => searchUsers(e.target.value)}
          placeholder="Search users..."
          className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-sm text-white outline-none focus:border-blue-500"
        />

        <div className="flex-1 mt-4 overflow-y-auto space-y-2 pr-1">
          {query && users.map((u) => (
            <button
              key={u.uri}
              onClick={() => openChat(u.uri, u)}
              className="w-full flex items-center gap-3 rounded-xl p-3 hover:bg-white/10"
            >
              <div className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center font-bold">
                {(u.displayName || "?")[0]}
              </div>
              <div>
                <p className="text-sm text-white">{u.displayName}</p>
                <p className="text-xs text-white/40">@{u.username}</p>
              </div>
            </button>
          ))}

          {!query && conversations.map((c) => (
            <button
              key={c.uri}
              onClick={() => openChat(c.uri, c)}
              className={`w-full flex items-center gap-3 rounded-xl p-3 ${
                activeUser === c.uri
                  ? "bg-blue-500/10 border border-blue-500/20"
                  : "hover:bg-white/10"
              }`}
            >
              <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center font-bold">
                {(c.displayName || "?")[0]}
              </div>
              <div className="flex-1">
                <p className="text-sm text-white">{c.displayName}</p>
                <p className="text-xs text-white/40 truncate">{c.lastMessage}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* CHAT */}
      <div className="flex-1 flex flex-col border border-white/10 rounded-2xl overflow-hidden">
        {!activeUser ? (
          <div className="flex-1 flex items-center justify-center text-white/30">
            Select a conversation
          </div>
        ) : (
          <>
            <div className="px-6 py-4 border-b border-white/10 flex justify-between">
              <p className="text-white">{activeUserInfo?.displayName}</p>
              <button onClick={closeChat}>✕</button>
            </div>

            <div
              ref={containerRef}
              className="flex-1 overflow-y-auto px-6 py-4 space-y-4"
            >
              {messages.map((m, i) => (
                <div key={i} className={m.isMine ? "text-right" : ""}>
                  <div
                    className={`inline-block px-4 py-2 rounded-2xl ${
                      m.isMine ? "bg-blue-600" : "bg-white/10"
                    }`}
                  >
                    {m.body}
                  </div>
                </div>
              ))}
              <div ref={bottomRef} />
            </div>

            <div className="p-4 border-t border-white/10 flex gap-2">
              <input
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                className="flex-1 bg-white/5 px-4 py-2 rounded-xl text-white"
              />
              <button onClick={sendMessage}>Send</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
