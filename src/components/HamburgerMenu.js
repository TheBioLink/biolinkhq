"use client";

import Link from "next/link";
import LogoutButton from "@/components/buttons/LogoutButton";
import { useState } from "react";

export default function HamburgerMenu({ session }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="sm:hidden relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="p-2 border border-white/10 rounded-md text-gray-200 bg-white/5"
        aria-label="Open menu"
      >
        ☰
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-56 bg-[#0b0f14] border border-white/10 rounded-md shadow-lg z-50">
          <div className="flex flex-col p-3 gap-2 text-sm font-bold text-gray-200">
            <Link href="/about" onClick={() => setOpen(false)} className="hover:text-white">
              About
            </Link>
            <Link href="/pricing" onClick={() => setOpen(false)} className="hover:text-white">
              Pricing
            </Link>
            <Link href="/contact" onClick={() => setOpen(false)} className="hover:text-white">
              Contact
            </Link>
            <Link href="/privacy" onClick={() => setOpen(false)} className="hover:text-white">
              Privacy
            </Link>

            <hr className="my-2 border-white/10" />

            {!!session ? (
              <>
                <Link href="/account" onClick={() => setOpen(false)} className="hover:text-white">
                  Account
                </Link>
                <div onClick={() => setOpen(false)}>
                  <LogoutButton />
                </div>
              </>
            ) : (
              <Link href="/login" onClick={() => setOpen(false)} className="hover:text-white">
                Sign In
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
