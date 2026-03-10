// src/components/ProfileShareButton.js
"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import {
  faCheck,
  faCopy,
  faPaperPlane,
  faShareNodes,
  faTimes,
} from "@fortawesome/free-solid-svg-icons";
import { faTwitter } from "@fortawesome/free-brands-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { trackProfileEvent } from "@/lib/trackProfileEvent";

function getSafeUrl(url) {
  if (url && typeof url === "string") return url;
  if (typeof window !== "undefined") return window.location.href;
  return "";
}

export default function ProfileShareButton({
  url,
  displayName,
  username,
  bio,
  avatar,
}) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [mountedUrl, setMountedUrl] = useState("");
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    setMountedUrl(getSafeUrl(url));
  }, [url]);

  useEffect(() => {
    if (!open) return;

    if (username) {
      trackProfileEvent(username, "share_open");
    }

    const onKeyDown = (e) => {
      if (e.key === "Escape") setOpen(false);
    };

    document.addEventListener("keydown", onKeyDown);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
    };
  }, [open, username]);

  const shareText = useMemo(() => {
    const name = displayName || username || "this profile";
    return `Check out ${name} on BiolinkHQ`;
  }, [displayName, username]);

  const tweetHref = useMemo(() => {
    const text = encodeURIComponent(shareText);
    const target = encodeURIComponent(mountedUrl);
    return `https://twitter.com/intent/tweet?text=${text}&url=${target}`;
  }, [shareText, mountedUrl]);

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(mountedUrl);
      if (username) {
        trackProfileEvent(username, "share_copy", mountedUrl);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {}
  }

  async function nativeShare() {
    try {
      if (navigator.share) {
        await navigator.share({
          title: displayName || username || "BiolinkHQ Profile",
          text: shareText,
          url: mountedUrl,
        });
        if (username) {
          trackProfileEvent(username, "share_native", mountedUrl);
        }
        return;
      }
      await copyLink();
    } catch {}
  }

  const modal = open ? (
    <div className="fixed inset-0 z-[9999]">
      <button
        type="button"
        aria-label="Close share modal"
        onClick={() => setOpen(false)}
        className="absolute inset-0 bg-black/70 backdrop-blur-[2px]"
      />

      <div className="absolute inset-0 overflow-y-auto">
        <div className="flex min-h-screen items-center justify-center p-4 sm:p-6">
          <div className="relative my-6 w-full max-w-[510px] rounded-[26px] border border-[#1d2b63] bg-[#071233] shadow-[0_20px_80px_rgba(0,0,0,0.6)]">
            <div className="flex items-center justify-between border-b border-white/8 px-5 py-5">
              <h3 className="text-xl font-extrabold text-white">Share Profile</h3>

              <button
                type="button"
                onClick={() => setOpen(false)}
                className="inline-flex h-9 w-9 items-center justify-center rounded-full text-white/80 transition hover:bg-white/10 hover:text-white"
              >
                <FontAwesomeIcon icon={faTimes} className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-5 px-5 py-5">
              <div className="rounded-2xl border border-[#3048bf] bg-[#030816] p-4 shadow-inner">
                <div className="flex items-start gap-3">
                  <img
                    src={avatar || "/assets/logo.webp"}
                    alt={displayName || username || "Profile avatar"}
                    className="h-12 w-12 rounded-full border border-white/10 object-cover"
                  />

                  <div className="min-w-0 flex-1">
                    <div className="truncate text-base font-extrabold text-white">
                      {displayName || username || "Profile"}
                    </div>

                    {!!username && (
                      <div className="truncate text-sm text-white/55">
                        @{username}
                      </div>
                    )}

                    {!!bio && (
                      <p className="mt-2 break-words text-sm text-white/80">
                        {bio}
                      </p>
                    )}

                    <div className="mt-3 break-all text-xs text-white/40">
                      {mountedUrl}
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <div className="mb-3 text-sm font-bold text-white/90">
                  Share externally
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <button
                    type="button"
                    onClick={copyLink}
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/12 bg-[#08163d] px-4 py-4 text-sm font-semibold text-white transition hover:border-white/20 hover:bg-[#0a1b4a]"
                  >
                    <FontAwesomeIcon
                      icon={copied ? faCheck : faCopy}
                      className="h-4 w-4"
                    />
                    {copied ? "Copied" : "Copy Link"}
                  </button>

                  <a
                    href={tweetHref}
                    target="_blank"
                    rel="noreferrer"
                    onClick={() => {
                      if (username) {
                        trackProfileEvent(username, "share_x", mountedUrl);
                      }
                    }}
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/12 bg-[#08163d] px-4 py-4 text-sm font-semibold text-white transition hover:border-white/20 hover:bg-[#0a1b4a]"
                  >
                    <FontAwesomeIcon icon={faTwitter} className="h-4 w-4" />
                    Share on X
                  </a>
                </div>

                <button
                  type="button"
                  onClick={nativeShare}
                  className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-[#1d3ea6] bg-[#0b1f58] px-4 py-4 text-sm font-semibold text-white transition hover:bg-[#102769]"
                >
                  <FontAwesomeIcon icon={faPaperPlane} className="h-4 w-4" />
                  Share Profile
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  ) : null;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-sm font-semibold text-white transition hover:border-white/25 hover:bg-white/10"
      >
        <FontAwesomeIcon icon={faShareNodes} className="h-4 w-4" />
        Share
      </button>

      {isMounted ? createPortal(modal, document.body) : null}
    </>
  );
}
