"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import OfflineBadge from "@/components/OfflineBadge";
import SafetyDisclaimer from "@/components/SafetyDisclaimer";

/** Pages where the app shell header should be hidden (auth screens). */
const hiddenPaths = ["/login", "/signup"];

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAuthPage = hiddenPaths.includes(pathname);

  if (isAuthPage) {
    return <>{children}</>;
  }

  return (
    <>
      {/* Sticky header */}
      <header className="fixed top-0 inset-x-0 z-40 h-12 flex items-center justify-between px-4 bg-brand-sand/95 dark:bg-brand-charcoal/95 backdrop-blur border-b border-brand-charcoal/10 dark:border-brand-sand/10">
        <Link
          href="/"
          className="flex items-center gap-1.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-teal"
        >
          {/* Light mode logo */}
          <img
            src="/branding/logo.svg"
            alt="ForageFlow logo"
            width={28}
            height={28}
            className="h-7 w-7 rounded-md dark:hidden"
          />
          {/* Dark mode logo */}
          <img
            src="/branding/logo-dark.svg"
            alt="ForageFlow logo"
            width={28}
            height={28}
            className="h-7 w-7 rounded-md hidden dark:block"
          />
          <span className="font-heading font-semibold text-sm text-brand-teal">
            ForageFlow
          </span>
        </Link>

        {/* Offline badge — shows "Offline" pill when navigator.onLine is false */}
        <OfflineBadge />
      </header>

      {/* Content wrapper — padded for fixed header (top) and bottom nav */}
      <div className="pt-12">
        {/* Global safety disclaimer — shown once, dismissible, cached */}
        <SafetyDisclaimer />

        {/* Main content area */}
        <main className="min-h-screen">{children}</main>
      </div>
    </>
  );
}
