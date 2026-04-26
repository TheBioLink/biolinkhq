"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

function cleanUsername(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, "")
    .slice(0, 24);
}

export default function UsernameForm({ desiredUsername }) {
  const [username, setUsername] = useState(cleanUsername(desiredUsername || ""));
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const preview = useMemo(() => username || "yourname", [username]);
  const isValid = username.length >= 2 && username.length <= 24;

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    const finalUsername = cleanUsername(username);
    setUsername(finalUsername);

    if (!finalUsername || finalUsername.length < 2) {
      setError("Username must be at least 2 characters.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/username", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: finalUsername }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data?.error || "Failed to save username");
        return;
      }

      router.push("/account");
      router.refresh();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-[55vh] w-full max-w-xl items-center justify-center px-2 py-4 sm:px-4">
      <div className="w-full overflow-hidden rounded-3xl border border-white/10 bg-[#101827]/90 shadow-2xl backdrop-blur">
        <div className="border-b border-white/10 bg-white/[0.03] px-5 py-5 sm:px-7">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-blue-300/80">
            Account setup
          </p>
          <h1 className="mt-2 text-2xl font-black tracking-tight text-white sm:text-3xl">
            Pick your username
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-white/55">
            This becomes your public BiolinkHQ link. Use letters, numbers, underscores or hyphens.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 p-5 sm:p-7">
          <div>
            <label className="mb-2 block text-sm font-bold text-white/75">
              Username
            </label>
            <div className="flex overflow-hidden rounded-2xl border border-white/10 bg-black/30 focus-within:border-blue-400/70">
              <span className="hidden items-center border-r border-white/10 px-4 text-sm text-white/35 sm:flex">
                biolinkhq.lol/
              </span>
              <input
                value={username}
                onChange={(e) => setUsername(cleanUsername(e.target.value))}
                className="min-w-0 flex-1 bg-transparent px-4 py-3 text-white outline-none placeholder:text-white/30"
                placeholder="yourname"
                autoComplete="off"
                autoCapitalize="none"
                spellCheck="false"
              />
            </div>
            <div className="mt-2 flex flex-col gap-1 text-xs text-white/40 sm:flex-row sm:items-center sm:justify-between">
              <span>Preview: /{preview}</span>
              <span>{username.length}/24</span>
            </div>
          </div>

          {error ? (
            <div className="rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm font-medium text-red-200">
              {error}
            </div>
          ) : null}

          <button
            disabled={loading || !isValid}
            className="w-full rounded-2xl bg-blue-600 px-5 py-3 text-sm font-black text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
            type="submit"
          >
            {loading ? "Saving..." : "Save username"}
          </button>
        </form>
      </div>
    </div>
  );
}
