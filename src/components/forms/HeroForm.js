"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function HeroForm({ user }) {
  const router = useRouter();
  const [username, setUsername] = useState("");

  function handleSubmit(e) {
    e.preventDefault();

    // If logged in, go to account (they can set username there)
    if (user) {
      router.push("/account");
      return;
    }

    // If not logged in, send them to login
    router.push("/login");
  }

  return (
    <div className="mt-8">
      <form
        onSubmit={handleSubmit}
        className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3"
      >
        <div className="flex w-full sm:w-[420px] overflow-hidden rounded-lg border border-white/10 bg-white/5">
          <span className="px-4 py-3 text-sm font-semibold text-gray-200 bg-black/40 border-r border-white/10 whitespace-nowrap">
            biolinkhq.lol/
          </span>

          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="username"
            autoComplete="off"
            className="flex-1 px-4 py-3 bg-transparent text-gray-100 placeholder:text-gray-500 outline-none"
          />
        </div>

        <button
          type="submit"
          className="px-6 py-3 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold shadow disabled:opacity-60"
        >
          {user ? "Go to Dashboard" : "Join for Free"}
        </button>
      </form>

      {!user && (
        <p className="mt-3 text-sm text-gray-400">
          Already have an account?{" "}
          <Link href="/login" className="text-blue-400 hover:text-blue-300 underline">
            Sign in
          </Link>
        </p>
      )}
    </div>
  );
}
