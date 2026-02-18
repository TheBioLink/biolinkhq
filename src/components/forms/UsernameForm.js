"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function UsernameForm({ desiredUsername }) {
  const [username, setUsername] = useState(desiredUsername || "");
  const [error, setError] = useState("");
  const router = useRouter();

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    const res = await fetch("/api/username", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ username }),
    });

    const data = await res.json();

    if (!res.ok) {
      setError(data.error || "Something went wrong");
      return;
    }

    router.push("/account");
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-md mx-auto mt-10">
      <h2 className="text-2xl font-bold mb-4">Choose Your Username</h2>

      <input
        type="text"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        className="w-full border p-2 rounded mb-4"
        placeholder="username"
        required
      />

      {error && <p className="text-red-500 mb-3">{error}</p>}

      <button
        type="submit"
        className="bg-blue-500 text-white px-6 py-2 rounded hover:bg-blue-300"
      >
        Save Username
      </button>
    </form>
  );
}
