"use client";
// src/components/discord/DiscordLinkCard.jsx
// Dashboard card — lets users connect/disconnect Discord and manage privacy settings

import { useState, useEffect, useCallback } from "react";
import toast from "react-hot-toast";

const STATUS_COLORS = {
  online: "#23d18b",
  idle: "#f0a500",
  dnd: "#ed4245",
  offline: "#747f8d",
  unknown: "#747f8d",
};

const STATUS_LABELS = {
  online: "Online",
  idle: "Idle",
  dnd: "Do Not Disturb",
  offline: "Offline",
  unknown: "Unknown",
};

function StatusDot({ status }) {
  const color = STATUS_COLORS[status] || STATUS_COLORS.unknown;
  return (
    <span
      className="inline-block h-2.5 w-2.5 rounded-full ring-2 ring-black/30"
      style={{ backgroundColor: color }}
      title={STATUS_LABELS[status] || "Unknown"}
    />
  );
}

export default function DiscordLinkCard() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const [linked, setLinked] = useState(false);
  const [discordData, setDiscordData] = useState(null);
  const [settings, setSettings] = useState({
    showUsername: true,
    showStatus: true,
    showDiscordId: false,
  });

  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch("/api/discord/disconnect");
      const data = await res.json();

      if (data.linked) {
        setLinked(true);
        setDiscordData(data);
        setSettings({
          showUsername: data.showUsername ?? true,
          showStatus: data.showStatus ?? true,
          showDiscordId: data.showDiscordId ?? false,
        });
      } else {
        setLinked(false);
        setDiscordData(null);
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  // Check for discord=connected or discord=error in URL after OAuth redirect
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const discordParam = params.get("discord");

    if (discordParam === "connected") {
      toast.success("Discord connected successfully!");
      fetchStatus();
      // Clean up URL
      params.delete("discord");
      const newUrl =
        window.location.pathname +
        (params.toString() ? `?${params.toString()}` : "");
      window.history.replaceState({}, "", newUrl);
    } else if (discordParam === "error") {
      const reason = params.get("reason") || "unknown";
      const messages = {
        already_linked_to_another_account:
          "This Discord account is already linked to another BiolinkHQ profile.",
        token_exchange: "Failed to connect Discord. Please try again.",
        fetch_user: "Could not fetch your Discord profile. Try again.",
        denied: "You cancelled the Discord connection.",
        missing_env: "Discord integration is not configured.",
        server_error: "A server error occurred. Please try again.",
      };
      toast.error(messages[reason] || "Discord connection failed.");
      params.delete("discord");
      params.delete("reason");
      const newUrl =
        window.location.pathname +
        (params.toString() ? `?${params.toString()}` : "");
      window.history.replaceState({}, "", newUrl);
    } else if (discordParam === "denied") {
      toast("Discord connection was cancelled.", { icon: "ℹ️" });
      params.delete("discord");
      const newUrl =
        window.location.pathname +
        (params.toString() ? `?${params.toString()}` : "");
      window.history.replaceState({}, "", newUrl);
    }
  }, [fetchStatus]);

  const handleConnect = () => {
    window.location.href = "/api/discord/connect";
  };

  const handleDisconnect = async () => {
    if (!confirm("Disconnect your Discord account? It will no longer appear on your public page.")) return;
    setDisconnecting(true);
    try {
      const res = await fetch("/api/discord/disconnect", { method: "POST" });
      const data = await res.json();
      if (data.ok) {
        toast.success("Discord disconnected.");
        setLinked(false);
        setDiscordData(null);
      } else {
        toast.error(data.error || "Failed to disconnect.");
      }
    } catch {
      toast.error("Failed to disconnect.");
    } finally {
      setDisconnecting(false);
    }
  };

  const handleSaveSettings = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/discord/status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      const data = await res.json();
      if (data.ok) {
        toast.success("Privacy settings saved.");
      } else {
        toast.error(data.error || "Failed to save.");
      }
    } catch {
      toast.error("Failed to save settings.");
    } finally {
      setSaving(false);
    }
  };

  const toggle = (key) =>
    setSettings((prev) => ({ ...prev, [key]: !prev[key] }));

  if (loading) {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/5 p-6 animate-pulse">
        <div className="h-5 w-32 rounded bg-white/10" />
        <div className="mt-3 h-3 w-56 rounded bg-white/10" />
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        {/* Discord logo SVG */}
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="shrink-0">
          <path
            d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057.1 18.08.114 18.102.138 18.116a19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z"
            fill="#5865F2"
          />
        </svg>
        <div>
          <h2 className="text-lg font-black">Discord</h2>
          <p className="text-xs text-white/45">
            {linked ? "Connected to your public profile" : "Link your Discord to your public profile"}
          </p>
        </div>
        {linked && (
          <span className="ml-auto inline-flex items-center gap-1.5 rounded-full bg-green-500/15 px-3 py-1 text-xs font-bold text-green-400 ring-1 ring-green-500/20">
            <span className="h-1.5 w-1.5 rounded-full bg-green-400" />
            Connected
          </span>
        )}
      </div>

      {/* Not linked state */}
      {!linked && (
        <div className="space-y-4">
          <p className="text-sm text-white/55 leading-relaxed">
            Connect Discord to display your username and avatar on your public BiolinkHQ page. You control what&apos;s visible.
          </p>
          <button
            onClick={handleConnect}
            className="flex items-center gap-2 rounded-xl bg-[#5865F2] px-5 py-2.5 text-sm font-bold text-white transition hover:bg-[#4752C4] active:scale-95"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
              <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057.1 18.08.114 18.102.138 18.116a19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z" />
            </svg>
            Connect Discord
          </button>
        </div>
      )}

      {/* Linked state */}
      {linked && discordData && (
        <>
          {/* Profile preview */}
          <div className="flex items-center gap-4 rounded-xl border border-white/10 bg-black/20 p-4">
            <div className="relative shrink-0">
              {discordData.discordAvatarUrl ? (
                <img
                  src={discordData.discordAvatarUrl}
                  alt={discordData.discordGlobalName}
                  className="h-12 w-12 rounded-full"
                />
              ) : (
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#5865F2] text-lg font-black">
                  {(discordData.discordGlobalName || "D").slice(0, 1).toUpperCase()}
                </div>
              )}
              <span
                className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full ring-2 ring-black"
                style={{
                  backgroundColor:
                    STATUS_COLORS[discordData.onlineStatus] || STATUS_COLORS.unknown,
                }}
              />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-bold truncate">
                  {discordData.discordGlobalName || discordData.discordUsername}
                </span>
                <StatusDot status={discordData.onlineStatus} />
              </div>
              <div className="text-xs text-white/45 truncate">
                @{discordData.discordUsername}
                {discordData.discordId && (
                  <span className="ml-2 text-white/25">ID: {discordData.discordId}</span>
                )}
              </div>
            </div>
          </div>

          {/* Privacy toggles */}
          <div className="space-y-3">
            <p className="text-xs font-bold uppercase tracking-[0.15em] text-white/40">
              What to show on your public page
            </p>

            {[
              { key: "showUsername", label: "Username & display name", desc: "Show your Discord username on your profile" },
              { key: "showStatus", label: "Online status", desc: "Show whether you're online, idle, or offline" },
              { key: "showDiscordId", label: "Discord ID", desc: "Show your numeric Discord ID publicly" },
            ].map(({ key, label, desc }) => (
              <label
                key={key}
                className="flex cursor-pointer items-start gap-3 rounded-xl border border-white/10 bg-black/10 p-3 hover:bg-white/5 transition"
              >
                <div className="relative mt-0.5 shrink-0">
                  <input
                    type="checkbox"
                    className="sr-only"
                    checked={settings[key]}
                    onChange={() => toggle(key)}
                  />
                  <div
                    className={`h-5 w-9 rounded-full transition-colors ${
                      settings[key] ? "bg-blue-500" : "bg-white/20"
                    }`}
                  >
                    <div
                      className={`h-4 w-4 rounded-full bg-white shadow transition-transform mt-0.5 ${
                        settings[key] ? "translate-x-4 ml-0.5" : "translate-x-0.5"
                      }`}
                    />
                  </div>
                </div>
                <div>
                  <div className="text-sm font-semibold text-white/90">{label}</div>
                  <div className="text-xs text-white/40">{desc}</div>
                </div>
              </label>
            ))}
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-3 pt-1">
            <button
              onClick={handleSaveSettings}
              disabled={saving}
              className="rounded-xl bg-blue-600 px-5 py-2 text-sm font-bold text-white transition hover:bg-blue-500 disabled:opacity-50"
            >
              {saving ? "Saving…" : "Save settings"}
            </button>
            <button
              onClick={handleDisconnect}
              disabled={disconnecting}
              className="rounded-xl border border-red-500/20 bg-red-500/10 px-5 py-2 text-sm font-bold text-red-400 transition hover:bg-red-500/20 disabled:opacity-50"
            >
              {disconnecting ? "Disconnecting…" : "Disconnect"}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
