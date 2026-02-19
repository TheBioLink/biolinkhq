"use client";

import { useEffect, useState } from "react";

export default function BanPanel() {
  const [passcode, setPasscode] = useState("");
  const [type, setType] = useState("email");
  const [identifier, setIdentifier] = useState("");
  const [reason, setReason] = useState("");
  const [msg, setMsg] = useState("");
  const [bans, setBans] = useState([]);
  const [loading, setLoading] = useState(false);

  async function refresh() {
    const res = await fetch("/api/ban", { method: "GET" });
    const data = await res.json();
    setBans(data?.bans || []);
  }

  useEffect(() => {
    refresh().catch(() => {});
  }, []);

  async function doAction(action) {
    setMsg("");
    setLoading(true);

    try {
      const res = await fetch("/api/ban", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          passcode,
          type,
          identifier,
          reason,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setMsg(data?.error || "Failed");
        return;
      }

      setMsg(action === "ban" ? "Banned." : "Unbanned.");
      setIdentifier("");
      setReason("");
      await refresh();
    } catch {
      setMsg("Network error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="rounded-2xl border border-red-500/20 bg-red-500/5 p-8">
      <h2 className="text-xl font-extrabold">Admin: Ban Panel</h2>
      <p className="text-sm text-gray-300 mt-2">
        Ban by <b>email</b> to block login, or by <b>uri</b> to disable a public page.
      </p>

      <div className="mt-6 grid md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-bold text-gray-200 mb-2">
            BAN_PASS_CODE
          </label>
          <input
            value={passcode}
            onChange={(e) => setPasscode(e.target.value)}
            className="w-full bg-black/30 border border-white/10 rounded-xl p-3 text-gray-100 placeholder:text-gray-500"
            placeholder="Enter passcode"
            type="password"
          />
        </div>

        <div>
          <label className="block text-sm font-bold text-gray-200 mb-2">
            Type
          </label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="w-full bg-black/30 border border-white/10 rounded-xl p-3 text-gray-100"
          >
            <option value="email">email (blocks login)</option>
            <option value="uri">uri (disables profile)</option>
          </select>
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-bold text-gray-200 mb-2">
            Identifier
          </label>
          <input
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            className="w-full bg-black/30 border border-white/10 rounded-xl p-3 text-gray-100 placeholder:text-gray-500"
            placeholder={type === "email" ? "user@email.com" : "username (e.g. ceosolace)"}
          />
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-bold text-gray-200 mb-2">
            Reason (optional)
          </label>
          <input
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="w-full bg-black/30 border border-white/10 rounded-xl p-3 text-gray-100 placeholder:text-gray-500"
            placeholder="Spam / abuse / etc"
          />
        </div>
      </div>

      <div className="mt-5 flex flex-wrap gap-3">
        <button
          disabled={loading}
          onClick={() => doAction("ban")}
          className="px-5 py-3 rounded-xl bg-red-600 hover:bg-red-500 text-white font-extrabold disabled:opacity-60"
          type="button"
        >
          Ban
        </button>
        <button
          disabled={loading}
          onClick={() => doAction("unban")}
          className="px-5 py-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-gray-100 font-extrabold disabled:opacity-60"
          type="button"
        >
          Unban
        </button>

        {msg && <div className="text-sm text-gray-200 flex items-center">{msg}</div>}
      </div>

      <div className="mt-8">
        <div className="flex items-center justify-between">
          <h3 className="font-extrabold">Active bans</h3>
          <button
            type="button"
            onClick={refresh}
            className="text-sm text-blue-400 hover:text-blue-300 underline"
          >
            Refresh
          </button>
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-gray-400">
              <tr className="border-b border-white/10">
                <th className="text-left py-2 pr-4">Type</th>
                <th className="text-left py-2 pr-4">Identifier</th>
                <th className="text-left py-2 pr-4">Reason</th>
                <th className="text-left py-2 pr-4">When</th>
              </tr>
            </thead>
            <tbody className="text-gray-200">
              {bans.map((b) => (
                <tr key={b._id} className="border-b border-white/10">
                  <td className="py-2 pr-4">{b.type}</td>
                  <td className="py-2 pr-4">{b.identifier}</td>
                  <td className="py-2 pr-4">{b.reason || "—"}</td>
                  <td className="py-2 pr-4">
                    {b.createdAt ? new Date(b.createdAt).toLocaleString() : "—"}
                  </td>
                </tr>
              ))}
              {bans.length === 0 && (
                <tr>
                  <td className="py-3 text-gray-400" colSpan={4}>
                    No bans.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
