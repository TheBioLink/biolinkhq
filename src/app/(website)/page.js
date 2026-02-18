"use client";

import Link from "next/link";
import LogoutButton from "@/components/buttons/LogoutButton";
import { useState } from "react";

export default function HamburgerMenu({ session }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="sm:hidden relative">
      {/* Button */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="p-2 border rounded-md text-slate-600"
        aria-label="Open menu"
      >
        ☰
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute right-0 mt-2 w-52 bg-white border rounded-md shadow-lg z-50">
          <div className="flex flex-col p-3 gap-2 text-sm font-bold text-slate-600">
            <Link href="/about" onClick={() => setOpen(false)} className="hover:underline">
              About
            </Link>
            <Link href="/pricing" onClick={() => setOpen(false)} className="hover:underline">
              Pricing
            </Link>
            <Link href="/contact" onClick={() => setOpen(false)} className="hover:underline">
              Contact
            </Link>

            {/* NEW: Privacy */}
            <Link href="/privacy" onClick={() => setOpen(false)} className="hover:underline">
              Privacy
            </Link>

            <hr className="my-2" />

            {!!session ? (
              <>
                <Link
                  href="/account"
                  onClick={() => setOpen(false)}
                  className="hover:underline"
                >
                  Account
                </Link>
                <div onClick={() => setOpen(false)}>
                  <LogoutButton />
                </div>
              </>
            ) : (
              <Link
                href="/login"
                onClick={() => setOpen(false)}
                className="hover:underline"
              >
                Sign In
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
