"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { navItems } from "./navItems";

/** Pages where the bottom nav should be hidden (auth screens). */
const hiddenPaths = ["/login", "/signup"];

export default function BottomNav() {
  const pathname = usePathname();

  if (hiddenPaths.includes(pathname)) {
    return null;
  }

  return (
    <nav
      aria-label="Main navigation"
      className="fixed bottom-0 inset-x-0 z-[9999] bg-white/95 dark:bg-dark-surface/95 backdrop-blur border-t border-brand-charcoal/10 dark:border-dark-border"
    >
      <ul className="flex items-center justify-around max-w-lg mx-auto px-1">
        {navItems.map((item) => {
          const isActive =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);

          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-label={item.label}
                aria-current={isActive ? "page" : undefined}
                className={`flex flex-col items-center justify-center gap-0.5 min-w-[56px] min-h-[56px] px-2 py-2 rounded-lg transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-teal ${
                  isActive
                    ? "text-brand-teal"
                    : "text-brand-charcoal/50 dark:text-dark-text-muted"
                }`}
              >
                <svg
                  aria-hidden="true"
                  className="w-6 h-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d={item.iconPath}
                  />
                </svg>
                <span className="text-[10px] font-medium leading-tight text-center">
                  {item.label}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
