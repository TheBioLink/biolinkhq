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

const MAX = 280;

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

function TweetCard({ tweet, myUri, onLike, onDelete, onReply, isDetail = false }) {
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
          <div className="flex items-baseline gap-2 flex-wrap">
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

// ─── Tab bar ──────────────────────────────────────────────────────────────────

function Tabs({ active, onChange }) {
  const tabs = [
    { key: "home", label: "For You" },
    { key: "following", label: "My Tweets" },
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

function Feed({ tab, myUri, myDisplayName, myProfileImage, replyingTo, setReplyingTo }) {
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
        {/* Back */}
        <button
          onClick={() => { setDetailTweet(null); setDetailReplies([]); setReplyingTo(null); }}
          className="flex items-center gap-2 px-4 py-3 text-sm font-bold text-white/60 hover:text-white transition border-b border-white/8"
        >
          <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.2">
            <path d="M19 12H5M12 5l-7 7 7 7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Back
        </button>

        {/* Main tweet */}
        <div onClick={() => {}} className="px-4 pt-4 pb-2">
          <div className="flex gap-3">
            <Link href={`/${detailTweet.authorUri}`}>
              <Avatar src={detailTweet.authorProfileImage} name={detailTweet.authorDisplayName} size={44} />
            </Link>
            <div>
              <div className="font-black text-white text-[15px]">{detailTweet.authorDisplayName}</div>
              <div className="text-white/40 text-sm">@{detailTweet.authorUri}</div>
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
          {/* Actions on detail */}
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

        {/* Reply compose */}
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

        {/* Replies */}
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

  return (
    <div className="max-w-[600px] mx-auto rounded-3xl border border-white/10 bg-[#080d18] overflow-hidden">
      {/* Header */}
      <div className="px-4 pt-4 pb-2 border-b border-white/8">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-2xl">🐦</span>
          <h1 className="text-xl font-black tracking-tight text-white">BioTweet</h1>
          <span className="ml-auto text-xs font-bold text-blue-400/60 bg-blue-500/10 border border-blue-500/20 rounded-full px-2.5 py-0.5">
            beta
          </span>
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
                // trigger feed refresh via key trick — just re-mount
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
      <Tabs active={tab} onChange={setTab} />

      {/* Feed — key forces remount on tab change so fresh fetch */}
      <Feed
        key={tab}
        tab={tab}
        myUri={myUri}
        myDisplayName={myDisplayName}
        myProfileImage={myProfileImage}
        replyingTo={replyingTo}
        setReplyingTo={setReplyingTo}
      />
    </div>
  );
}
