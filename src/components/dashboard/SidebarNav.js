"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const nav = [
  { href: "/account", label: "My Page" },
  { href: "/analytics", label: "Analytics" },
];

function cx(...s) {
  return s.filter(Boolean).join(" ");
}

export default function SidebarNav({ username }) {
  const pathname = usePathname();

  return (
    <aside className="hidden md:flex md:flex-col md:w-64 lg:w-72 shrink-0">
      <div className="sticky top-6">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <div className="text-xs uppercase tracking-wider text-gray-400">
            Your page
          </div>
          <div className="mt-2 flex items-center justify-between">
            <div className="font-bold text-gray-100 truncate">
              /{username || "username"}
            </div>
            <Link
              href={username ? `/${username}` : "/account"}
              className="text-sm text-blue-400 hover:text-blue-300 underline"
            >
              Preview
            </Link>
          </div>

          <div className="mt-4 space-y-1">
            {nav.map((item) => {
              const active =
                pathname === item.href || pathname.startsWith(item.href + "/");
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cx(
                    "flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-semibold transition",
                    active
                      ? "bg-white/10 text-white border border-white/10"
                      : "text-gray-300 hover:bg-white/5 hover:text-white"
                  )}
                >
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>
        </div>

        <div className="mt-3 rounded-2xl border border-white/10 bg-white/5 p-4">
          <Link
            href="/"
            className="text-sm font-semibold text-gray-300 hover:text-white"
          >
            ← Back to website
          </Link>
        </div>
      </div>
    </aside>
  );
}
