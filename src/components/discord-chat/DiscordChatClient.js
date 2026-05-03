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
  return new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }).format(new Date(date));
}

function formatTimestamp(date) {
  return new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit" }).format(new Date(date));
}

// ─── Avatar ───────────────────────────────────────────────────────────────────

function Avatar({ src, name, size = 36 }) {
  const initial = (name || "?").slice(0, 1).toUpperCase();
  return (
    <div
      className="shrink-0 rounded-full overflow-hidden bg-[#1e2d4a] border border-white/10 flex items-center justify-center font-black text-white/60 select-none"
      style={{ width: size, height: size, fontSize: Math.round(size * 0.38) }}
    >
      {src ? <img src={src} alt={name} className="w-full h-full object-cover" /> : initial}
    </div>
  );
}

// ─── Server Icon ─────────────────────────────────────────────────────────────

function ServerIcon({ server, active, onClick }) {
  const isGlobal = server.isGlobal;
  return (
    <button
      onClick={onClick}
      title={server.name}
      className={`group relative flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl font-black text-lg transition-all duration-200 ${
        active
          ? "rounded-xl bg-blue-500 text-white shadow-lg shadow-blue-500/30"
          : "bg-white/[0.06] text-white/60 hover:rounded-xl hover:bg-white/10 hover:text-white"
      }`}
    >
      {server.icon ? (
        <span className="text-xl leading-none">{server.icon}</span>
      ) : isGlobal ? (
        <span className="text-base font-black">🏠</span>
      ) : (
        <span className="text-sm font-black">{server.name.slice(0, 2).toUpperCase()}</span>
      )}
      <span className={`absolute -left-1 top-1/2 -translate-y-1/2 w-1 rounded-r-full bg-white transition-all ${active ? "h-8" : "h-0 group-hover:h-5"}`} />
      <span className="pointer-events-none absolute left-14 z-50 whitespace-nowrap rounded-lg bg-black/90 px-3 py-1.5 text-xs font-bold text-white opacity-0 shadow-xl transition group-hover:opacity-100">
        {server.name}
        {isGlobal && <span className="ml-1.5 rounded-full bg-blue-500/30 px-1.5 py-0.5 text-[9px] text-blue-200">Global</span>}
      </span>
    </button>
  );
}

// ─── Create Server Modal ──────────────────────────────────────────────────────

function CreateServerModal({ onClose, onCreate }) {
  const [name, setName] = useState("");
  const [icon, setIcon] = useState("🌐");
  const [description, setDescription] = useState("");
  const [isPublic, setIsPublic] = useState(true);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  async function submit(e) {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    setErr("");
    try {
      const res = await fetch("/api/discord-chat/servers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "create", name: name.trim(), icon, description, isPublic }),
      });
      const data = await res.json();
      if (!res.ok) { setErr(data.error || "Failed"); return; }
      onCreate?.(data.server);
      onClose();
    } catch { setErr("Network error"); }
    finally { setSaving(false); }
  }

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div className="relative z-10 w-full max-w-md rounded-3xl border border-white/10 bg-[#0d1117] p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-xl font-black text-white mb-1">Create a Server</h2>
        <p className="text-sm text-white/45 mb-5">Your server, your rules.</p>
        <form onSubmit={submit} className="space-y-4">
          <div className="flex gap-3">
            <div className="space-y-1">
              <label className="text-xs font-bold text-white/50">Icon</label>
              <input value={icon} onChange={(e) => setIcon(e.target.value.slice(0, 4) || "🌐")} className="w-14 h-14 bg-black/30 border border-white/10 rounded-2xl text-2xl text-center outline-none focus:border-blue-500/50" />
            </div>
            <div className="flex-1 space-y-1">
              <label className="text-xs font-bold text-white/50">Server name <span className="text-red-400">*</span></label>
              <input autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder="My Awesome Server" className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/25 outline-none focus:border-blue-500/50" />
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold text-white/50">Description</label>
            <input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What's this server about?" className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/25 outline-none focus:border-blue-500/50" />
          </div>
          <label className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 cursor-pointer">
            <div className={`h-5 w-9 rounded-full transition-colors ${isPublic ? "bg-blue-500" : "bg-white/20"}`} onClick={() => setIsPublic((v) => !v)}>
              <div className={`h-4 w-4 rounded-full bg-white shadow transition-transform mt-0.5 ${isPublic ? "translate-x-4 ml-0.5" : "translate-x-0.5"}`} />
            </div>
            <div>
              <div className="text-sm font-bold text-white">{isPublic ? "Public" : "Private (Invite only)"}</div>
              <div className="text-xs text-white/35">{isPublic ? "Anyone can find and join" : "Only invited users can join"}</div>
            </div>
          </label>
          {err && <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-2 text-sm text-red-300">{err}</div>}
          <div className="flex gap-2 pt-1">
            <button type="button" onClick={onClose} className="flex-1 rounded-xl border border-white/10 bg-white/5 py-2.5 text-sm font-bold text-white/70 hover:bg-white/10 transition">Cancel</button>
            <button type="submit" disabled={saving || !name.trim()} className="flex-1 rounded-xl bg-blue-600 py-2.5 text-sm font-black text-white hover:bg-blue-500 disabled:opacity-50 transition">{saving ? "Creating…" : "Create Server"}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Invite User Modal ────────────────────────────────────────────────────────

function InviteModal({ server, onClose }) {
  const [uri, setUri] = useState("");
  const [msg, setMsg] = useState("");
  const [sending, setSending] = useState(false);

  async function invite() {
    if (!uri.trim()) return;
    setSending(true);
    setMsg("");
    try {
      const res = await fetch("/api/discord-chat/servers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "invite", serverSlug: server.slug, targetUri: uri.trim() }),
      });
      const data = await res.json();
      if (!res.ok) { setMsg(data.error || "Failed"); return; }
      setMsg(`Invite sent to @${uri.trim()}`);
      setUri("");
    } catch { setMsg("Network error"); }
    finally { setSending(false); }
  }

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div className="relative z-10 w-full max-w-sm rounded-3xl border border-white/10 bg-[#0d1117] p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-xl font-black text-white mb-1">Invite to {server.name}</h2>
        <p className="text-sm text-white/45 mb-5">Enter a BioLinkHQ username.</p>
        <div className="flex gap-2">
          <input autoFocus value={uri} onChange={(e) => setUri(e.target.value.replace(/^@/, "").toLowerCase())} placeholder="@username" onKeyDown={(e) => { if (e.key === "Enter") invite(); }} className="flex-1 bg-black/30 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder:text-white/25 outline-none focus:border-blue-500/50" />
          <button onClick={invite} disabled={sending || !uri.trim()} className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-black text-white hover:bg-blue-500 disabled:opacity-50 transition">{sending ? "…" : "Invite"}</button>
        </div>
        {msg && <div className={`mt-3 rounded-xl px-3 py-2 text-xs font-bold ${msg.startsWith("Invite sent") ? "bg-emerald-500/10 text-emerald-300" : "bg-red-500/10 text-red-300"}`}>{msg}</div>}
        <button onClick={onClose} className="mt-4 w-full text-xs text-white/30 hover:text-white/60 transition">Close</button>
      </div>
    </div>
  );
}

// ─── Server Invites Banner ────────────────────────────────────────────────────

function ServerInvitesBanner({ invites, onRespond }) {
  if (!invites?.length) return null;
  return (
    <div className="mx-3 mt-3 space-y-2">
      {invites.map((inv) => (
        <div key={inv.inviteId} className="flex items-center gap-3 rounded-2xl border border-blue-500/20 bg-blue-500/8 px-4 py-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-500/20 text-lg">{inv.serverIcon || "🌐"}</div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-black text-white truncate">{inv.serverName}</div>
            <div className="text-xs text-white/40">Invited by @{inv.invitedBy}</div>
          </div>
          <div className="flex gap-1.5 shrink-0">
            <button onClick={() => onRespond(inv, true)} className="rounded-xl bg-blue-600 px-3 py-1.5 text-xs font-black text-white hover:bg-blue-500 transition">Join</button>
            <button onClick={() => onRespond(inv, false)} className="rounded-xl bg-white/5 border border-white/10 px-3 py-1.5 text-xs font-bold text-white/60 hover:bg-white/10 transition">Decline</button>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Channel List ─────────────────────────────────────────────────────────────

function ChannelList({ server, channels, activeSlug, onSelect, canManage, onCreateChannel, onInvite, onLeave, onDelete }) {
  const [newName, setNewName] = useState("");
  const [newEmoji, setNewEmoji] = useState("💬");
  const [creating, setCreating] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [err, setErr] = useState("");
  const [showOptions, setShowOptions] = useState(false);

  async function createChannel(e) {
    e.preventDefault();
    if (!newName.trim()) return;
    setCreating(true);
    setErr("");
    try {
      const res = await fetch("/api/discord-chat/channels", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ serverSlug: server.slug, name: newName.trim(), emoji: newEmoji }),
      });
      const data = await res.json();
      if (!res.ok) { setErr(data.error || "Failed"); return; }
      setNewName(""); setNewEmoji("💬"); setShowForm(false);
      onCreateChannel?.(data.channel);
    } catch { setErr("Network error"); }
    finally { setCreating(false); }
  }

  return (
    <div className="flex flex-col h-full">
      <div className="px-3 py-3 border-b border-white/8 shrink-0">
        <div className="flex items-center justify-between">
          <div className="min-w-0">
            <div className="font-black text-white text-sm truncate">{server.name}</div>
            <div className="text-[10px] text-white/30 mt-0.5">
              {server.memberCount} member{server.memberCount !== 1 ? "s" : ""}
              {server.isGlobal && <span className="ml-1.5 text-blue-400">· Global</span>}
            </div>
          </div>
          <button onClick={() => setShowOptions((v) => !v)} className="p-1 rounded-lg text-white/30 hover:text-white/70 hover:bg-white/5 transition">
            <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="5" r="1" fill="currentColor" /><circle cx="12" cy="12" r="1" fill="currentColor" /><circle cx="12" cy="19" r="1" fill="currentColor" />
            </svg>
          </button>
        </div>
        {showOptions && (
          <div className="mt-2 rounded-xl border border-white/10 bg-black/40 overflow-hidden">
            {canManage && (
              <button onClick={() => { onInvite?.(); setShowOptions(false); }} className="w-full flex items-center gap-2 px-3 py-2.5 text-xs font-bold text-white/70 hover:bg-white/5 hover:text-white transition">
                <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M20 8v6M23 11h-6" strokeLinecap="round" strokeLinejoin="round" /></svg>
                Invite People
              </button>
            )}
            {!server.isGlobal && server.myRole !== "owner" && (
              <button onClick={() => { onLeave?.(); setShowOptions(false); }} className="w-full flex items-center gap-2 px-3 py-2.5 text-xs font-bold text-red-400/80 hover:bg-red-500/10 hover:text-red-300 transition">Leave Server</button>
            )}
            {!server.isGlobal && server.myRole === "owner" && (
              <button onClick={() => { onDelete?.(); setShowOptions(false); }} className="w-full flex items-center gap-2 px-3 py-2.5 text-xs font-bold text-red-400/80 hover:bg-red-500/10 hover:text-red-300 transition">Delete Server</button>
            )}
          </div>
        )}
      </div>
      <div className="flex-1 overflow-y-auto px-2 py-3 space-y-0.5">
        <div className="flex items-center justify-between px-2 mb-2">
          <span className="text-[10px] font-black uppercase tracking-[0.18em] text-white/25">Text Channels</span>
          {canManage && (
            <button onClick={() => setShowForm((v) => !v)} className="text-white/25 hover:text-white/60 transition" title="Add channel">
              <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 5v14M5 12h14" strokeLinecap="round" /></svg>
            </button>
          )}
        </div>
        {canManage && showForm && (
          <form onSubmit={createChannel} className="mx-1 mb-3 rounded-xl bg-white/[0.04] border border-white/10 p-3 space-y-2">
            <div className="flex gap-2">
              <input value={newEmoji} onChange={(e) => setNewEmoji(e.target.value.slice(0, 4) || "💬")} className="w-10 bg-black/30 border border-white/10 rounded-lg px-2 py-1.5 text-sm text-center outline-none" placeholder="💬" />
              <input autoFocus value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="channel-name" className="flex-1 bg-black/30 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white placeholder:text-white/30 outline-none focus:border-blue-500/50" />
            </div>
            {err && <div className="text-xs text-red-400">{err}</div>}
            <div className="flex gap-2">
              <button type="submit" disabled={creating || !newName.trim()} className="flex-1 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-black text-white hover:bg-blue-500 disabled:opacity-50 transition">{creating ? "Creating…" : "Create"}</button>
              <button type="button" onClick={() => { setShowForm(false); setErr(""); }} className="px-3 py-1.5 text-xs text-white/40 hover:text-white/70 transition">Cancel</button>
            </div>
          </form>
        )}
        {channels.map((ch) => (
          <button key={ch.id} onClick={() => onSelect(ch)} className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-left transition group ${activeSlug === ch.slug ? "bg-white/10 text-white" : "text-white/45 hover:bg-white/[0.05] hover:text-white/80"}`}>
            <span className="text-base leading-none shrink-0">{ch.emoji || "💬"}</span>
            <span className="text-sm font-semibold truncate">{ch.name}</span>
            {ch.isDefault && <span className="ml-auto text-[9px] font-black text-white/20 uppercase tracking-wider shrink-0">default</span>}
          </button>
        ))}
        {channels.length === 0 && <div className="px-2 py-4 text-xs text-white/25 text-center">No channels yet</div>}
      </div>
      <div className="px-3 py-3 border-t border-white/8 shrink-0 bg-black/20">
        <div className="text-[10px] text-white/20 text-center tracking-wider">🔒 Messages stored securely</div>
      </div>
    </div>
  );
}

// ─── Reaction Bar ─────────────────────────────────────────────────────────────

function ReactionBar({ reactions, onReact }) {
  if (!reactions?.length) return null;
  return (
    <div className="flex flex-wrap gap-1 mt-1.5">
      {reactions.map((r) => (
        <button key={r.emoji} onClick={() => onReact(r.emoji)} className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-xs border transition ${r.reactedByMe ? "bg-blue-500/20 border-blue-500/40 text-blue-200" : "bg-white/[0.04] border-white/10 text-white/60 hover:bg-white/10"}`}>
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
    function handleClick(e) { if (ref.current && !ref.current.contains(e.target)) onClose(); }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [onClose]);
  return (
    <div ref={ref} className="absolute z-50 bottom-full mb-2 left-0 bg-[#1a2540] border border-white/10 rounded-2xl p-3 shadow-2xl">
      <div className="grid grid-cols-5 gap-1.5">
        {ALLOWED_EMOJIS.map((emoji) => (
          <button key={emoji} onClick={() => { onSelect(emoji); onClose(); }} className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-white/10 transition text-lg">{emoji}</button>
        ))}
      </div>
    </div>
  );
}

// ─── Message Item ─────────────────────────────────────────────────────────────

function MessageItem({ message, prevMessage, myUri, canDeleteAny, onReact, onReply, onDelete, onEdit }) {
  const [hovering, setHovering] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState(message.body);
  const [saving, setSaving] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const isGrouped = prevMessage &&
    prevMessage.authorUri === message.authorUri &&
    !prevMessage.deleted &&
    new Date(message.createdAt) - new Date(prevMessage.createdAt) < 5 * 60 * 1000;

  const canDelete = message.isMine || canDeleteAny;
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
      if (data.ok) { onEdit?.(data.message); setEditing(false); }
    } catch {}
    setSaving(false);
  }

  if (message.deleted) {
    return <div className={`px-4 py-0.5 ${!isGrouped ? "mt-3" : ""}`}><span className="text-sm italic text-white/20">Message deleted</span></div>;
  }

  return (
    <div
      className={`relative px-4 py-0.5 group hover:bg-white/[0.02] transition-colors ${!isGrouped ? "mt-4" : ""}`}
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => { setHovering(false); setShowEmojiPicker(false); }}
    >
      {hovering && !editing && (
        <div className="absolute right-4 top-0 -translate-y-1/2 z-20 flex items-center gap-1 bg-[#1a2540] border border-white/10 rounded-xl px-2 py-1 shadow-lg">
          <div className="relative">
            <button onClick={() => setShowEmojiPicker((v) => !v)} className="p-1 rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition text-base leading-none" title="React">😊</button>
            {showEmojiPicker && <EmojiPicker onSelect={(emoji) => onReact(message.id, emoji)} onClose={() => setShowEmojiPicker(false)} />}
          </div>
          <button onClick={() => onReply(message)} className="p-1 rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition" title="Reply">
            <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </button>
          {canEdit && (
            <button onClick={() => { setEditing(true); setEditText(message.body); }} className="p-1 rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition" title="Edit">
              <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </button>
          )}
          {canDelete && (
            showDeleteConfirm ? (
              <>
                <button onClick={() => onDelete(message.id)} className="px-2 py-1 rounded-lg bg-red-500/15 text-xs font-bold text-red-300 hover:bg-red-500/25 transition">Delete</button>
                <button onClick={() => setShowDeleteConfirm(false)} className="px-2 py-1 rounded-lg text-xs text-white/40 hover:text-white/70 transition">Cancel</button>
              </>
            ) : (
              <button onClick={() => setShowDeleteConfirm(true)} className="p-1 rounded-lg text-white/40 hover:text-red-400 hover:bg-red-500/10 transition" title="Delete">
                <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" strokeLinecap="round" strokeLinejoin="round" /></svg>
              </button>
            )
          )}
        </div>
      )}
      <div className="flex gap-3">
        <div className="w-9 shrink-0">
          {!isGrouped ? <Avatar src={message.authorProfileImage} name={message.authorDisplayName} size={36} /> : <div className="w-9 h-full" />}
        </div>
        <div className="flex-1 min-w-0">
          {!isGrouped && (
            <div className="flex items-baseline gap-2 mb-0.5">
              <a href={`/${message.authorUri}`} target="_blank" rel="noreferrer" className="font-black text-white text-sm hover:underline">{message.authorDisplayName}</a>
              <span className="text-[11px] text-white/30">{formatTimestamp(message.createdAt)}</span>
              {message.isMine && <span className="text-[10px] text-blue-400/60 font-bold uppercase tracking-wide">You</span>}
            </div>
          )}
          {message.replyTo && message.replyToSnippet && (
            <div className="flex items-center gap-2 mb-1 pl-2 border-l-2 border-white/20">
              <span className="text-[11px] text-white/40 truncate max-w-xs">
                <span className="font-bold text-white/55">@{message.replyToAuthorUri} </span>
                {message.replyToSnippet}
              </span>
            </div>
          )}
          {editing ? (
            <div className="mt-1">
              <textarea autoFocus value={editText} onChange={(e) => setEditText(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); saveEdit(); } if (e.key === "Escape") { setEditing(false); setEditText(message.body); } }} rows={2} maxLength={MAX_MSG} className="w-full bg-[#1a2540] border border-blue-500/40 rounded-xl px-3 py-2 text-sm text-white outline-none resize-none" />
              <div className="flex gap-2 mt-1.5">
                <button onClick={saveEdit} disabled={saving || !editText.trim()} className="px-3 py-1 rounded-lg bg-blue-600 text-xs font-bold text-white hover:bg-blue-500 disabled:opacity-50 transition">{saving ? "Saving…" : "Save"}</button>
                <button onClick={() => { setEditing(false); setEditText(message.body); }} className="px-3 py-1 rounded-lg text-xs text-white/40 hover:text-white/70 transition">Cancel</button>
              </div>
            </div>
          ) : (
            <p className="text-[14.5px] text-white/90 leading-relaxed whitespace-pre-wrap break-words">
              {message.body}
              {message.editedAt && <span className="ml-1.5 text-[10px] text-white/25 italic">(edited)</span>}
            </p>
          )}
          <ReactionBar reactions={message.reactions} onReact={(emoji) => onReact(message.id, emoji)} />
        </div>
      </div>
    </div>
  );
}

// ─── Compose Box ─────────────────────────────────────────────────────────────

function ComposeBox({ myUri, myDisplayName, myProfileImage, channelName, replyingTo, onCancelReply, onSend, disabled }) {
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

  return (
    <div className="px-4 pb-4 pt-2 shrink-0">
      {replyingTo && (
        <div className="flex items-center gap-2 mb-2 px-3 py-1.5 rounded-xl bg-white/[0.04] border border-white/10">
          <div className="w-0.5 h-5 bg-blue-500 rounded-full shrink-0" />
          <span className="text-xs text-white/50 truncate flex-1">
            Replying to <span className="text-white/80 font-bold">@{replyingTo.authorUri}</span>
            {" — "}{replyingTo.body.slice(0, 60)}{replyingTo.body.length > 60 ? "…" : ""}
          </span>
          <button onClick={onCancelReply} className="text-white/30 hover:text-white/70 transition shrink-0">
            <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M6 18L18 6M6 6l12 12" strokeLinecap="round" /></svg>
          </button>
        </div>
      )}
      <div className="flex gap-2 items-end bg-[#1a2540] rounded-2xl border border-white/10 px-3 py-2.5">
        <Avatar src={myProfileImage} name={myDisplayName} size={28} />
        <textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => { setText(e.target.value); autoResize(); }}
          onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); submit(); } }}
          placeholder={disabled ? "Set a username to chat" : `Message #${channelName}`}
          disabled={disabled}
          maxLength={MAX_MSG + 50}
          rows={1}
          className="flex-1 bg-transparent text-white placeholder:text-white/25 text-sm resize-none outline-none leading-relaxed min-h-[22px] max-h-[200px] disabled:cursor-not-allowed"
          style={{ overflow: "hidden" }}
        />
        {text.length > MAX_MSG * 0.8 && (
          <span className={`text-[11px] font-mono shrink-0 ${remaining <= 0 ? "text-red-400" : "text-white/30"}`}>{remaining}</span>
        )}
        <button onClick={submit} disabled={!text.trim() || remaining < 0 || sending || disabled} className="shrink-0 p-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white transition disabled:opacity-40 disabled:cursor-not-allowed">
          <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.2"><line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" /></svg>
        </button>
      </div>
      <div className="text-center mt-1.5 text-white/15 text-[10px]">↵ send · Shift+↵ new line</div>
    </div>
  );
}

// ─── Message List ─────────────────────────────────────────────────────────────

function MessageList({ messages, myUri, canDeleteAny, onReact, onReply, onDelete, onEdit, hasMore, onLoadMore, loadingMore, scrollRef, bottomRef }) {
  return (
    <div ref={scrollRef} className="flex-1 overflow-y-auto min-h-0">
      {/* Load older button at top */}
      {hasMore && (
        <div className="flex justify-center py-4">
          <button onClick={onLoadMore} disabled={loadingMore} className="px-4 py-1.5 rounded-full border border-white/15 text-xs font-bold text-white/50 hover:border-white/30 hover:text-white/80 transition disabled:opacity-40">
            {loadingMore ? "Loading…" : "Load older messages"}
          </button>
        </div>
      )}

      {/* Empty state */}
      {messages.length === 0 && (
        <div className="flex flex-col items-center justify-center h-full min-h-[200px] text-center px-8 pb-8">
          <div className="text-4xl mb-3">💬</div>
          <h3 className="text-lg font-black text-white">Be the first to say something!</h3>
          <p className="mt-2 text-sm text-white/40">Start the conversation in this channel.</p>
        </div>
      )}

      {/* Messages */}
      <div className="pb-2">
        {messages.map((msg, idx) => (
          <MessageItem
            key={msg.id}
            message={msg}
            prevMessage={idx > 0 ? messages[idx - 1] : null}
            myUri={myUri}
            canDeleteAny={canDeleteAny}
            onReact={onReact}
            onReply={onReply}
            onDelete={onDelete}
            onEdit={onEdit}
          />
        ))}
      </div>

      {/* Scroll anchor */}
      <div ref={bottomRef} className="h-px" />
    </div>
  );
}

// ─── Main Export ──────────────────────────────────────────────────────────────

export default function DiscordChatClient({ myUri, myDisplayName, myProfileImage, isAdmin }) {
  const [servers, setServers] = useState([]);
  const [serverInvites, setServerInvites] = useState([]);
  const [activeServer, setActiveServer] = useState(null);
  const [channels, setChannels] = useState([]);
  const [activeChannel, setActiveChannel] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [oldestCursor, setOldestCursor] = useState(null);
  const [replyingTo, setReplyingTo] = useState(null);
  const [showCreateServer, setShowCreateServer] = useState(false);
  const [showInvite, setShowInvite] = useState(false);
  const [error, setError] = useState("");

  // ── Scroll management ───────────────────────────────────────────────────────
  // scrollRef attaches to the scrollable container div
  const scrollRef = useRef(null);
  // bottomRef is the anchor at the very bottom of messages
  const bottomRef = useRef(null);
  // Track whether user is near the bottom
  const isNearBottomRef = useRef(true);
  // Track the last message id to detect new messages from polling
  const lastMsgIdRef = useRef(null);
  // Polling interval ref
  const pollRef = useRef(null);

  // ── Helper: is user near bottom? ───────────────────────────────────────────
  function checkNearBottom() {
    const el = scrollRef.current;
    if (!el) return true;
    return el.scrollHeight - el.scrollTop - el.clientHeight < 120;
  }

  // ── Helper: scroll to bottom ───────────────────────────────────────────────
  function scrollToBottom(behavior = "smooth") {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior });
  }

  // ── Track scroll position ──────────────────────────────────────────────────
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const onScroll = () => { isNearBottomRef.current = checkNearBottom(); };
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  });

  // ── Load servers on mount ───────────────────────────────────────────────────
  useEffect(() => {
    async function loadServers() {
      try {
        const res = await fetch("/api/discord-chat/servers");
        const data = await res.json();
        if (data.ok) {
          setServers(data.servers);
          setServerInvites(data.invites || []);
          const global = data.servers.find((s) => s.isGlobal) || data.servers[0];
          if (global) setActiveServer(global);
        }
      } catch {
        setError("Failed to load servers");
      }
    }
    loadServers();
  }, []);

  // ── Load channels when server changes ──────────────────────────────────────
  useEffect(() => {
    if (!activeServer) return;
    async function loadChannels() {
      try {
        const res = await fetch(`/api/discord-chat/channels?serverSlug=${activeServer.slug}`);
        const data = await res.json();
        if (data.ok) {
          setChannels(data.channels);
          const def = data.channels.find((c) => c.isDefault) || data.channels[0];
          setActiveChannel(def || null);
        }
      } catch {
        setError("Failed to load channels");
      }
    }
    loadChannels();
  }, [activeServer]);

  // ── Load messages when channel changes ─────────────────────────────────────
  const loadMessages = useCallback(async (channel, serverSlug) => {
    if (!channel || !serverSlug) return;
    clearInterval(pollRef.current);
    setLoadingMessages(true);
    setMessages([]);
    setHasMore(false);
    setOldestCursor(null);
    setReplyingTo(null);
    lastMsgIdRef.current = null;
    // On initial channel load, we want to scroll to bottom
    isNearBottomRef.current = true;

    try {
      const res = await fetch(
        `/api/discord-chat/messages?serverSlug=${serverSlug}&channel=${channel.slug}&limit=50`
      );
      const data = await res.json();
      if (data.ok) {
        setMessages(data.messages);
        setHasMore(!!data.nextCursor);
        setOldestCursor(data.nextCursor);
        if (data.messages.length > 0) {
          lastMsgIdRef.current = data.messages[data.messages.length - 1].id;
        }
        // Scroll to bottom after render
        setTimeout(() => scrollToBottom("instant"), 50);
      }
    } catch {
      setError("Failed to load messages");
    } finally {
      setLoadingMessages(false);
    }
  }, []);

  useEffect(() => {
    if (activeChannel && activeServer) {
      loadMessages(activeChannel, activeServer.slug);
    }
  }, [activeChannel, activeServer, loadMessages]);

  // ── Polling for new messages ───────────────────────────────────────────────
  useEffect(() => {
    if (!activeChannel || !activeServer) return;
    clearInterval(pollRef.current);

    pollRef.current = setInterval(async () => {
      try {
        const res = await fetch(
          `/api/discord-chat/messages?serverSlug=${activeServer.slug}&channel=${activeChannel.slug}&limit=20`
        );
        const data = await res.json();
        if (!data.ok || !data.messages.length) return;

        const latest = data.messages;
        const newestId = latest[latest.length - 1].id;

        // No new messages
        if (newestId === lastMsgIdRef.current) return;

        // Snapshot scroll position BEFORE updating state
        const wasNearBottom = checkNearBottom();

        setMessages((prev) => {
          const existingIds = new Set(prev.map((m) => m.id));
          const newMsgs = latest.filter((m) => !existingIds.has(m.id));
          if (!newMsgs.length) return prev;
          lastMsgIdRef.current = newestId;
          return [...prev, ...newMsgs];
        });

        // Only scroll to bottom if user was already there
        if (wasNearBottom) {
          isNearBottomRef.current = true;
          setTimeout(() => scrollToBottom("smooth"), 60);
        }
      } catch {}
    }, POLL_INTERVAL_MS);

    return () => clearInterval(pollRef.current);
  }, [activeChannel, activeServer]);

  // ── Load older messages ─────────────────────────────────────────────────────
  async function loadMore() {
    if (!activeChannel || !activeServer || !oldestCursor || loadingMore) return;
    const el = scrollRef.current;
    const prevScrollHeight = el?.scrollHeight ?? 0;
    setLoadingMore(true);
    try {
      const res = await fetch(
        `/api/discord-chat/messages?serverSlug=${activeServer.slug}&channel=${activeChannel.slug}&cursor=${oldestCursor}&limit=50`
      );
      const data = await res.json();
      if (data.ok) {
        setMessages((prev) => [...data.messages, ...prev]);
        setHasMore(!!data.nextCursor);
        setOldestCursor(data.nextCursor);
        // Maintain scroll position after prepending old messages
        requestAnimationFrame(() => {
          if (el) {
            el.scrollTop = el.scrollHeight - prevScrollHeight;
          }
        });
      }
    } catch {}
    setLoadingMore(false);
  }

  // ── Send message ────────────────────────────────────────────────────────────
  async function sendMessage(text) {
    if (!activeChannel || !activeServer) return;
    const res = await fetch("/api/discord-chat/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        serverSlug: activeServer.slug,
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
      lastMsgIdRef.current = data.message.id;
      return [...prev, data.message];
    });
    setReplyingTo(null);

    // Always scroll to bottom when YOU send
    isNearBottomRef.current = true;
    setTimeout(() => scrollToBottom("smooth"), 60);
  }

  // ── React ───────────────────────────────────────────────────────────────────
  async function handleReact(messageId, emoji) {
    try {
      const res = await fetch("/api/discord-chat/reactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messageId, emoji }),
      });
      const data = await res.json();
      if (data.ok) {
        setMessages((prev) => prev.map((m) => m.id === messageId ? { ...m, reactions: data.reactions } : m));
      }
    } catch {}
  }

  // ── Delete ──────────────────────────────────────────────────────────────────
  async function handleDelete(messageId) {
    try {
      const res = await fetch("/api/discord-chat/messages", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "delete", id: messageId }),
      });
      if (res.ok) {
        setMessages((prev) => prev.map((m) => m.id === messageId ? { ...m, deleted: true, body: "" } : m));
      }
    } catch {}
  }

  // ── Edit ────────────────────────────────────────────────────────────────────
  function handleEdit(updated) {
    setMessages((prev) => prev.map((m) => m.id === updated.id ? { ...m, ...updated } : m));
  }

  // ── Server invite response ─────────────────────────────────────────────────
  async function respondToServerInvite(inv, accept) {
    try {
      const res = await fetch("/api/discord-chat/servers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "respond_invite", serverSlug: inv.serverSlug, inviteId: inv.inviteId, accept }),
      });
      if (res.ok) {
        setServerInvites((prev) => prev.filter((i) => i.inviteId !== inv.inviteId));
        if (accept) {
          const r2 = await fetch("/api/discord-chat/servers");
          const d2 = await r2.json();
          if (d2.ok) setServers(d2.servers);
        }
      }
    } catch {}
  }

  // ── Leave / Delete server ──────────────────────────────────────────────────
  async function handleLeaveServer() {
    if (!activeServer || activeServer.isGlobal) return;
    if (!confirm(`Leave "${activeServer.name}"?`)) return;
    const res = await fetch("/api/discord-chat/servers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "leave", serverSlug: activeServer.slug }),
    });
    if (res.ok) {
      setServers((prev) => prev.filter((s) => s.slug !== activeServer.slug));
      setActiveServer(servers.find((s) => s.isGlobal) || null);
    }
  }

  async function handleDeleteServer() {
    if (!activeServer || activeServer.isGlobal) return;
    if (!confirm(`Permanently delete "${activeServer.name}"?`)) return;
    const res = await fetch("/api/discord-chat/servers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "delete", serverSlug: activeServer.slug }),
    });
    if (res.ok) {
      setServers((prev) => prev.filter((s) => s.slug !== activeServer.slug));
      setActiveServer(servers.find((s) => s.isGlobal) || null);
    }
  }

  const canManageServer = isAdmin || activeServer?.myRole === "owner" || activeServer?.myRole === "admin";
  const canDeleteAnyMessage = isAdmin || activeServer?.myRole === "owner";

  return (
    <>
      <div className="flex h-[calc(100vh-200px)] min-h-[500px] max-h-[800px] rounded-3xl border border-white/10 overflow-hidden bg-[#0d1117]">

        {/* Server rail */}
        <div className="w-[72px] shrink-0 bg-[#0a0d14] border-r border-white/8 flex flex-col items-center gap-2 py-3 overflow-y-auto">
          {servers.map((server) => (
            <ServerIcon
              key={server.id}
              server={server}
              active={activeServer?.slug === server.slug}
              onClick={() => {
                setActiveServer(server);
                setActiveChannel(null);
                setMessages([]);
              }}
            />
          ))}
          <div className="w-8 h-px bg-white/10 my-1" />
          <button
            onClick={() => setShowCreateServer(true)}
            title="Create a Server"
            className="group relative flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/[0.06] text-white/40 hover:rounded-xl hover:bg-emerald-500/20 hover:text-emerald-400 transition-all duration-200"
          >
            <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M12 5v14M5 12h14" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {/* Channel sidebar */}
        <div className="w-52 shrink-0 bg-[#0b0f1a] border-r border-white/8 flex flex-col">
          <ServerInvitesBanner invites={serverInvites} onRespond={respondToServerInvite} />
          {activeServer ? (
            <ChannelList
              server={activeServer}
              channels={channels}
              activeSlug={activeChannel?.slug}
              onSelect={(ch) => {
                setActiveChannel(ch);
                setMessages([]);
                setReplyingTo(null);
              }}
              canManage={canManageServer}
              onCreateChannel={(ch) => setChannels((prev) => [...prev, ch])}
              onInvite={() => setShowInvite(true)}
              onLeave={handleLeaveServer}
              onDelete={handleDeleteServer}
            />
          ) : (
            <div className="flex-1 flex items-center justify-center text-sm text-white/25 px-4 text-center">Select a server</div>
          )}
        </div>

        {/* Main chat area — key layout fix: flex col, overflow hidden */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

          {/* Channel header */}
          <div className="px-5 py-3 border-b border-white/8 shrink-0 flex items-center gap-3">
            {activeChannel ? (
              <>
                <span className="text-xl leading-none">{activeChannel.emoji}</span>
                <div>
                  <div className="font-black text-white text-sm">{activeChannel.name}</div>
                  {activeChannel.description && <div className="text-xs text-white/35 truncate max-w-md">{activeChannel.description}</div>}
                </div>
                <div className="ml-auto flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_4px_rgba(34,197,94,0.6)]" />
                  <span className="text-xs text-white/30">Live · {activeServer?.name}</span>
                </div>
              </>
            ) : (
              <div className="text-sm text-white/30">{activeServer ? "Select a channel" : "Select a server"}</div>
            )}
          </div>

          {error && (
            <div className="mx-4 mt-3 shrink-0 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-2 text-sm text-red-300">{error}</div>
          )}

          {/* Messages area — takes remaining space, scrolls internally */}
          {loadingMessages ? (
            <div className="flex-1 flex flex-col justify-end pb-4 overflow-hidden">
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
              canDeleteAny={canDeleteAnyMessage}
              onReact={handleReact}
              onReply={setReplyingTo}
              onDelete={handleDelete}
              onEdit={handleEdit}
              hasMore={hasMore}
              onLoadMore={loadMore}
              loadingMore={loadingMore}
              scrollRef={scrollRef}
              bottomRef={bottomRef}
            />
          )}

          {/* Compose box — always at bottom */}
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
            <div className="px-4 pb-3 shrink-0 text-center">
              <a href="/account" className="text-sm text-blue-400 hover:text-blue-300 underline font-bold">Set a username to start chatting →</a>
            </div>
          )}
        </div>
      </div>

      {showCreateServer && (
        <CreateServerModal
          onClose={() => setShowCreateServer(false)}
          onCreate={(s) => { setServers((prev) => [...prev, s]); setActiveServer(s); }}
        />
      )}
      {showInvite && activeServer && (
        <InviteModal server={activeServer} onClose={() => setShowInvite(false)} />
      )}
    </>
  );
}
