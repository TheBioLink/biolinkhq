"use client";

import { useState, useEffect } from "react";
import LoginWithGoogle from "@/components/buttons/LoginWithGoogle";
import Script from "next/script";
import Link from "next/link";

export const metadata = {
  title: "Biolinkhq.lol | Login",
  description:
    "Share your links, social profiles, contact info and more on one page with Biolinkhq",
};

export default function LoginPage({ searchParams }) {
  const error = searchParams?.error;
  const reasonParam = searchParams?.reason;

  const [accepted, setAccepted] = useState(false);
  const [loading, setLoading] = useState(false);

  const REQUIRED_VERSION = "2026-05-03";

  const bannedReason =
    error === "banned"
      ? decodeURIComponent((reasonParam || "Banned").toString())
      : "";

  // check cookie on load (basic UX)
  useEffect(() => {
    const cookies = document.cookie.split(";").map((c) => c.trim());
    const found = cookies.find((c) =>
      c.startsWith("blhq_tos_accepted=")
    );

    if (found) {
      const value = found.split("=")[1];
      if (value === REQUIRED_VERSION) {
        setAccepted(true);
      }
    }
  }, []);

  const acceptTos = async (checked) => {
    setAccepted(checked);

    if (!checked) return;

    setLoading(true);

    try {
      await fetch("/api/accept-tos", {
        method: "POST",
      });

      setAccepted(true);
    } catch (e) {
      console.error("Failed to set cookie");
      setAccepted(false);
    }

    setLoading(false);
  };

  return (
    <>
      <Script
        async
        strategy="afterInteractive"
        src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-8336311096274398"
        crossOrigin="anonymous"
      />

      <div className="min-h-screen bg-[#0b0f14] text-gray-100 flex items-center justify-center px-4">
        <div className="w-full max-w-sm">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
            <h1 className="text-4xl font-extrabold text-center mb-2">
              Sign In
            </h1>

            <p className="text-center mb-6 text-gray-400">
              Sign in to your account
            </p>

            {bannedReason && (
              <div className="mb-6 rounded-xl border border-red-500/20 bg-red-500/10 p-4">
                <div className="font-extrabold text-red-200">
                  You are banned from Biolinkhq
                </div>
                <div className="text-sm text-gray-200 mt-1">
                  Reason:{" "}
                  <span className="font-semibold">{bannedReason}</span>
                </div>
              </div>
            )}

            {/* TOS */}
            <div className="mb-6">
              <label className="flex items-start gap-3 cursor-pointer text-sm text-gray-300">
                <input
                  type="checkbox"
                  checked={accepted}
                  onChange={(e) => acceptTos(e.target.checked)}
                  className="mt-1 accent-white"
                />

                <span>
                  I agree to the{" "}
                  <Link href="/terms" className="underline hover:text-white">
                    Terms of Service
                  </Link>{" "}
                  and{" "}
                  <Link href="/privacy" className="underline hover:text-white">
                    Privacy Policy
                  </Link>
                </span>
              </label>
            </div>

            {/* Login */}
            <div
              className={`transition ${
                !accepted || loading
                  ? "opacity-50 pointer-events-none"
                  : ""
              }`}
            >
              <LoginWithGoogle />
            </div>

            {!accepted && (
              <p className="text-xs text-gray-500 mt-3 text-center">
                You must accept the Terms to continue
              </p>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
