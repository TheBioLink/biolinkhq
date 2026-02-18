"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function UsernameForm({ desiredUsername }) {
  const [username, setUsername] = useState(desiredUsername || "");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/page", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uri: username }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data?.error || "Failed to save username");
        return;
      }

      router.push("/account");
      router.refresh();
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-4 max-w-md mx-auto mt-10">
      <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
        <h1 className="text-3xl font-bold text-center mb-2 text-gray-100">
          Pick your username
        </h1>
        <p className="text-center mb-6 text-gray-400">
          This becomes your public link.
        </p>

        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full bg-black/30 border border-white/10 p-3 rounded-md text-gray-100 placeholder:text-gray-500 outline-none focus:ring-2 focus:ring-blue-500/60"
            placeholder="biolinkhq"
            autoComplete="off"
          />

          {error && <div className="text-red-400 text-sm">{error}</div>}

          <button
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-md disabled:opacity-60"
            type="submit"
          >
            {loading ? "Saving..." : "Save username"}
          </button>
        </form>
      </div>
    </div>
  );
}
