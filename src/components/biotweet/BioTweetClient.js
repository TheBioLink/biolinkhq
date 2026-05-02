"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";

// ─── Helpers ────────────────────────────────────────────────────────────────

function timeAgo(date) {
  const diff = Math.floor((Date.now() - new Date(date)) / 1000);
  if (diff < 60) return `${diff}s`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d`;
  return new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short" }).format(new Date(date));
}

function timeLeft(expiresAt) {
  const ms = new Date(expiresAt) - Date.now();
  if (ms <= 0) return "expired";
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

const MAX = 280;
const DM_MAX = 1000;

// ─── Avatar ─────────────────────────────────────────────────────────────────

function Avatar({ src, name, size = 40 }) {
  const initials = (name || "?").slice(0, 1).toUpperCase();
  return (
    <div
      className="shrink-0 rounded-full overflow-hidden bg-[#1a2540] border border-white/10 flex items-center justify-center font-black text-white/60"
      style={{ width: size, height: size, fontSize: size * 0.4 }}
    >
      {src ? (
        <img src={src} alt={name} className="w-full h-full object-cover" />
      ) : (
        initials
      )}
    </div>
  );
}

// ─── Follow Button ───────────────────────────────────────────────────────────

function FollowButton({ uri, myUri, initialFollowing = false, onFollowChange }) {
  const [following, setFollowing] = useState(initialFollowing);
  const [loading, setLoading] = useState(false);
  const [hover, setHover] = useState(false);

  if (!myUri || uri === myUri) return null;

  async function toggle(e) {
    e.stopPropagation();
    if (loading) return;
    setLoading(true);
    const action = following ? "unfollow" : "follow";
    try {
      const res = await fetch("/api/biofollow", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, uri }),
      });
      const data = await res.json();
      if (res.ok) {
        setFollowing(data.followedByMe);
        onFollowChange?.(data.followedByMe, data.followerCount);
      }
    } catch {}
    setLoading(false);
  }

  const label = loading
    ? "…"
    : following
    ? hover ? "Unfollow" : "Following"
    : "Follow";

  return (
    <button
      onClick={toggle}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      className={`px-3 py-1 rounded-full text-xs font-black transition border ${
        following
          ? hover
            ? "border-red-500/50 text-red-400 bg-red-500/10"
            : "border-white/20 text-white/70 bg-white/5"
          : "border-blue-500 text-white bg-blue-500 hover:bg-blue-400"
      }`}
    >
      {label}
    </button>
  );
}

// ─── DM Button ───────────────────────────────────────────────────────────────

function DMButton({ uri, myUri, onOpenDM }) {
  if (!myUri || uri === myUri) return null;
  return (
    <button
      onClick={(e) => { e.stopPropagation(); onOpenDM?.(uri); }}
      className="p-1.5 rounded-full text-white/30 hover:text-blue-400 hover:bg-blue-500/10 transition"
      title="Send ephemeral DM"
    >
      <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" strokeLinecap="round" strokeLinejoin="round" />
        <polyline points="22,6 12,13 2,6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </button>
  );
}

// ─── Compose Box ─────────────────────────────────────────────────────────────

function ComposeBox({ myUri, myDisplayName, myProfileImage, onPost, replyTo = null, onCancel = null }) {
  const [text, setText] = useState("");
  const [posting, setPosting] = useState(false);
  const textareaRef = useRef(null);
  const remaining = MAX - text.length;
  const pct = Math.min((text.length / MAX) * 100, 100);

  function autoResize() {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }

  async function submit() {
    const trimmed = text.trim();
    if (!trimmed || posting) return;
    setPosting(true);
    try {
      const res = await fetch("/api/biotweet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: trimmed, replyTo: replyTo || undefined }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed");
      setText("");
      if (textareaRef.current) textareaRef.current.style.height = "auto";
      onPost?.(data.tweet);
    } catch (e) {
      alert(e.message);
    } finally {
      setPosting(false);
    }
  }

  function onKey(e) {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) submit();
  }

  const circumference = 2 * Math.PI * 10;
  const strokeDash = (pct / 100) * circumference;
  const ringColor = remaining <= 0 ? "#ef4444" : remaining <= 20 ? "#f59e0b" : "#3b82f6";

  return (
    <div className="flex gap-3 p-4">
      <Avatar src={myProfileImage} name={myDisplayName} size={40} />
      <div className="flex-1 min-w-0">
        {replyTo && (
          <div className="text-xs text-white/35 mb-2 font-medium">
            Replying to <span className="text-blue-400">@{replyTo.authorUri}</span>
          </div>
        )}
        <textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => { setText(e.target.value); autoResize(); }}
          onKeyDown={onKey}
          placeholder={replyTo ? "Post your reply…" : "What's happening?"}
          maxLength={MAX + 20}
          rows={1}
          className="w-full bg-transparent text-white placeholder:text-white/30 text-[15px] resize-none outline-none leading-relaxed min-h-[44px]"
          style={{ overflow: "hidden" }}
        />
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/8">
          <div className="text-xs text-white/30 font-mono">⌘↵ to post</div>
          <div className="flex items-center gap-3">
            {text.length > 0 && (
              <div className="flex items-center gap-2">
                <svg width="24" height="24" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="10" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="2" />
                  <circle
                    cx="12" cy="12" r="10"
                    fill="none"
                    stroke={ringColor}
                    strokeWidth="2"
                    strokeDasharray={`${strokeDash} ${circumference}`}
                    strokeLinecap="round"
                    transform="rotate(-90 12 12)"
                    style={{ transition: "stroke-dasharray 0.15s, stroke 0.15s" }}
                  />
                </svg>
                <span className={`text-xs font-mono tabular-nums ${remaining <= 0 ? "text-red-400" : remaining <= 20 ? "text-amber-400" : "text-white/40"}`}>
                  {remaining}
                </span>
              </div>
            )}
            {onCancel && (
              <button onClick={onCancel} className="px-3 py-1.5 rounded-xl text-sm font-bold text-white/50 hover:bg-white/5 transition">
                Cancel
              </button>
            )}
            <button
              onClick={submit}
              disabled={!text.trim() || remaining < 0 || posting}
              className="px-5 py-1.5 rounded-full bg-blue-500 hover:bg-blue-400 text-white text-sm font-black transition disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {posting ? "Posting…" : replyTo ? "Reply" : "Tweet"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Tweet Card ──────────────────────────────────────────────────────────────

function TweetCard({ tweet, myUri, onLike, onDelete, onReply, onOpenDM, isDetail = false }) {
  const [localLiked, setLocalLiked] = useState(tweet.likedByMe);
  const [localCount, setLocalCount] = useState(tweet.likeCount);
  const [liking, setLiking] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  async function toggleLike(e) {
    e.stopPropagation();
    if (liking) return;
    setLiking(true);
    const action = localLiked ? "unlike" : "like";
    setLocalLiked(!localLiked);
    setLocalCount((c) => (action === "like" ? c + 1 : Math.max(0, c - 1)));
    try {
      await fetch("/api/biotweet", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, id: tweet.id }),
      });
      onLike?.(tweet.id, action);
    } catch {}
    setLiking(false);
  }

  async function doDelete(e) {
    e.stopPropagation();
    try {
      await fetch("/api/biotweet", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "delete", id: tweet.id }),
      });
      onDelete?.(tweet.id);
    } catch {}
  }

  return (
    <div className={`group relative px-4 py-3 border-b border-white/8 hover:bg-white/[0.02] transition-colors ${isDetail ? "pb-0 border-b-0" : "cursor-pointer"}`}>
      <div className="flex gap-3">
        <div className="flex flex-col items-center">
          <Link href={`/${tweet.authorUri}`} onClick={(e) => e.stopPropagation()}>
            <Avatar src={tweet.authorProfileImage} name={tweet.authorDisplayName} size={40} />
          </Link>
          {isDetail && <div className="w-px flex-1 bg-white/10 mt-2 mb-1" />}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <Link
              href={`/${tweet.authorUri}`}
              onClick={(e) => e.stopPropagation()}
              className="font-black text-white hover:underline text-[15px] leading-tight"
            >
              {tweet.authorDisplayName}
            </Link>
            <span className="text-white/40 text-sm">@{tweet.authorUri}</span>
            <span className="text-white/25 text-sm">·</span>
            <span className="text-white/35 text-sm">{timeAgo(tweet.createdAt)}</span>

            {/* Follow + DM inline on card (only shown on hover) */}
            <span className="ml-auto flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition">
              <DMButton uri={tweet.authorUri} myUri={myUri} onOpenDM={onOpenDM} />
              <FollowButton uri={tweet.authorUri} myUri={myUri} />
            </span>
          </div>

          <p className={`mt-1 text-white/90 whitespace-pre-wrap break-words ${isDetail ? "text-[17px] leading-relaxed" : "text-[15px] leading-relaxed"}`}>
            {tweet.body}
          </p>

          <div className="flex items-center gap-5 mt-3">
            {/* Reply */}
            <button
              onClick={(e) => { e.stopPropagation(); onReply?.(tweet); }}
              className="flex items-center gap-1.5 text-white/35 hover:text-blue-400 transition group/btn"
            >
              <svg viewBox="0 0 24 24" className="w-[18px] h-[18px] fill-none stroke-current" strokeWidth="1.8">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span className="text-xs font-bold tabular-nums" />
            </button>

            {/* Like */}
            <button
              onClick={toggleLike}
              className={`flex items-center gap-1.5 transition ${localLiked ? "text-pink-500" : "text-white/35 hover:text-pink-400"}`}
            >
              <svg viewBox="0 0 24 24" className="w-[18px] h-[18px]" fill={localLiked ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.8">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              {localCount > 0 && (
                <span className="text-xs font-bold tabular-nums">{localCount}</span>
              )}
            </button>

            {/* Delete (own tweets) */}
            {tweet.authorUri === myUri && (
              <>
                {showDeleteConfirm ? (
                  <span className="flex items-center gap-2 text-xs">
                    <button onClick={doDelete} className="text-red-400 font-bold hover:text-red-300 transition">Delete</button>
                    <button onClick={(e) => { e.stopPropagation(); setShowDeleteConfirm(false); }} className="text-white/35 hover:text-white/60 transition">Cancel</button>
                  </span>
                ) : (
                  <button
                    onClick={(e) => { e.stopPropagation(); setShowDeleteConfirm(true); }}
                    className="flex items-center gap-1.5 text-white/20 hover:text-red-400 transition opacity-0 group-hover:opacity-100"
                  >
                    <svg viewBox="0 0 24 24" className="w-[16px] h-[16px]" fill="none" stroke="currentColor" strokeWidth="1.8">
                      <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14H6L5 6" /><path d="M10 11v6M14 11v6" /><path d="M9 6V4h6v2" />
                    </svg>
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Search Panel ─────────────────────────────────────────────────────────────

function SearchPanel({ myUri, myDisplayName, myProfileImage, onOpenDM, onOpenDetail }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [nextCursor, setNextCursor] = useState(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [searched, setSearched] = useState(false);
  const inputRef = useRef(null);
  const debounceRef = useRef(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  async function search(q, cursor = null, append = false) {
    if (!q.trim()) { setResults([]); setSearched(false); return; }
    if (!append) setLoading(true);
    else setLoadingMore(true);

    try {
      const params = new URLSearchParams({ q: q.trim(), limit: "20" });
      if (cursor) params.set("cursor", cursor);
      const res = await fetch(`/api/biotweet?${params}`);
      const data = await res.json();
      if (res.ok) {
        setResults((prev) => append ? [...prev, ...data.tweets] : data.tweets);
        setNextCursor(data.nextCursor);
        setSearched(true);
      }
    } catch {}
    finally { setLoading(false); setLoadingMore(false); }
  }

  function onInput(e) {
    const v = e.target.value;
    setQuery(v);
    clearTimeout(debounceRef.current);
    if (!v.trim()) { setResults([]); setSearched(false); return; }
    debounceRef.current = setTimeout(() => search(v), 350);
  }

  function onKeyDown(e) {
    if (e.key === "Enter") { clearTimeout(debounceRef.current); search(query); }
  }

  return (
    <div>
      {/* Search input */}
      <div className="px-4 py-3 border-b border-white/8 sticky top-0 bg-[#080d18] z-10">
        <div className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-2xl px-4 py-2.5">
          <svg viewBox="0 0 24 24" className="w-4 h-4 text-white/35 shrink-0" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            ref={inputRef}
            value={query}
            onChange={onInput}
            onKeyDown={onKeyDown}
            placeholder="Search BioTweets…"
            className="flex-1 bg-transparent text-white placeholder:text-white/30 text-[15px] outline-none"
          />
          {query && (
            <button onClick={() => { setQuery(""); setResults([]); setSearched(false); }} className="text-white/30 hover:text-white/60 transition">
              <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Results */}
      {loading && (
        <div className="space-y-0">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="px-4 py-3 border-b border-white/8 flex gap-3 animate-pulse">
              <div className="w-10 h-10 rounded-full bg-white/8 shrink-0" />
              <div className="flex-1 space-y-2 pt-1">
                <div className="h-3 bg-white/8 rounded-full w-1/4" />
                <div className="h-3 bg-white/6 rounded-full w-3/4" />
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && searched && results.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-center px-8">
          <div className="text-3xl mb-3">🔍</div>
          <p className="text-white/40 text-sm">No results for <span className="text-white/60 font-bold">&ldquo;{query}&rdquo;</span></p>
        </div>
      )}

      {!loading && !searched && (
        <div className="flex flex-col items-center justify-center py-16 text-center px-8">
          <div className="text-3xl mb-3">🔍</div>
          <p className="text-white/40 text-sm">Search by tweet content, username, or display name</p>
        </div>
      )}

      {!loading && results.map((tweet) => (
        <div key={tweet.id} onClick={() => onOpenDetail?.(tweet)}>
          <TweetCard tweet={tweet} myUri={myUri} onReply={() => {}} onOpenDM={onOpenDM} />
        </div>
      ))}

      {nextCursor && !loading && (
        <div className="p-4 text-center border-t border-white/8">
          <button
            onClick={() => search(query, nextCursor, true)}
            disabled={loadingMore}
            className="px-5 py-2 rounded-full border border-white/15 text-sm font-bold text-white/60 hover:border-white/30 hover:text-white transition disabled:opacity-40"
          >
            {loadingMore ? "Loading…" : "Load more"}
          </button>
        </div>
      )}
    </div>
  );
}

// ─── DM Drawer ───────────────────────────────────────────────────────────────

function DMDrawer({ myUri, myDisplayName, myProfileImage, onClose }) {
  const [view, setView] = useState("threads"); // "threads" | "conversation"
  const [threads, setThreads] = useState([]);
  const [loadingThreads, setLoadingThreads] = useState(true);
  const [activeUri, setActiveUri] = useState(null);
  const [activeWith, setActiveWith] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const [dmText, setDmText] = useState("");
  const [sending, setSending] = useState(false);
  const [newToUri, setNewToUri] = useState("");
  const [composingNew, setComposingNew] = useState(false);
  const messagesEndRef = useRef(null);
  const pollRef = useRef(null);

  useEffect(() => {
    loadThreads();
    return () => clearInterval(pollRef.current);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function loadThreads() {
    setLoadingThreads(true);
    try {
      const res = await fetch("/api/biodm?threads=1");
      const data = await res.json();
      if (data.ok) setThreads(data.threads);
    } catch {}
    setLoadingThreads(false);
  }

  async function openConversation(withUri) {
    setActiveUri(withUri);
    setView("conversation");
    setLoadingMsgs(true);
    try {
      const res = await fetch(`/api/biodm?with=${withUri}`);
      const data = await res.json();
      if (data.ok) {
        setMessages(data.messages);
        setActiveWith(data.with);
      }
    } catch {}
    setLoadingMsgs(false);

    // Poll for new messages every 8s
    clearInterval(pollRef.current);
    pollRef.current = setInterval(async () => {
      try {
        const res = await fetch(`/api/biodm?with=${withUri}`);
        const data = await res.json();
        if (data.ok) setMessages(data.messages);
      } catch {}
    }, 8000);
  }

  async function sendDM() {
    const text = dmText.trim();
    const toUri = composingNew ? newToUri.trim().replace(/^@/, "") : activeUri;
    if (!text || !toUri || sending) return;
    setSending(true);
    try {
      const res = await fetch("/api/biodm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ toUri, body: text }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      setDmText("");
      if (composingNew) {
        setComposingNew(false);
        openConversation(toUri);
      } else {
        setMessages((prev) => [...prev, data.message]);
      }
    } catch (e) {
      alert(e.message);
    }
    setSending(false);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div
        className="relative z-10 w-full sm:w-[400px] h-[80vh] sm:h-[600px] bg-[#080d18] border border-white/10 rounded-t-3xl sm:rounded-3xl flex flex-col overflow-hidden shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-white/8 shrink-0">
          {view === "conversation" && (
            <button
              onClick={() => { setView("threads"); setActiveUri(null); clearInterval(pollRef.current); }}
              className="text-white/50 hover:text-white transition"
            >
              <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.2">
                <path d="M19 12H5M12 5l-7 7 7 7" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          )}
          <div className="flex-1 min-w-0">
            {view === "conversation" && activeWith ? (
              <div className="flex items-center gap-2">
                <Avatar src={activeWith.profileImage} name={activeWith.displayName} size={28} />
                <span className="font-black text-white text-sm">{activeWith.displayName}</span>
                <span className="text-white/35 text-xs">@{activeWith.uri}</span>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <span className="font-black text-white text-base">Messages</span>
                <span className="text-[10px] font-bold bg-amber-500/15 border border-amber-500/25 text-amber-400 rounded-full px-2 py-0.5">
                  ephemeral · 24h
                </span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            {view === "threads" && (
              <button
                onClick={() => setComposingNew(true)}
                className="text-white/50 hover:text-blue-400 transition"
                title="New DM"
              >
                <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 5v14M5 12h14" strokeLinecap="round" />
                </svg>
              </button>
            )}
            <button onClick={onClose} className="text-white/40 hover:text-white transition">
              <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        </div>

        {/* New DM compose modal */}
        {composingNew && (
          <div className="px-4 py-3 bg-white/[0.03] border-b border-white/8 shrink-0">
            <div className="text-xs font-black text-white/50 uppercase tracking-wider mb-2">New Message</div>
            <div className="flex gap-2">
              <input
                autoFocus
                value={newToUri}
                onChange={(e) => setNewToUri(e.target.value)}
                placeholder="@username"
                className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder:text-white/30 outline-none focus:border-blue-500/50"
              />
              <button
                onClick={() => setComposingNew(false)}
                className="text-white/40 hover:text-white/70 text-xs font-bold px-2"
              >
                Cancel
              </button>
            </div>
            <textarea
              value={dmText}
              onChange={(e) => setDmText(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) sendDM(); }}
              placeholder="Write a message…"
              rows={2}
              maxLength={DM_MAX}
              className="w-full mt-2 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder:text-white/30 outline-none focus:border-blue-500/50 resize-none"
            />
            <div className="flex justify-between items-center mt-2">
              <span className="text-xs text-white/25">⌘↵ to send · disappears in 24h</span>
              <button
                onClick={sendDM}
                disabled={!dmText.trim() || !newToUri.trim() || sending}
                className="px-4 py-1.5 rounded-full bg-blue-500 hover:bg-blue-400 text-white text-xs font-black transition disabled:opacity-40"
              >
                {sending ? "Sending…" : "Send"}
              </button>
            </div>
          </div>
        )}

        {/* Thread list */}
        {view === "threads" && !composingNew && (
          <div className="flex-1 overflow-y-auto">
            {loadingThreads ? (
              <div className="space-y-0 mt-2">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="px-4 py-3 flex gap-3 animate-pulse">
                    <div className="w-10 h-10 rounded-full bg-white/8 shrink-0" />
                    <div className="flex-1 space-y-2 pt-1">
                      <div className="h-3 bg-white/8 rounded-full w-1/3" />
                      <div className="h-3 bg-white/5 rounded-full w-2/3" />
                    </div>
                  </div>
                ))}
              </div>
            ) : threads.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center px-8 pb-8">
                <div className="text-3xl mb-3">✉️</div>
                <p className="text-white/40 text-sm">No messages yet</p>
                <p className="text-white/25 text-xs mt-1">Messages disappear after 24h</p>
                <button
                  onClick={() => setComposingNew(true)}
                  className="mt-4 px-4 py-2 rounded-full bg-blue-500 hover:bg-blue-400 text-white text-xs font-black transition"
                >
                  Start a conversation
                </button>
              </div>
            ) : (
              threads.map((thread, i) => (
                <button
                  key={i}
                  onClick={() => openConversation(thread.withUri)}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/[0.04] transition border-b border-white/5 text-left"
                >
                  <Avatar src={thread.withProfileImage} name={thread.withDisplayName} size={40} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-black text-white text-sm truncate">{thread.withDisplayName}</span>
                      <span className="text-white/30 text-xs shrink-0">{timeAgo(thread.lastMessage.createdAt)}</span>
                    </div>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="text-white/40 text-xs truncate">{thread.lastMessage.mine ? "You: " : ""}{thread.lastMessage.body}</span>
                      {thread.unreadCount > 0 && (
                        <span className="shrink-0 w-4 h-4 rounded-full bg-blue-500 text-[10px] font-black text-white flex items-center justify-center">
                          {thread.unreadCount > 9 ? "9+" : thread.unreadCount}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        )}

        {/* Conversation view */}
        {view === "conversation" && (
          <>
            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
              {loadingMsgs ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-white/30 text-sm">Loading…</div>
                </div>
              ) : messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <div className="text-2xl mb-2">👋</div>
                  <p className="text-white/40 text-sm">Start the conversation</p>
                  <p className="text-white/25 text-xs mt-1">Messages vanish after 24h</p>
                </div>
              ) : (
                messages.map((msg) => (
                  <div key={msg.id} className={`flex flex-col ${msg.mine ? "items-end" : "items-start"}`}>
                    <div
                      className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm ${
                        msg.mine
                          ? "bg-blue-500 text-white rounded-br-sm"
                          : "bg-white/8 text-white/90 rounded-bl-sm"
                      }`}
                    >
                      {msg.body}
                    </div>
                    <div className="flex items-center gap-1.5 mt-0.5 px-1">
                      <span className="text-white/20 text-[10px]">{timeAgo(msg.createdAt)}</span>
                      <span className="text-white/15 text-[10px]">·</span>
                      <span className="text-amber-500/50 text-[10px]">disappears in {timeLeft(msg.expiresAt)}</span>
                    </div>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="shrink-0 px-4 py-3 border-t border-white/8">
              <div className="flex gap-2">
                <input
                  value={dmText}
                  onChange={(e) => setDmText(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendDM(); } }}
                  placeholder="Message…"
                  maxLength={DM_MAX}
                  className="flex-1 bg-white/5 border border-white/10 rounded-2xl px-4 py-2.5 text-sm text-white placeholder:text-white/30 outline-none focus:border-blue-500/50 transition"
                />
                <button
                  onClick={sendDM}
                  disabled={!dmText.trim() || sending}
                  className="p-2.5 rounded-2xl bg-blue-500 hover:bg-blue-400 text-white transition disabled:opacity-40"
                >
                  <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.2">
                    <line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" />
                  </svg>
                </button>
              </div>
              <div className="text-center mt-1.5 text-white/20 text-[10px]">↵ to send · messages vanish after 24h</div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ─── Tab bar ──────────────────────────────────────────────────────────────────

function Tabs({ active, onChange, unreadDMs = 0 }) {
  const tabs = [
    { key: "home", label: "For You" },
    { key: "following", label: "My Tweets" },
    { key: "search", label: "Search" },
  ];
  return (
    <div className="flex border-b border-white/8">
      {tabs.map((t) => (
        <button
          key={t.key}
          onClick={() => onChange(t.key)}
          className={`flex-1 py-4 text-sm font-black transition relative ${active === t.key ? "text-white" : "text-white/40 hover:text-white/70"}`}
        >
          {t.label}
          {active === t.key && (
            <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-12 h-0.5 bg-blue-500 rounded-full" />
          )}
        </button>
      ))}
    </div>
  );
}

// ─── Feed ─────────────────────────────────────────────────────────────────────

function Feed({ tab, myUri, myDisplayName, myProfileImage, replyingTo, setReplyingTo, onOpenDM }) {
  const [tweets, setTweets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [nextCursor, setNextCursor] = useState(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [detailTweet, setDetailTweet] = useState(null);
  const [detailReplies, setDetailReplies] = useState([]);
  const [loadingDetail, setLoadingDetail] = useState(false);

  const fetchTweets = useCallback(async (cursor = null, replace = true) => {
    if (replace) setLoading(true);
    else setLoadingMore(true);

    try {
      const params = new URLSearchParams({ limit: "20" });
      if (tab === "following") params.set("uri", myUri);
      if (cursor) params.set("cursor", cursor);

      const res = await fetch(`/api/biotweet?${params}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setTweets((prev) => replace ? data.tweets : [...prev, ...data.tweets]);
      setNextCursor(data.nextCursor);
    } catch {}
    finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [tab, myUri]);

  useEffect(() => {
    setTweets([]);
    setNextCursor(null);
    setDetailTweet(null);
    fetchTweets();
  }, [tab, fetchTweets]);

  async function openDetail(tweet) {
    setDetailTweet(tweet);
    setLoadingDetail(true);
    try {
      const res = await fetch(`/api/biotweet?id=${tweet.id}`);
      const data = await res.json();
      if (data.ok) {
        setDetailTweet(data.tweet);
        setDetailReplies(data.replies);
      }
    } catch {}
    finally { setLoadingDetail(false); }
  }

  function handleNewTweet(tweet) {
    if (detailTweet && tweet.replyTo === detailTweet.id) {
      setDetailReplies((prev) => [...prev, tweet]);
      setReplyingTo(null);
      return;
    }
    if (!tweet.replyTo) {
      setTweets((prev) => [tweet, ...prev]);
    }
    setReplyingTo(null);
  }

  function handleDelete(id) {
    if (detailTweet?.id === id) {
      setDetailTweet(null);
      setDetailReplies([]);
    }
    setTweets((prev) => prev.filter((t) => t.id !== id));
    setDetailReplies((prev) => prev.filter((t) => t.id !== id));
  }

  // Detail view
  if (detailTweet) {
    return (
      <div>
        <button
          onClick={() => { setDetailTweet(null); setDetailReplies([]); setReplyingTo(null); }}
          className="flex items-center gap-2 px-4 py-3 text-sm font-bold text-white/60 hover:text-white transition border-b border-white/8"
        >
          <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.2">
            <path d="M19 12H5M12 5l-7 7 7 7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Back
        </button>

        <div className="px-4 pt-4 pb-2">
          <div className="flex gap-3 items-start">
            <Link href={`/${detailTweet.authorUri}`}>
              <Avatar src={detailTweet.authorProfileImage} name={detailTweet.authorDisplayName} size={44} />
            </Link>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div>
                  <div className="font-black text-white text-[15px]">{detailTweet.authorDisplayName}</div>
                  <div className="text-white/40 text-sm">@{detailTweet.authorUri}</div>
                </div>
                <div className="flex items-center gap-2">
                  <DMButton uri={detailTweet.authorUri} myUri={myUri} onOpenDM={onOpenDM} />
                  <FollowButton uri={detailTweet.authorUri} myUri={myUri} />
                </div>
              </div>
            </div>
          </div>
          <p className="mt-3 text-[17px] text-white/90 whitespace-pre-wrap break-words leading-relaxed">
            {detailTweet.body}
          </p>
          <div className="mt-3 pb-3 border-b border-white/8 text-xs text-white/35">
            {new Intl.DateTimeFormat("en-GB", {
              hour: "2-digit", minute: "2-digit", day: "numeric", month: "short", year: "numeric"
            }).format(new Date(detailTweet.createdAt))}
          </div>
          <div className="flex items-center gap-5 py-3 border-b border-white/8">
            <button
              onClick={() => setReplyingTo(detailTweet)}
              className="flex items-center gap-1.5 text-white/35 hover:text-blue-400 transition"
            >
              <svg viewBox="0 0 24 24" className="w-5 h-5 fill-none stroke-current" strokeWidth="1.8">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span className="text-sm font-bold">Reply</span>
            </button>
          </div>
        </div>

        {replyingTo?.id === detailTweet.id && (
          <div className="border-b border-white/8">
            <ComposeBox
              myUri={myUri}
              myDisplayName={myDisplayName}
              myProfileImage={myProfileImage}
              onPost={handleNewTweet}
              replyTo={detailTweet}
              onCancel={() => setReplyingTo(null)}
            />
          </div>
        )}

        {loadingDetail ? (
          <div className="p-6 text-center text-white/30 text-sm">Loading replies…</div>
        ) : (
          detailReplies.map((r) => (
            <TweetCard
              key={r.id}
              tweet={r}
              myUri={myUri}
              onDelete={handleDelete}
              onReply={setReplyingTo}
              onOpenDM={onOpenDM}
            />
          ))
        )}

        {detailReplies.length === 0 && !loadingDetail && (
          <div className="p-6 text-center text-white/25 text-sm">No replies yet.</div>
        )}
      </div>
    );
  }

  if (loading) {
    return (
      <div className="space-y-0">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="px-4 py-3 border-b border-white/8 flex gap-3 animate-pulse">
            <div className="w-10 h-10 rounded-full bg-white/8 shrink-0" />
            <div className="flex-1 space-y-2 pt-1">
              <div className="h-3 bg-white/8 rounded-full w-1/4" />
              <div className="h-3 bg-white/6 rounded-full w-3/4" />
              <div className="h-3 bg-white/5 rounded-full w-1/2" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (tweets.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center px-8">
        <div className="text-4xl mb-4">🐦</div>
        <h3 className="text-lg font-black text-white">
          {tab === "following" ? "No tweets yet" : "Nothing here yet"}
        </h3>
        <p className="mt-2 text-sm text-white/40">
          {tab === "following" ? "Post your first tweet above!" : "Be the first to post something."}
        </p>
      </div>
    );
  }

  return (
    <div>
      {tweets.map((tweet) => (
        <div key={tweet.id} onClick={() => openDetail(tweet)}>
          <TweetCard
            tweet={tweet}
            myUri={myUri}
            onLike={() => {}}
            onDelete={handleDelete}
            onReply={(t) => { openDetail(t); setReplyingTo(t); }}
            onOpenDM={onOpenDM}
          />
        </div>
      ))}

      {nextCursor && (
        <div className="p-4 text-center border-t border-white/8">
          <button
            onClick={() => fetchTweets(nextCursor, false)}
            disabled={loadingMore}
            className="px-5 py-2 rounded-full border border-white/15 text-sm font-bold text-white/60 hover:border-white/30 hover:text-white transition disabled:opacity-40"
          >
            {loadingMore ? "Loading…" : "Load more"}
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Main export ─────────────────────────────────────────────────────────────

export default function BioTweetClient({ myUri, myDisplayName, myProfileImage }) {
  const [tab, setTab] = useState("home");
  const [replyingTo, setReplyingTo] = useState(null);
  const [dmOpen, setDmOpen] = useState(false);
  const [dmInitialUri, setDmInitialUri] = useState(null);
  const [unreadDMs, setUnreadDMs] = useState(0);

  // Poll unread DM count
  useEffect(() => {
    if (!myUri) return;
    async function checkUnread() {
      try {
        const res = await fetch("/api/biodm?unread=1");
        const data = await res.json();
        if (data.ok) setUnreadDMs(data.unread);
      } catch {}
    }
    checkUnread();
    const interval = setInterval(checkUnread, 30000);
    return () => clearInterval(interval);
  }, [myUri]);

  function openDM(uri = null) {
    setDmInitialUri(uri);
    setDmOpen(true);
  }

  return (
    <>
      <div className="max-w-[600px] mx-auto rounded-3xl border border-white/10 bg-[#080d18] overflow-hidden">
        {/* Header */}
        <div className="px-4 pt-4 pb-2 border-b border-white/8">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-2xl">🐦</span>
            <h1 className="text-xl font-black tracking-tight text-white">BioTweet</h1>
            <span className="ml-auto text-xs font-bold text-blue-400/60 bg-blue-500/10 border border-blue-500/20 rounded-full px-2.5 py-0.5">
              beta
            </span>
            {/* DM button in header */}
            {myUri && (
              <button
                onClick={() => openDM()}
                className="relative p-2 rounded-xl text-white/40 hover:text-white hover:bg-white/5 transition"
                title="Messages"
              >
                <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" strokeLinecap="round" strokeLinejoin="round" />
                  <polyline points="22,6 12,13 2,6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                {unreadDMs > 0 && (
                  <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-blue-500" />
                )}
              </button>
            )}
          </div>
        </div>

        {/* Compose */}
        {myUri ? (
          <div className="border-b border-white/8">
            <ComposeBox
              myUri={myUri}
              myDisplayName={myDisplayName}
              myProfileImage={myProfileImage}
              onPost={(tweet) => {
                if (!tweet.replyTo) {
                  setTab((t) => t === "home" ? "home" : t);
                }
              }}
            />
          </div>
        ) : (
          <div className="px-4 py-4 border-b border-white/8 text-sm text-amber-400 bg-amber-500/5 border-l-2 border-l-amber-500">
            You need a username to tweet. <a href="/account" className="underline font-bold">Set one here →</a>
          </div>
        )}

        {/* Tabs */}
        <Tabs active={tab} onChange={setTab} unreadDMs={unreadDMs} />

        {/* Search panel */}
        {tab === "search" ? (
          <SearchPanel
            myUri={myUri}
            myDisplayName={myDisplayName}
            myProfileImage={myProfileImage}
            onOpenDM={openDM}
          />
        ) : (
          <Feed
            key={tab}
            tab={tab}
            myUri={myUri}
            myDisplayName={myDisplayName}
            myProfileImage={myProfileImage}
            replyingTo={replyingTo}
            setReplyingTo={setReplyingTo}
            onOpenDM={openDM}
          />
        )}
      </div>

      {/* DM Drawer */}
      {dmOpen && (
        <DMDrawer
          myUri={myUri}
          myDisplayName={myDisplayName}
          myProfileImage={myProfileImage}
          initialUri={dmInitialUri}
          onClose={() => { setDmOpen(false); setDmInitialUri(null); setUnreadDMs(0); }}
        />
      )}
    </>
  );
}
