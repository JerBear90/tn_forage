"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import OfflineBadge from "@/components/OfflineBadge";
import SafetyDisclaimer from "@/components/SafetyDisclaimer";
import GlobalSearchBar from "@/components/GlobalSearchBar";
import { getAllRecords } from "@/offline/db";

/** Pages where the app shell header should be hidden (auth screens). */
const hiddenPaths = ["/login", "/signup"];

/** Default profile icon SVG for when no avatar is available. */
function ProfileIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
    </svg>
  );
}

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAuthPage = hiddenPaths.includes(pathname);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [avatarError, setAvatarError] = useState(false);

  // Load user avatar from IndexedDB on mount
  useEffect(() => {
    let cancelled = false;
    async function loadAvatar() {
      try {
        const profiles = await getAllRecords("userProfileLocal");
        if (!cancelled && profiles.length > 0 && profiles[0].avatar) {
          const url = profiles[0].avatar;
          // Only use avatar if it looks like a valid image URL
          if (url.startsWith("/") || url.startsWith("http")) {
            setAvatarUrl(url);
          }
        }
      } catch {
        // No profile cached — use default icon
      }
    }
    loadAvatar();
    return () => { cancelled = true; };
  }, []);

  if (isAuthPage) {
    return <>{children}</>;
  }

  return (
    <>
      {/* Sticky header */}
      <header className="fixed top-0 inset-x-0 z-40 h-12 flex items-center justify-between px-4 bg-brand-sand/95 dark:bg-dark-surface/95 backdrop-blur border-b border-brand-charcoal/10 dark:border-dark-border">
        {/* Left: spacer for layout balance */}
        <div className="shrink-0" />

        {/* Right: Search + Offline badge + Profile — grouped together */}
        <div className="flex items-center gap-1.5">
          <OfflineBadge />
          <GlobalSearchBar />
          {/* Profile link — avatar if available, profile icon fallback */}
          <Link
            href="/profile"
            aria-label="Profile"
            className="shrink-0 rounded-full focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-teal transition-colors"
          >
            {avatarUrl && !avatarError ? (
              <img
                src={avatarUrl}
                alt="Your profile"
                width={28}
                height={28}
                className="h-7 w-7 rounded-full object-cover ring-1 ring-brand-charcoal/10 dark:ring-dark-border"
                onError={() => setAvatarError(true)}
              />
            ) : (
              <span className="flex items-center justify-center h-7 w-7 rounded-full bg-brand-charcoal/10 dark:bg-dark-border/50 text-brand-charcoal/70 dark:text-dark-text/70 hover:bg-brand-charcoal/15 dark:hover:bg-dark-border/70">
                <ProfileIcon />
              </span>
            )}
          </Link>
        </div>
      </header>

      {/* Content wrapper — padded for fixed header (top) and bottom nav */}
      <div className="pt-12">
        <SafetyDisclaimer />
        <main className="min-h-screen">{children}</main>
      </div>
    </>
  );
}
