"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

function cx(...s) {
  return s.filter(Boolean).join(" ");
}

export default function MobileTopbar({ username }) {
  const pathname = usePathname();

  const tabs = [
    { href: "/account", label: "My Page" },
    { href: "/analytics", label: "Analytics" },
  ];

  return (
    <div className="md:hidden sticky top-0 z-40 border-b border-white/10 bg-[#0b0f14]/90 backdrop-blur">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
        <div className="font-extrabold text-gray-100">Dashboard</div>
        <Link
          href={username ? `/${username}` : "/account"}
          className="text-sm text-blue-400 hover:text-blue-300 underline"
        >
          Preview
        </Link>
      </div>
      <div className="max-w-6xl mx-auto px-4 pb-3 flex gap-2">
        {tabs.map((t) => {
          const active =
            pathname === t.href || pathname.startsWith(t.href + "/");
          return (
            <Link
              key={t.href}
              href={t.href}
              className={cx(
                "flex-1 text-center rounded-xl px-3 py-2 text-sm font-bold border transition",
                active
                  ? "bg-white/10 border-white/10 text-white"
                  : "bg-white/5 border-white/10 text-gray-300 hover:text-white"
              )}
            >
              {t.label}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
