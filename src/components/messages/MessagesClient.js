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
  const shouldAutoScroll = useRef(true);

  useEffect(() => {
    loadInbox();
    loadBlockedList();
  }, []);

  useEffect(() => {
    if (activeUser) {
      shouldAutoScroll.current = true;
      loadChat(activeUser);

      pollRef.current = setInterval(() => {
        shouldAutoScroll.current = false;
        loadChat(activeUser);
      }, 5000);
    }

    return () => clearInterval(pollRef.current);
  }, [activeUser]);

  useEffect(() => {
    if (shouldAutoScroll.current) {
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

    shouldAutoScroll.current = true;

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
    shouldAutoScroll.current = true;
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
          className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-sm text-white outline-none focus:border-blue-500 transition"
        />

        <div className="flex-1 mt-4 overflow-y-auto space-y-2 pr-1">
          {query && users.map((u) => (
            <button
              key={u.uri}
              onClick={() => openChat(u.uri, u)}
              className="w-full flex items-center gap-3 rounded-xl p-3 hover:bg-white/10 transition text-left"
            >
              {u.profileImage ? (
                <img src={u.profileImage} className="w-9 h-9 rounded-full object-cover" />
              ) : (
                <div className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center text-sm font-bold">
                  {(u.displayName || "?")[0]}
                </div>
              )}
              <div>
                <p className="text-sm font-semibold text-white">{u.displayName}</p>
                <p className="text-xs text-white/40">@{u.username}</p>
              </div>
            </button>
          ))}

          {!query && conversations.map((c) => (
            <button
              key={c.uri}
              onClick={() => openChat(c.uri, c)}
              className={`w-full flex items-center gap-3 rounded-xl p-3 transition text-left ${
                activeUser === c.uri
                  ? "bg-blue-500/10 border border-blue-500/20"
                  : "hover:bg-white/10"
              }`}
            >
              {c.profileImage ? (
                <img src={c.profileImage} className="w-10 h-10 rounded-full object-cover" />
              ) : (
                <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center font-bold">
                  {(c.displayName || "?")[0]}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white truncate">{c.displayName}</p>
                <p className="text-xs text-white/40 truncate">{c.lastMessage}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* CHAT PANEL */}
      <div className="flex-1 flex flex-col border border-white/10 rounded-2xl bg-white/[0.02] overflow-hidden">

        {!activeUser ? (
          <div className="flex-1 flex items-center justify-center text-white/30">
            Select a conversation
          </div>
        ) : (
          <>
            {/* HEADER */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-white/[0.02]">
              <div className="flex items-center gap-3">
                {activeUserInfo?.profileImage ? (
                  <img src={activeUserInfo.profileImage} className="w-9 h-9 rounded-full object-cover" />
                ) : (
                  <div className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center font-bold">
                    {(activeUserInfo?.displayName || activeUser)[0]}
                  </div>
                )}
                <div>
                  <p className="font-semibold text-white">
                    {activeUserInfo?.displayName || activeUser}
                  </p>
                  <p className="text-xs text-white/40">@{activeUser}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => toggleBlock(activeUser)}
                  disabled={blockLoading}
                  className={`text-xs px-3 py-1.5 rounded-lg font-semibold ${
                    isActiveUserBlocked
                      ? "bg-green-600/20 text-green-400"
                      : "bg-red-600/20 text-red-400"
                  }`}
                >
                  {blockLoading ? "..." : isActiveUserBlocked ? "Unblock" : "Block"}
                </button>

                <button
                  onClick={closeChat}
                  className="text-white/40 hover:text-white text-lg"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* BLOCK WARNING */}
            {isActiveUserBlocked && (
              <div className="px-5 py-2 text-xs bg-red-500/10 text-red-300 border-b border-red-500/20">
                You have blocked this user
              </div>
            )}

            {/* MESSAGES */}
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
              {messages.length === 0 ? (
                <p className="text-white/30 text-sm text-center mt-10">
                  No messages yet
                </p>
              ) : (
                messages.map((m, i) => (
                  <div
                    key={i}
                    className={`flex ${m.isMine ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`px-4 py-2 rounded-2xl text-sm max-w-[70%] break-words ${
                        m.isMine
                          ? "bg-blue-600 text-white rounded-br-sm"
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

            {/* INPUT */}
            {!isActiveUserBlocked && (
              <div className="p-4 border-t border-white/10">
                <div className="flex items-center gap-2">
                  <input
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={(e) =>
                      e.key === "Enter" && !e.shiftKey && sendMessage()
                    }
                    placeholder={`Message ${activeUserInfo?.displayName || activeUser}`}
                    className="flex-1 rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-sm text-white outline-none focus:border-blue-500 transition"
                  />
                  <button
                    onClick={sendMessage}
                    disabled={sending || !newMessage.trim()}
                    className="bg-blue-600 hover:bg-blue-500 disabled:opacity-30 text-white font-semibold px-5 py-3 rounded-xl"
                  >
                    {sending ? "..." : "Send"}
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
