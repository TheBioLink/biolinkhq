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
  const pollRef = useRef(null);

  useEffect(() => {
    loadInbox();
    loadBlockedList();
  }, []);

  useEffect(() => {
    if (activeUser) {
      loadChat(activeUser);
      pollRef.current = setInterval(() => loadChat(activeUser), 5000);
    }
    return () => clearInterval(pollRef.current);
  }, [activeUser]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
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
    if (!newMessage.trim() || sending || !activeUser) return;
    setSending(true);
    try {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: activeUser, body: newMessage.trim() }),
      });
      if (res.ok) {
        setNewMessage("");
        await loadChat(activeUser);
        await loadInbox();
      }
    } finally {
      setSending(false);
    }
  }

  async function toggleBlock(username) {
    setBlockLoading(true);
    try {
      const isBlocked = blockedList.includes(activeUserInfo?.email || "");
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
  }

  function closeChat() {
    setActiveUser(null);
    setActiveUserInfo(null);
    setMessages([]);
    clearInterval(pollRef.current);
    loadInbox();
  }

  // Check if active user's email is blocked
  const isActiveUserBlocked = activeUserInfo?.email
    ? blockedList.includes(activeUserInfo.email.toLowerCase())
    : false;

  return (
    <div className="flex gap-4 h-[75vh]">

      {/* LEFT: Inbox / Search */}
      <div className="w-72 flex-shrink-0 flex flex-col gap-3">
        <input
          value={query}
          onChange={(e) => searchUsers(e.target.value)}
          placeholder="Search users..."
          className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-white outline-none focus:border-blue-500 transition text-sm"
        />

        <div className="flex-1 overflow-y-auto space-y-2">
          {/* Search results */}
          {query && users.map((u) => (
            <button
              key={u.uri}
              onClick={() => openChat(u.uri, u)}
              className="w-full flex items-center gap-3 rounded-xl bg-white/5 p-3 hover:bg-white/10 transition text-left"
            >
              {u.profileImage ? (
                <img src={u.profileImage} className="w-8 h-8 rounded-full object-cover" alt="" />
              ) : (
                <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-xs font-bold">
                  {(u.displayName || u.username || "?")[0].toUpperCase()}
                </div>
              )}
              <div>
                <p className="font-bold text-sm text-white">{u.displayName}</p>
                <p className="text-xs text-white/50">@{u.username}</p>
              </div>
            </button>
          ))}

          {query && users.length === 0 && (
            <p className="text-white/40 text-sm px-2">No users found</p>
          )}

          {/* Conversations */}
          {!query && conversations.length === 0 && (
            <p className="text-white/40 text-sm px-2 mt-4">No conversations yet.</p>
          )}

          {!query && conversations.map((c) => (
            <button
              key={c.uri}
              onClick={() => openChat(c.uri, c)}
              className={`w-full flex items-center gap-3 rounded-xl p-3 hover:bg-white/10 transition text-left ${
                activeUser === c.uri ? "bg-white/10 border border-white/10" : "bg-white/5"
              }`}
            >
              {c.profileImage ? (
                <img src={c.profileImage} className="w-9 h-9 rounded-full object-cover" alt="" />
              ) : (
                <div className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center text-sm font-bold">
                  {(c.displayName || c.uri || "?")[0].toUpperCase()}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="font-bold text-sm text-white">{c.displayName}</p>
                <p className="text-xs text-white/40 truncate">{c.lastMessage}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* RIGHT: Chat */}
      <div className="flex-1 flex flex-col rounded-2xl border border-white/10 bg-white/[0.02] overflow-hidden">
        {!activeUser ? (
          <div className="flex-1 flex items-center justify-center text-white/30 text-sm">
            Select a conversation or search for a user
          </div>
        ) : (
          <>
            {/* Chat header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
              <div className="flex items-center gap-3">
                {activeUserInfo?.profileImage ? (
                  <img src={activeUserInfo.profileImage} className="w-8 h-8 rounded-full object-cover" alt="" />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-sm font-bold">
                    {(activeUserInfo?.displayName || activeUser || "?")[0].toUpperCase()}
                  </div>
                )}
                <div>
                  <p className="font-bold text-white text-sm">
                    {activeUserInfo?.displayName || activeUser}
                  </p>
                  <p className="text-xs text-white/40">@{activeUser}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {/* Block button */}
                <button
                  onClick={() => toggleBlock(activeUser)}
                  disabled={blockLoading}
                  className={`text-xs px-3 py-1.5 rounded-lg font-semibold transition ${
                    isActiveUserBlocked
                      ? "bg-green-600/20 text-green-400 hover:bg-green-600/30"
                      : "bg-red-600/20 text-red-400 hover:bg-red-600/30"
                  }`}
                >
                  {blockLoading ? "..." : isActiveUserBlocked ? "Unblock" : "Block"}
                </button>
                <button
                  onClick={closeChat}
                  className="text-white/40 hover:text-white text-sm transition px-2"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Blocked warning */}
            {isActiveUserBlocked && (
              <div className="px-5 py-3 bg-red-500/10 border-b border-red-500/20 text-red-300 text-xs">
                You have blocked this user. Unblock them to send messages.
              </div>
            )}

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.length === 0 ? (
                <p className="text-white/30 text-sm text-center mt-10">
                  No messages yet. Say hello!
                </p>
              ) : (
                messages.map((m, i) => (
                  <div key={i} className="group flex flex-col">
                    <div
                      className={`px-4 py-2 rounded-2xl max-w-[75%] text-sm break-words ${
                        m.isMine
                          ? "bg-blue-600 ml-auto text-white rounded-br-sm"
                          : "bg-white/10 text-white rounded-bl-sm"
                      }`}
                    >
                      {m.body}
                    </div>
                  </div>
                ))
              )}
              <div ref={bottomRef} />
            </div>

            {/* Send bar */}
            {!isActiveUserBlocked && (
              <div className="flex gap-2 p-4 border-t border-white/10">
                <input
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()}
                  placeholder={`Message ${activeUserInfo?.displayName || activeUser}...`}
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
            )}
          </>
        )}
      </div>
    </div>
  );
}
