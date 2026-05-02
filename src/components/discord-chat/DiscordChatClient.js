// src/components/discord-chat/DiscordChatClient.js
"use client";

import { useCallback, useEffect, useRef, useState } from "react";

// ─── Constants ────────────────────────────────────────────────────────────────

const ALLOWED_EMOJIS = ["👍","❤️","😂","😮","😢","😡","🔥","✅","💯","🎉","👀","🚀","💀","🤝","⭐"];
const POLL_INTERVAL_MS = 3000;
const MAX_MSG = 2000;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function timeAgo(date) {
  const diff = Math.floor((Date.now() - new Date(date)) / 1000);
  if (diff < 5) return "just now";
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
}

function formatTimestamp(date) {
  return new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
}

// ─── Avatar ───────────────────────────────────────────────────────────────────

function Avatar({ src, name, size = 36 }) {
  const initial = (name || "?").slice(0, 1).toUpperCase();
  return (
    <div
      className="shrink-0 rounded-full overflow-hidden bg-[#1e2d4a] border border-white/10 flex items-center justify-center font-black text-white/60 select-none"
      style={{ width: size, height: size, fontSize: Math.round(size * 0.38) }}
    >
      {src ? (
        <img src={src} alt={name} className="w-full h-full object-cover" />
      ) : (
        initial
      )}
    </div>
  );
}

// ─── Channel List ─────────────────────────────────────────────────────────────

function ChannelList({ channels, activeSlug, onSelect, isAdmin, onCreateChannel }) {
  const [newName, setNewName] = useState("");
  const [newEmoji, setNewEmoji] = useState("💬");
  const [creating, setCreating] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [err, setErr] = useState("");

  async function createChannel(e) {
    e.preventDefault();
    if (!newName.trim()) return;
    setCreating(true);
    setErr("");
    try {
      const res = await fetch("/api/discord-chat/channels", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName.trim(), emoji: newEmoji }),
      });
      const data = await res.json();
      if (!res.ok) { setErr(data.error || "Failed"); return; }
      setNewName("");
      setNewEmoji("💬");
      setShowForm(false);
      onCreateChannel?.(data.channel);
    } catch { setErr("Network error"); }
    finally { setCreating(false); }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Server header */}
      <div className="px-4 py-3 border-b border-white/8 shrink-0">
        <div className="flex items-center justify-between">
          <div>
            <div className="font-black text-white text-sm">BioLinkHQ</div>
            <div className="text-[10px] text-white/35 uppercase tracking-wider mt-0.5">Community</div>
          </div>
          {/* Discord-style hash icon */}
          <svg viewBox="0 0 24 24" className="w-4 h-4 text-white/20" fill="currentColor">
            <path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm-1 14H5V8h14v10z"/>
          </svg>
        </div>
      </div>

      {/* Channels section */}
      <div className="flex-1 overflow-y-auto px-2 py-3 space-y-0.5">
        <div className="flex items-center justify-between px-2 mb-2">
          <span className="text-[10px] font-black uppercase tracking-[0.18em] text-white/30">
            Text Channels
          </span>
          {isAdmin && (
            <button
              onClick={() => setShowForm((v) => !v)}
              className="text-white/30 hover:text-white/70 transition"
              title="Add channel"
            >
              <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M12 5v14M5 12h14" strokeLinecap="round" />
              </svg>
            </button>
          )}
        </div>

        {/* New channel form */}
        {isAdmin && showForm && (
          <form onSubmit={createChannel} className="mx-1 mb-3 rounded-xl bg-white/[0.04] border border-white/10 p-3 space-y-2">
            <div className="flex gap-2">
              <input
                value={newEmoji}
                onChange={(e) => setNewEmoji(e.target.value.slice(0, 4) || "💬")}
                className="w-10 bg-black/30 border border-white/10 rounded-lg px-2 py-1.5 text-sm text-center outline-none"
                placeholder="💬"
              />
              <input
                autoFocus
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="channel-name"
                className="flex-1 bg-black/30 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white placeholder:text-white/30 outline-none focus:border-blue-500/50"
              />
            </div>
            {err && <div className="text-xs text-red-400">{err}</div>}
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={creating || !newName.trim()}
                className="flex-1 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-black text-white hover:bg-blue-500 disabled:opacity-50 transition"
              >
                {creating ? "Creating…" : "Create"}
              </button>
              <button
                type="button"
                onClick={() => { setShowForm(false); setErr(""); }}
                className="px-3 py-1.5 text-xs text-white/40 hover:text-white/70 transition"
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        {/* Channel items */}
        {channels.map((ch) => (
          <button
            key={ch.id}
            onClick={() => onSelect(ch)}
            className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-left transition group ${
              activeSlug === ch.slug
                ? "bg-white/10 text-white"
                : "text-white/45 hover:bg-white/[0.05] hover:text-white/80"
            }`}
          >
            <span className="text-base leading-none shrink-0">{ch.emoji || "💬"}</span>
            <span className="text-sm font-semibold truncate">{ch.name}</span>
            {ch.isDefault && (
              <span className="ml-auto text-[9px] font-black text-white/20 uppercase tracking-wider shrink-0">
                default
              </span>
            )}
          </button>
        ))}

        {channels.length === 0 && (
          <div className="px-2 py-4 text-xs text-white/25 text-center">
            No channels yet
          </div>
        )}
      </div>

      {/* Bottom user badge (cosmetic) */}
      <div className="px-3 py-3 border-t border-white/8 shrink-0 bg-black/20">
        <div className="text-[10px] text-white/25 text-center tracking-wider">
          🔒 Messages stored securely
        </div>
      </div>
    </div>
  );
}

// ─── Reaction Bar ─────────────────────────────────────────────────────────────

function ReactionBar({ reactions, onReact }) {
  if (!reactions || reactions.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-1 mt-1.5">
      {reactions.map((r) => (
        <button
          key={r.emoji}
          onClick={() => onReact(r.emoji)}
          className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-xs border transition ${
            r.reactedByMe
              ? "bg-blue-500/20 border-blue-500/40 text-blue-200"
              : "bg-white/[0.04] border-white/10 text-white/60 hover:bg-white/10 hover:border-white/20"
          }`}
        >
          <span>{r.emoji}</span>
          <span className="font-bold tabular-nums">{r.count}</span>
        </button>
      ))}
    </div>
  );
}

// ─── Emoji Picker ─────────────────────────────────────────────────────────────

function EmojiPicker({ onSelect, onClose }) {
  const ref = useRef(null);

  useEffect(() => {
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) onClose();
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [onClose]);

  return (
    <div
      ref={ref}
      className="absolute z-50 bottom-full mb-2 left-0 bg-[#1a2540] border border-white/10 rounded-2xl p-3 shadow-2xl"
    >
      <div className="grid grid-cols-5 gap-1.5">
        {ALLOWED_EMOJIS.map((emoji) => (
          <button
            key={emoji}
            onClick={() => { onSelect(emoji); onClose(); }}
            className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-white/10 transition text-lg"
          >
            {emoji}
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Message Item ─────────────────────────────────────────────────────────────

function MessageItem({
  message,
  prevMessage,
  myUri,
  isAdmin,
  onReact,
  onReply,
  onDelete,
  onEdit,
}) {
  const [hovering, setHovering] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState(message.body);
  const [saving, setSaving] = useState(false);

  // Group messages from the same author within 5 minutes
  const isGrouped =
    prevMessage &&
    prevMessage.authorUri === message.authorUri &&
    !prevMessage.deleted &&
    new Date(message.createdAt) - new Date(prevMessage.createdAt) < 5 * 60 * 1000;

  const canDelete = message.isMine || isAdmin;
  const canEdit = message.isMine && !message.deleted;

  async function saveEdit() {
    const text = editText.trim();
    if (!text || saving) return;
    setSaving(true);
    try {
      const res = await fetch("/api/discord-chat/messages", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "edit", id: message.id, body: text }),
      });
      const data = await res.json();
      if (data.ok) {
        onEdit?.(data.message);
        setEditing(false);
      }
    } catch {}
    setSaving(false);
  }

  if (message.deleted) {
    return (
      <div className={`px-4 py-0.5 ${!isGrouped ? "mt-3" : ""}`}>
        <span className="text-sm italic text-white/20">Message deleted</span>
      </div>
    );
  }

  return (
    <div
      className={`relative px-4 py-0.5 group hover:bg-white/[0.02] transition-colors ${!isGrouped ? "mt-4" : ""}`}
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => { setHovering(false); setShowEmojiPicker(false); }}
    >
      {/* Action toolbar on hover */}
      {hovering && !editing && (
        <div className="absolute right-4 top-0 -translate-y-1/2 z-20 flex items-center gap-1 bg-[#1a2540] border border-white/10 rounded-xl px-2 py-1 shadow-lg">
          {/* Emoji react */}
          <div className="relative">
            <button
              onClick={() => setShowEmojiPicker((v) => !v)}
              className="p-1 rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition text-base leading-none"
              title="Add reaction"
            >
              😊
            </button>
            {showEmojiPicker && (
              <EmojiPicker
                onSelect={(emoji) => onReact(message.id, emoji)}
                onClose={() => setShowEmojiPicker(false)}
              />
            )}
          </div>
          {/* Reply */}
          <button
            onClick={() => onReply(message)}
            className="p-1 rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition"
            title="Reply"
          >
            <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          {/* Edit */}
          {canEdit && (
            <button
              onClick={() => { setEditing(true); setEditText(message.body); }}
              className="p-1 rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition"
              title="Edit"
            >
              <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          )}
          {/* Delete */}
          {canDelete && (
            <button
              onClick={() => onDelete(message.id)}
              className="p-1 rounded-lg text-white/40 hover:text-red-400 hover:bg-red-500/10 transition"
              title="Delete"
            >
              <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          )}
        </div>
      )}

      <div className="flex gap-3">
        {/* Avatar — only show on first message of group */}
        <div className="w-9 shrink-0">
          {!isGrouped ? (
            <Avatar
              src={message.authorProfileImage}
              name={message.authorDisplayName}
              size={36}
            />
          ) : (
            <div className="w-9 h-full" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          {/* Author + timestamp — only on first of group */}
          {!isGrouped && (
            <div className="flex items-baseline gap-2 mb-0.5">
              <a
                href={`/${message.authorUri}`}
                target="_blank"
                rel="noreferrer"
                className="font-black text-white text-sm hover:underline"
              >
                {message.authorDisplayName}
              </a>
              <span className="text-[11px] text-white/30">
                {formatTimestamp(message.createdAt)}
              </span>
              {message.isMine && (
                <span className="text-[10px] text-blue-400/60 font-bold uppercase tracking-wide">
                  You
                </span>
              )}
            </div>
          )}

          {/* Reply preview */}
          {message.replyTo && message.replyToSnippet && (
            <div className="flex items-center gap-2 mb-1 pl-2 border-l-2 border-white/20">
              <span className="text-[11px] text-white/40 truncate max-w-xs">
                <span className="font-bold text-white/55">@{message.replyToAuthorUri} </span>
                {message.replyToSnippet}
              </span>
            </div>
          )}

          {/* Body or edit box */}
          {editing ? (
            <div className="mt-1">
              <textarea
                autoFocus
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); saveEdit(); }
                  if (e.key === "Escape") { setEditing(false); setEditText(message.body); }
                }}
                rows={2}
                maxLength={MAX_MSG}
                className="w-full bg-[#1a2540] border border-blue-500/40 rounded-xl px-3 py-2 text-sm text-white outline-none resize-none"
              />
              <div className="flex gap-2 mt-1.5">
                <button
                  onClick={saveEdit}
                  disabled={saving || !editText.trim()}
                  className="px-3 py-1 rounded-lg bg-blue-600 text-xs font-bold text-white hover:bg-blue-500 disabled:opacity-50 transition"
                >
                  {saving ? "Saving…" : "Save"}
                </button>
                <button
                  onClick={() => { setEditing(false); setEditText(message.body); }}
                  className="px-3 py-1 rounded-lg text-xs text-white/40 hover:text-white/70 transition"
                >
                  Cancel
                </button>
                <span className="text-[10px] text-white/20 flex items-center">↵ save · Esc cancel</span>
              </div>
            </div>
          ) : (
            <p className="text-[14.5px] text-white/90 leading-relaxed whitespace-pre-wrap break-words">
              {message.body}
              {message.editedAt && (
                <span className="ml-1.5 text-[10px] text-white/25 italic">(edited)</span>
              )}
            </p>
          )}

          {/* Reactions */}
          <ReactionBar
            reactions={message.reactions}
            onReact={(emoji) => onReact(message.id, emoji)}
          />
        </div>
      </div>
    </div>
  );
}

// ─── Message List ─────────────────────────────────────────────────────────────

function MessageList({
  messages,
  myUri,
  isAdmin,
  onReact,
  onReply,
  onDelete,
  onEdit,
  hasMore,
  onLoadMore,
  loadingMore,
  bottomRef,
}) {
  return (
    <div className="flex-1 overflow-y-auto flex flex-col">
      {/* Load more */}
      {hasMore && (
        <div className="flex justify-center py-4">
          <button
            onClick={onLoadMore}
            disabled={loadingMore}
            className="px-4 py-1.5 rounded-full border border-white/15 text-xs font-bold text-white/50 hover:border-white/30 hover:text-white/80 transition disabled:opacity-40"
          >
            {loadingMore ? "Loading…" : "Load older messages"}
          </button>
        </div>
      )}

      {messages.length === 0 && (
        <div className="flex-1 flex flex-col items-center justify-center text-center px-8 pb-8">
          <div className="text-4xl mb-3">💬</div>
          <h3 className="text-lg font-black text-white">Be the first to say something!</h3>
          <p className="mt-2 text-sm text-white/40">Start the conversation in this channel.</p>
        </div>
      )}

      <div className="pb-2">
        {messages.map((msg, idx) => (
          <MessageItem
            key={msg.id}
            message={msg}
            prevMessage={idx > 0 ? messages[idx - 1] : null}
            myUri={myUri}
            isAdmin={isAdmin}
            onReact={onReact}
            onReply={onReply}
            onDelete={onDelete}
            onEdit={onEdit}
          />
        ))}
      </div>
      <div ref={bottomRef} />
    </div>
  );
}

// ─── Compose Box ─────────────────────────────────────────────────────────────

function ComposeBox({
  myUri,
  myDisplayName,
  myProfileImage,
  channelName,
  replyingTo,
  onCancelReply,
  onSend,
  disabled,
}) {
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const textareaRef = useRef(null);
  const remaining = MAX_MSG - text.length;

  function autoResize() {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 200)}px`;
  }

  async function submit() {
    const trimmed = text.trim();
    if (!trimmed || sending || disabled) return;
    setSending(true);
    try {
      await onSend(trimmed);
      setText("");
      if (textareaRef.current) textareaRef.current.style.height = "auto";
    } catch {}
    setSending(false);
  }

  function onKey(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  }

  return (
    <div className="px-4 pb-4 pt-2 shrink-0">
      {/* Reply preview */}
      {replyingTo && (
        <div className="flex items-center gap-2 mb-2 px-3 py-1.5 rounded-xl bg-white/[0.04] border border-white/10">
          <div className="w-0.5 h-5 bg-blue-500 rounded-full shrink-0" />
          <span className="text-xs text-white/50 truncate flex-1">
            Replying to <span className="text-white/80 font-bold">@{replyingTo.authorUri}</span>
            {" — "}
            {replyingTo.body.slice(0, 60)}{replyingTo.body.length > 60 ? "…" : ""}
          </span>
          <button
            onClick={onCancelReply}
            className="text-white/30 hover:text-white/70 transition shrink-0"
          >
            <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M6 18L18 6M6 6l12 12" strokeLinecap="round" />
            </svg>
          </button>
        </div>
      )}

      <div className="flex gap-2 items-end bg-[#1a2540] rounded-2xl border border-white/10 px-3 py-2.5">
        <Avatar src={myProfileImage} name={myDisplayName} size={28} />

        <textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => { setText(e.target.value); autoResize(); }}
          onKeyDown={onKey}
          placeholder={disabled ? "Set a username to chat" : `Message #${channelName}`}
          disabled={disabled}
          maxLength={MAX_MSG + 50}
          rows={1}
          className="flex-1 bg-transparent text-white placeholder:text-white/25 text-sm resize-none outline-none leading-relaxed min-h-[22px] max-h-[200px] disabled:cursor-not-allowed"
          style={{ overflow: "hidden" }}
        />

        {text.length > MAX_MSG * 0.8 && (
          <span className={`text-[11px] font-mono shrink-0 ${remaining <= 0 ? "text-red-400" : "text-white/30"}`}>
            {remaining}
          </span>
        )}

        <button
          onClick={submit}
          disabled={!text.trim() || remaining < 0 || sending || disabled}
          className="shrink-0 p-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white transition disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.2">
            <line x1="22" y1="2" x2="11" y2="13" />
            <polygon points="22 2 15 22 11 13 2 9 22 2" />
          </svg>
        </button>
      </div>

      <div className="text-center mt-1.5 text-white/20 text-[10px]">
        ↵ to send · Shift+↵ for new line
      </div>
    </div>
  );
}

// ─── Channel Admin Panel ──────────────────────────────────────────────────────

function AdminPanel({ channels, onDeleteChannel }) {
  const [deleting, setDeleting] = useState(null);
  const [msg, setMsg] = useState("");

  async function deleteChannel(id) {
    if (deleting) return;
    setDeleting(id);
    setMsg("");
    try {
      const res = await fetch("/api/discord-chat/channels", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      const data = await res.json();
      if (!res.ok) { setMsg(data.error || "Failed"); return; }
      onDeleteChannel?.(id);
      setMsg("Channel deleted.");
    } catch { setMsg("Network error"); }
    finally { setDeleting(null); }
  }

  return (
    <div className="p-4 space-y-3">
      <div className="text-xs font-black uppercase tracking-[0.18em] text-red-300/80 mb-2">
        Admin — Manage Channels
      </div>
      {msg && (
        <div className="rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-xs text-white/60">
          {msg}
        </div>
      )}
      {channels.map((ch) => (
        <div
          key={ch.id}
          className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5"
        >
          <div className="flex items-center gap-2">
            <span>{ch.emoji}</span>
            <span className="text-sm font-bold text-white/80">{ch.name}</span>
            {ch.isDefault && (
              <span className="text-[10px] text-white/30 bg-white/5 rounded px-1.5 py-0.5">default</span>
            )}
          </div>
          {!ch.isDefault && (
            <button
              onClick={() => deleteChannel(ch.id)}
              disabled={!!deleting}
              className="rounded-lg bg-red-500/10 px-2.5 py-1 text-xs font-bold text-red-300 hover:bg-red-500/20 disabled:opacity-50 transition"
            >
              {deleting === ch.id ? "Deleting…" : "Delete"}
            </button>
          )}
        </div>
      ))}
    </div>
  );
}

// ─── Main Export ──────────────────────────────────────────────────────────────

export default function DiscordChatClient({
  myUri,
  myDisplayName,
  myProfileImage,
  isAdmin,
}) {
  const [channels, setChannels] = useState([]);
  const [activeChannel, setActiveChannel] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [oldestCursor, setOldestCursor] = useState(null);
  const [replyingTo, setReplyingTo] = useState(null);
  const [showAdmin, setShowAdmin] = useState(false);
  const [error, setError] = useState("");

  const bottomRef = useRef(null);
  const pollRef = useRef(null);
  const lastMessageIdRef = useRef(null);
  const isAtBottomRef = useRef(true);

  // ── Load channels on mount ──────────────────────────────────────────────────
  useEffect(() => {
    async function loadChannels() {
      try {
        const res = await fetch("/api/discord-chat/channels");
        const data = await res.json();
        if (data.ok) {
          setChannels(data.channels);
          const def = data.channels.find((c) => c.isDefault) || data.channels[0];
          if (def) setActiveChannel(def);
        }
      } catch {
        setError("Failed to load channels");
      }
    }
    loadChannels();
  }, []);

  // ── Load messages when channel changes ──────────────────────────────────────
  const loadMessages = useCallback(async (channel) => {
    if (!channel) return;
    setLoadingMessages(true);
    setMessages([]);
    setHasMore(false);
    setOldestCursor(null);
    setReplyingTo(null);
    clearInterval(pollRef.current);

    try {
      const res = await fetch(
        `/api/discord-chat/messages?channel=${channel.slug}&limit=50`
      );
      const data = await res.json();
      if (data.ok) {
        setMessages(data.messages);
        setHasMore(!!data.nextCursor);
        setOldestCursor(data.nextCursor);
        if (data.messages.length > 0) {
          lastMessageIdRef.current = data.messages[data.messages.length - 1].id;
        }
      }
    } catch {
      setError("Failed to load messages");
    } finally {
      setLoadingMessages(false);
    }
  }, []);

  useEffect(() => {
    if (activeChannel) loadMessages(activeChannel);
  }, [activeChannel, loadMessages]);

  // ── Scroll to bottom on new messages ───────────────────────────────────────
  useEffect(() => {
    if (isAtBottomRef.current) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  // ── Poll for new messages ───────────────────────────────────────────────────
  useEffect(() => {
    if (!activeChannel) return;

    clearInterval(pollRef.current);
    pollRef.current = setInterval(async () => {
      try {
        const res = await fetch(
          `/api/discord-chat/messages?channel=${activeChannel.slug}&limit=20`
        );
        const data = await res.json();
        if (!data.ok) return;

        const latest = data.messages;
        if (!latest.length) return;

        const newestId = latest[latest.length - 1].id;
        if (newestId === lastMessageIdRef.current) return;

        // Merge new messages (avoid duplicates)
        setMessages((prev) => {
          const existingIds = new Set(prev.map((m) => m.id));
          const newMsgs = latest.filter((m) => !existingIds.has(m.id));
          if (!newMsgs.length) return prev;
          lastMessageIdRef.current = newestId;
          isAtBottomRef.current = true;
          return [...prev, ...newMsgs];
        });
      } catch {}
    }, POLL_INTERVAL_MS);

    return () => clearInterval(pollRef.current);
  }, [activeChannel]);

  // ── Load older messages ─────────────────────────────────────────────────────
  async function loadMore() {
    if (!activeChannel || !oldestCursor || loadingMore) return;
    setLoadingMore(true);
    try {
      const res = await fetch(
        `/api/discord-chat/messages?channel=${activeChannel.slug}&cursor=${oldestCursor}&limit=50`
      );
      const data = await res.json();
      if (data.ok) {
        setMessages((prev) => [...data.messages, ...prev]);
        setHasMore(!!data.nextCursor);
        setOldestCursor(data.nextCursor);
        isAtBottomRef.current = false;
      }
    } catch {}
    setLoadingMore(false);
  }

  // ── Send a message ──────────────────────────────────────────────────────────
  async function sendMessage(text) {
    if (!activeChannel) return;
    const res = await fetch("/api/discord-chat/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        channelSlug: activeChannel.slug,
        body: text,
        replyTo: replyingTo?.id || null,
      }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to send");

    setMessages((prev) => {
      const existingIds = new Set(prev.map((m) => m.id));
      if (existingIds.has(data.message.id)) return prev;
      lastMessageIdRef.current = data.message.id;
      return [...prev, data.message];
    });
    setReplyingTo(null);
    isAtBottomRef.current = true;
  }

  // ── Toggle reaction ─────────────────────────────────────────────────────────
  async function handleReact(messageId, emoji) {
    try {
      const res = await fetch("/api/discord-chat/reactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messageId, emoji }),
      });
      const data = await res.json();
      if (data.ok) {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === messageId ? { ...m, reactions: data.reactions } : m
          )
        );
      }
    } catch {}
  }

  // ── Delete message ──────────────────────────────────────────────────────────
  async function handleDelete(messageId) {
    try {
      const res = await fetch("/api/discord-chat/messages", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "delete", id: messageId }),
      });
      if (res.ok) {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === messageId ? { ...m, deleted: true, body: "" } : m
          )
        );
      }
    } catch {}
  }

  // ── Edit message ────────────────────────────────────────────────────────────
  function handleEdit(updated) {
    setMessages((prev) =>
      prev.map((m) => (m.id === updated.id ? { ...m, ...updated } : m))
    );
  }

  // ── Channel management ──────────────────────────────────────────────────────
  function handleChannelCreated(channel) {
    setChannels((prev) => [...prev, channel]);
  }

  function handleChannelDeleted(id) {
    setChannels((prev) => {
      const remaining = prev.filter((c) => c.id !== id);
      if (activeChannel?.id === id) {
        const def = remaining.find((c) => c.isDefault) || remaining[0];
        setActiveChannel(def || null);
      }
      return remaining;
    });
  }

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="flex h-[calc(100vh-200px)] min-h-[500px] max-h-[800px] rounded-3xl border border-white/10 overflow-hidden bg-[#0d1117]">

      {/* Sidebar — channel list */}
      <div className="w-52 shrink-0 bg-[#0b0f1a] border-r border-white/8 flex flex-col">
        <ChannelList
          channels={channels}
          activeSlug={activeChannel?.slug}
          onSelect={(ch) => {
            setActiveChannel(ch);
            setShowAdmin(false);
          }}
          isAdmin={isAdmin}
          onCreateChannel={handleChannelCreated}
        />
        {isAdmin && (
          <button
            onClick={() => setShowAdmin((v) => !v)}
            className={`mx-2 mb-2 px-3 py-2 rounded-xl text-xs font-bold transition ${
              showAdmin
                ? "bg-red-500/15 text-red-300"
                : "text-white/25 hover:text-white/60 hover:bg-white/5"
            }`}
          >
            {showAdmin ? "← Back to chat" : "⚙ Admin"}
          </button>
        )}
      </div>

      {/* Main content area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Channel header */}
        <div className="px-5 py-3 border-b border-white/8 shrink-0 flex items-center gap-3">
          {activeChannel && (
            <>
              <span className="text-xl leading-none">{activeChannel.emoji}</span>
              <div>
                <div className="font-black text-white text-sm">{activeChannel.name}</div>
                {activeChannel.description && (
                  <div className="text-xs text-white/35 truncate max-w-md">
                    {activeChannel.description}
                  </div>
                )}
              </div>
              <div className="ml-auto flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_4px_rgba(34,197,94,0.6)]" />
                <span className="text-xs text-white/30">Live</span>
              </div>
            </>
          )}
          {!activeChannel && (
            <div className="text-sm text-white/30">Select a channel</div>
          )}
        </div>

        {/* Admin panel */}
        {showAdmin && isAdmin ? (
          <div className="flex-1 overflow-y-auto">
            <AdminPanel
              channels={channels}
              onDeleteChannel={handleChannelDeleted}
            />
          </div>
        ) : (
          <>
            {/* Error */}
            {error && (
              <div className="mx-4 mt-3 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-2 text-sm text-red-300">
                {error}
              </div>
            )}

            {/* Messages */}
            {loadingMessages ? (
              <div className="flex-1 flex flex-col justify-end pb-4">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="flex gap-3 px-4 py-2 animate-pulse">
                    <div className="w-9 h-9 rounded-full bg-white/8 shrink-0 mt-0.5" />
                    <div className="flex-1 space-y-2 pt-1">
                      <div className="h-2.5 bg-white/8 rounded-full w-1/5" />
                      <div className="h-3 bg-white/6 rounded-full w-2/3" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <MessageList
                messages={messages}
                myUri={myUri}
                isAdmin={isAdmin}
                onReact={handleReact}
                onReply={setReplyingTo}
                onDelete={handleDelete}
                onEdit={handleEdit}
                hasMore={hasMore}
                onLoadMore={loadMore}
                loadingMore={loadingMore}
                bottomRef={bottomRef}
              />
            )}

            {/* Compose */}
            {activeChannel && (
              <ComposeBox
                myUri={myUri}
                myDisplayName={myDisplayName}
                myProfileImage={myProfileImage}
                channelName={activeChannel.name}
                replyingTo={replyingTo}
                onCancelReply={() => setReplyingTo(null)}
                onSend={sendMessage}
                disabled={!myUri}
              />
            )}

            {!myUri && (
              <div className="px-4 pb-3 text-center">
                <a href="/account" className="text-sm text-blue-400 hover:text-blue-300 underline font-bold">
                  Set a username to start chatting →
                </a>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
