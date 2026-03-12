// src/components/dashboard/SponsorCreditsPanel.js
"use client";

import { useEffect, useMemo, useState } from "react";

export default function SponsorCreditsPanel() {
  const [users, setUsers] = useState([]);
  const [email, setEmail] = useState("");
  const [amount, setAmount] = useState("");
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [search, setSearch] = useState("");

  async function loadUsers() {
    try {
      setLoadingUsers(true);
      const res = await fetch("/api/credits/users", { cache: "no-store" });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || "Failed to load users");
      }

      setUsers(Array.isArray(data?.users) ? data.users : []);
    } catch (error) {
      setMessage(error?.message || "Failed to load users");
    } finally {
      setLoadingUsers(false);
    }
  }

  useEffect(() => {
    loadUsers();
  }, []);

  const filteredUsers = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return users;

    return users.filter((user) => {
      return (
        String(user?.email || "").toLowerCase().includes(q) ||
        String(user?.discordUsername || "").toLowerCase().includes(q) ||
        String(user?._id || "").toLowerCase().includes(q)
      );
    });
  }, [users, search]);

  async function giveCredits(e) {
    e.preventDefault();

    try {
      setSubmitting(true);
      setMessage("");

      const res = await fetch("/api/credits/give", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          amount: Number(amount),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || "Failed to give credits");
      }

      setMessage(`Sent ${data?.amount} credits to ${data?.recipientEmail}`);
      setEmail("");
      setAmount("");

      await loadUsers();
    } catch (error) {
      setMessage(error?.message || "Failed to give credits");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="rounded-2xl border border-emerald-500/20 bg-gradient-to-b from-emerald-500/10 to-white/5 p-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="mb-2 inline-flex rounded-full border border-emerald-400/20 bg-emerald-500/10 px-3 py-1 text-xs font-extrabold uppercase tracking-[0.22em] text-emerald-300">
            Sponsor Credits
          </div>
          <h2 className="text-2xl font-black text-white">itsnicbtw control panel</h2>
          <p className="mt-2 text-sm text-white/65">
            Infinite credits can be granted from here. Only itsnicbtw can access this.
          </p>
        </div>
      </div>

      <form onSubmit={giveCredits} className="grid gap-4 lg:grid-cols-[1fr_180px_auto]">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="user@email.com"
          className="w-full rounded-xl border border-white/10 bg-black/30 p-3 text-gray-100 outline-none placeholder:text-gray-500 focus:ring-2 focus:ring-emerald-500/50"
        />

        <input
          type="number"
          min="1"
          step="1"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="Credits"
          className="w-full rounded-xl border border-white/10 bg-black/30 p-3 text-gray-100 outline-none placeholder:text-gray-500 focus:ring-2 focus:ring-emerald-500/50"
        />

        <button
          disabled={submitting}
          type="submit"
          className="rounded-xl bg-emerald-600 px-6 py-3 font-extrabold text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting ? "Sending..." : "Give Credits"}
        </button>
      </form>

      {message ? (
        <div className="mt-4 rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white/85">
          {message}
        </div>
      ) : null}

      <div className="mt-8">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
          <h3 className="text-xl font-black text-white">User list</h3>

          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search email, discord, or user id"
            className="w-full max-w-sm rounded-xl border border-white/10 bg-black/30 p-3 text-gray-100 outline-none placeholder:text-gray-500 focus:ring-2 focus:ring-emerald-500/50"
          />
        </div>

        <div className="overflow-hidden rounded-2xl border border-white/10 bg-black/20">
          <div className="grid grid-cols-[1.2fr_1fr_1fr_120px] gap-4 border-b border-white/10 px-4 py-3 text-xs font-bold uppercase tracking-[0.16em] text-white/45">
            <div>Email</div>
            <div>Discord User</div>
            <div>User ID</div>
            <div>Credits</div>
          </div>

          {loadingUsers ? (
            <div className="px-4 py-6 text-sm text-white/60">Loading users...</div>
          ) : filteredUsers.length === 0 ? (
            <div className="px-4 py-6 text-sm text-white/60">No users found.</div>
          ) : (
            <div className="divide-y divide-white/10">
              {filteredUsers.map((user) => (
                <div
                  key={user._id}
                  className="grid grid-cols-[1.2fr_1fr_1fr_120px] gap-4 px-4 py-4 text-sm text-white/85"
                >
                  <div className="truncate">{user.email || "—"}</div>
                  <div className="truncate">
                    {user.discordUsername
                      ? `${user.discordUsername}${user.discordId ? ` (${user.discordId})` : ""}`
                      : "—"}
                  </div>
                  <div className="truncate text-white/60">{user._id}</div>
                  <div className="font-bold">{Number(user.credits || 0)}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
