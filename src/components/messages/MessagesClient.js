"use client";

import { useEffect, useRef, useState } from "react";

function initials(name = "?") {
  return String(name || "?").slice(0, 1).toUpperCase();
}

function timeLabel(value) {
  if (!value) return "";
  return new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function isNearBottom(el) {
  if (!el) return true;
  return el.scrollHeight - el.scrollTop - el.clientHeight < 120;
}

export default function MessagesClient() {
  const [search, setSearch] = useState("");
  const [results, setResults] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [blocked, setBlocked] = useState([]);
  const [showBlocked, setShowBlocked] = useState(false);
  const [target, setTarget] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isLive, setIsLive] = useState(true);
  const [isChatBlocked, setIsChatBlocked] = useState(false);
  const messagesRef = useRef(null);
  const bottomRef = useRef(null);

  async function loadBlocked() {
    const res = await fetch("/api/messages?blocked=1", { cache: "no-store" });
    const data = await res.json();
    setBlocked(data.blocked || []);
  }

  async function loadConversations() {
    const res = await fetch("/api/messages", { cache: "no-store" });
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

  async function loadMessages(username, options = {}) {
    if (!username) return;

    const shouldStick = isNearBottom(messagesRef.current);
    const res = await fetch(`/api/messages?user=${username}`, { cache: "no-store" });
    const data = await res.json();

    setMessages(data.messages || []);
    setIsChatBlocked(Boolean(data.blocked));
    if (data.target) setTarget(data.target);

    if (options.forceScroll || shouldStick) {
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: options.smooth ? "smooth" : "auto" }), 60);
    }
  }

  async function send() {
    if (!text.trim() || !target || isSending || isChatBlocked) return;

    setIsSending(true);
    await fetch("/api/messages", {
      method: "POST",
      body: JSON.stringify({ username: target.username, body: text }),
    });

    setText("");
    await loadMessages(target.username, { forceScroll: true, smooth: true });
    await loadConversations();
    setIsSending(false);
  }

  async function block() {
    if (!target) return;
    await fetch("/api/messages", {
      method: "PATCH",
      body: JSON.stringify({ action: "block", username: target.username }),
    });
    setIsChatBlocked(true);
    setMessages([]);
    await loadBlocked();
    await loadConversations();
  }

  async function unblock(username = target?.username) {
    if (!username) return;
    await fetch("/api/messages", {
      method: "PATCH",
      body: JSON.stringify({ action: "unblock", username }),
    });
    await loadBlocked();
    await loadConversations();
    if (target?.username === username) {
      setIsChatBlocked(false);
      await loadMessages(username, { forceScroll: true });
    }
  }

  async function report() {
    if (!target) return;
    const reason = prompt("Report reason?");
    if (!reason) return;

    await fetch("/api/messages", {
      method: "PATCH",
      body: JSON.stringify({ action: "report", username: target.username, reason }),
    });
  }

  function selectUser(username) {
    setSearch("");
    setResults([]);
    loadMessages(username, { forceScroll: true });
  }

  useEffect(() => {
    loadConversations();
    loadBlocked();
  }, []);

  useEffect(() => {
    const t = setTimeout(() => searchUsers(search), 250);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    if (!isLive) return;

    const i = setInterval(() => {
      loadConversations();
      if (target?.username) loadMessages(target.username);
    }, 1200);

    return () => clearInterval(i);
  }, [target?.username, isLive]);

  return (
    <div className="grid h-[72vh] overflow-hidden rounded-3xl border border-white/10 bg-[#10141f] shadow-2xl lg:grid-cols-[320px_1fr]">
      <aside className="min-h-0 border-b border-white/10 bg-[#0d111b] p-4 lg:border-b-0 lg:border-r">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-black">Direct Messages</h2>
            <p className="text-xs text-white/40">Messages auto-delete after 1 hour.</p>
          </div>
          <button
            onClick={() => setIsLive((v) => !v)}
            className={`rounded-full px-3 py-1 text-xs font-bold ${
              isLive ? "bg-emerald-500/15 text-emerald-300" : "bg-white/10 text-white/50"
            }`}
          >
            {isLive ? "Live" : "Paused"}
          </button>
        </div>

        <div className="relative">
          <input
            placeholder="Search username..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm outline-none placeholder:text-white/35 focus:border-blue-400/60"
          />

          {search && results.length > 0 && (
            <div className="absolute z-20 mt-2 max-h-64 w-full overflow-y-auto rounded-2xl border border-white/10 bg-[#111827] p-2 shadow-2xl">
              {results.map((u) => (
                <button
                  key={u.uri}
                  onClick={() => selectUser(u.uri)}
                  className="flex w-full items-center gap-3 rounded-xl p-2 text-left hover:bg-white/10"
                >
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-500/20 text-sm font-black text-blue-200">
                    {initials(u.displayName || u.uri)}
                  </div>
                  <div>
                    <div className="text-sm font-bold">{u.displayName || u.uri}</div>
                    <div className="text-xs text-white/45">@{u.uri}</div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="mt-5 h-[calc(72vh-150px)] space-y-1 overflow-y-auto pr-1">
          {conversations.length ? (
            conversations.map((c) => (
              <button
                key={c.username}
                onClick={() => selectUser(c.username)}
                className={`flex w-full items-center gap-3 rounded-2xl p-3 text-left transition ${
                  target?.username === c.username ? "bg-blue-500/15" : "hover:bg-white/10"
                }`}
              >
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white/10 text-sm font-black">
                  {initials(c.displayName || c.username)}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate text-sm font-bold">{c.displayName || c.username}</span>
                    <span className="shrink-0 text-[10px] text-white/35">{timeLabel(c.updatedAt)}</span>
                  </div>
                  <p className="truncate text-xs text-white/45">
                    {c.isMine ? "You: " : ""}{c.lastMessage}
                  </p>
                </div>
              </button>
            ))
          ) : (
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-sm text-white/45">
              No recent DMs yet. Search a username to start one.
            </div>
          )}

          <div className="pt-4">
            <button
              onClick={() => setShowBlocked((v) => !v)}
              className="flex w-full items-center justify-between rounded-2xl border border-white/10 bg-white/[0.03] px-3 py-2 text-left text-xs font-bold text-white/60 hover:bg-white/10"
            >
              <span>Blocked users</span>
              <span>{blocked.length}</span>
            </button>

            {showBlocked && (
              <div className="mt-2 space-y-1">
                {blocked.length ? blocked.map((b) => (
                  <div key={b.username} className="flex items-center justify-between gap-2 rounded-xl bg-black/25 p-2">
                    <div className="min-w-0">
                      <div className="truncate text-sm font-bold">{b.displayName || b.username}</div>
                      <div className="truncate text-xs text-white/40">@{b.username}</div>
                    </div>
                    <button
                      onClick={() => unblock(b.username)}
                      className="rounded-lg bg-emerald-500/10 px-2 py-1 text-xs font-bold text-emerald-300 hover:bg-emerald-500/20"
                    >
                      Unblock
                    </button>
                  </div>
                )) : (
                  <div className="rounded-xl bg-black/25 p-3 text-xs text-white/40">No blocked users.</div>
                )}
              </div>
            )}
          </div>
        </div>
      </aside>

      <section className="flex min-h-0 flex-col bg-[#121722]">
        {target ? (
          <>
            <header className="flex shrink-0 items-center justify-between border-b border-white/10 px-5 py-4">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-blue-500/20 text-sm font-black text-blue-200">
                  {initials(target.displayName || target.username)}
                </div>
                <div>
                  <div className="font-black">{target.displayName || target.username}</div>
                  <div className="text-xs text-white/45">@{target.username}</div>
                </div>
              </div>

              <div className="flex gap-2">
                {isChatBlocked ? (
                  <button onClick={() => unblock()} className="rounded-xl bg-emerald-500/10 px-3 py-2 text-xs font-bold text-emerald-300 hover:bg-emerald-500/20">
                    Unblock
                  </button>
                ) : (
                  <>
                    <button onClick={report} className="rounded-xl bg-yellow-500/10 px-3 py-2 text-xs font-bold text-yellow-200 hover:bg-yellow-500/20">
                      Report
                    </button>
                    <button onClick={block} className="rounded-xl bg-red-500/10 px-3 py-2 text-xs font-bold text-red-200 hover:bg-red-500/20">
                      Block
                    </button>
                  </>
                )}
              </div>
            </header>

            {isChatBlocked ? (
              <div className="flex flex-1 items-center justify-center p-8 text-center text-white/50">
                <div>
                  <div className="text-lg font-black text-white/75">You blocked @{target.username}</div>
                  <p className="mt-2 text-sm">Unblock them to view and send messages again.</p>
                </div>
              </div>
            ) : (
              <>
                <div ref={messagesRef} className="min-h-0 flex-1 space-y-1 overflow-y-auto px-5 py-5">
                  {messages.length ? (
                    messages.map((m) => (
                      <div
                        key={m.id}
                        className={`group flex gap-3 rounded-xl px-2 py-1.5 hover:bg-white/[0.035] ${
                          m.isMine ? "justify-end" : "justify-start"
                        }`}
                      >
                        {!m.isMine && (
                          <div className="mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/10 text-xs font-black">
                            {initials(target.displayName || target.username)}
                          </div>
                        )}

                        <div className={`max-w-[78%] ${m.isMine ? "text-right" : "text-left"}`}>
                          <div className={`mb-1 text-[11px] text-white/35 ${m.isMine ? "text-right" : "text-left"}`}>
                            {m.isMine ? "You" : target.displayName || target.username} • {timeLabel(m.createdAt)}
                          </div>
                          <div
                            className={`rounded-2xl px-4 py-2 text-sm leading-relaxed ${
                              m.isMine
                                ? "rounded-br-md bg-blue-600 text-white"
                                : "rounded-bl-md bg-[#2b3140] text-white"
                            }`}
                          >
                            {m.body}
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="flex h-full items-center justify-center text-center text-white/45">
                      <div>
                        <div className="text-lg font-black text-white/70">Start the conversation</div>
                        <p className="mt-1 text-sm">Send a message to @{target.username}.</p>
                      </div>
                    </div>
                  )}
                  <div ref={bottomRef} />
                </div>

                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    send();
                  }}
                  className="shrink-0 border-t border-white/10 p-4"
                >
                  <div className="flex items-end gap-3 rounded-2xl border border-white/10 bg-[#1b2130] p-2">
                    <textarea
                      value={text}
                      onChange={(e) => setText(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          send();
                        }
                      }}
                      placeholder={`Message @${target.username}`}
                      maxLength={500}
                      rows={1}
                      className="max-h-28 min-h-[42px] flex-1 resize-none bg-transparent px-3 py-2 text-sm outline-none placeholder:text-white/35"
                    />
                    <button
                      disabled={!text.trim() || isSending}
                      className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-black text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      Send
                    </button>
                  </div>
                  <div className="mt-2 text-right text-[11px] text-white/35">{text.length}/500</div>
                </form>
              </>
            )}
          </>
        ) : (
          <div className="flex h-full items-center justify-center p-8 text-center text-white/45">
            <div>
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-white/10 text-2xl">💬</div>
              <h2 className="text-xl font-black text-white/75">Select a DM</h2>
              <p className="mt-2 max-w-sm text-sm">Pick a recent conversation or search a username to start a live chat.</p>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
