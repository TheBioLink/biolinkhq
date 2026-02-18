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
    } catch (err) {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-4 max-w-md mx-auto mt-10">
      <h1 className="text-3xl font-bold text-center mb-2">Pick your username</h1>
      <p className="text-center mb-6 text-gray-500">This becomes your public link.</p>

      <form onSubmit={handleSubmit} className="space-y-3">
        <input
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="w-full border p-3 rounded-md"
          placeholder="biolinkhq"
          autoComplete="off"
        />

        {error && <div className="text-red-600 text-sm">{error}</div>}

        <button
          disabled={loading}
          className="w-full bg-blue-500 hover:bg-blue-300 text-white font-bold py-3 rounded-md disabled:opacity-60"
          type="submit"
        >
          {loading ? "Saving..." : "Save username"}
        </button>
      </form>
    </div>
  );
}
