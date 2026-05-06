"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import OfflineBadge from "@/components/OfflineBadge";
import SafetyDisclaimer from "@/components/SafetyDisclaimer";
import GlobalSearchBar from "@/components/GlobalSearchBar";
import SupportFooter from "@/components/SupportFooter";
import { useWeatherTemp } from "@/hooks/useWeatherTemp";
import { useAutoSync } from "@/hooks/useAutoSync";
import { usePageViewTracking } from "@/hooks/usePageViewTracking";
import { useErrorCapture } from "@/hooks/useErrorCapture";
import { useSessionTracking } from "@/hooks/useSessionTracking";
import NotificationSignupPrompt from "@/components/NotificationSignupPrompt";
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
  const { temp, icon } = useWeatherTemp();
  const { syncing, pendingCount } = useAutoSync();
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [avatarError, setAvatarError] = useState(false);

  // Track page views on route changes (Requirements: 2.1, 12.1)
  usePageViewTracking();

  // Initialize global error capture (Requirements: 5.1, 5.7, 12.3)
  useErrorCapture();

  // Track session duration and page count (Requirements: 4.1, 4.4)
  useSessionTracking();

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
        {/* Left: Home link */}
        <Link
          href="/"
          aria-label="Home"
          className="shrink-0 flex items-center gap-1.5 text-brand-forest dark:text-brand-moss hover:text-brand-teal transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-teal"
        >
          <svg
            aria-hidden="true"
            className="w-5 h-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M2.25 12l8.954-8.955a1.126 1.126 0 011.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25"
            />
          </svg>
          <span className="text-sm font-heading font-semibold hidden sm:inline">ForageWise</span>
        </Link>

        {/* Right: Weather + Search + Offline badge + Profile */}
        <div className="flex items-center gap-1.5">
          {temp !== null && (
            <span
              className="text-xs font-medium text-brand-charcoal/70 dark:text-brand-sand/70 tabular-nums flex items-center gap-0.5"
              aria-label={`Current temperature: ${temp}°F`}
            >
              {icon && <span aria-hidden="true">{icon}</span>}
              {temp}°F
            </span>
          )}
          {pendingCount > 0 && (
            <span
              className={`w-2 h-2 rounded-full ${syncing ? 'bg-amber-400 animate-pulse' : 'bg-brand-teal'}`}
              aria-label={`${pendingCount} items pending sync${syncing ? ', syncing now' : ''}`}
              title={`${pendingCount} pending sync`}
            />
          )}
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
        {/* Notification signup prompt — only on non-admin pages */}
        {!pathname.startsWith('/admin') && <NotificationSignupPrompt />}
        <main className="min-h-screen">{children}</main>
        <SupportFooter />
      </div>
    </>
  );
}
