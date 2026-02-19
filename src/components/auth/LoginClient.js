"use client";

import { signIn } from "next-auth/react";

export default function LoginClient({ bannedReason }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-8">
      {bannedReason && (
        <div className="mb-6 rounded-xl border border-red-500/20 bg-red-500/10 p-4">
          <div className="font-extrabold text-red-200">You are banned</div>
          <div className="text-sm text-gray-200 mt-1">
            Reason: <span className="font-semibold">{bannedReason}</span>
          </div>
        </div>
      )}

      <button
        onClick={() => signIn("google")}
        className="w-full px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-extrabold"
      >
        Continue with Google
      </button>

      <p className="text-sm text-gray-400 mt-4">
        By continuing you agree to our terms.
      </p>
    </div>
  );
}
