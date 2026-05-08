"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import OfflineBadge from "@/components/OfflineBadge";
import SafetyDisclaimer from "@/components/SafetyDisclaimer";
import SupportFooter from "@/components/SupportFooter";
import LocationSetupPrompt from "@/components/LocationSetupPrompt";
import WeatherPanel from "@/components/WeatherPanel";
import GuidedIntro from "@/components/GuidedIntro";
import ShareQR from "@/components/ShareQR";
import { useWeatherTemp } from "@/hooks/useWeatherTemp";
import { useAutoSync } from "@/hooks/useAutoSync";
import { usePageViewTracking } from "@/hooks/usePageViewTracking";
import { useErrorCapture } from "@/hooks/useErrorCapture";
import { useSessionTracking } from "@/hooks/useSessionTracking";
import NotificationSignupPrompt from "@/components/NotificationSignupPrompt";
import DataLoader from "@/components/DataLoader";
import { resolveAvatar } from "@/utils/avatarResolver";
import FuzzySearchOverlay from "@/components/FuzzySearchOverlay";

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
  const [weatherPanelOpen, setWeatherPanelOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  // Track page views on route changes (Requirements: 2.1, 12.1)
  usePageViewTracking();

  // Initialize global error capture (Requirements: 5.1, 5.7, 12.3)
  useErrorCapture();

  // Track session duration and page count (Requirements: 4.1, 4.4)
  useSessionTracking();

  // Load user avatar via avatarResolver on mount
  useEffect(() => {
    let cancelled = false;
    async function loadAvatar() {
      try {
        const { pb } = await import('@/auth/authService');
        const userId = pb.authStore.record?.id;
        if (!userId) return;
        const result = await resolveAvatar(userId);
        if (!cancelled) {
          setAvatarUrl(result.url);
        }
      } catch {
        // Avatar resolution failed — use default icon
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

        {/* Right: Search + Weather + Offline badge + Profile */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setSearchOpen(true)}
            aria-label="Search"
            className="shrink-0 flex items-center justify-center min-h-[44px] min-w-[44px] h-7 w-7 rounded-full text-brand-charcoal/60 dark:text-brand-sand/60 hover:bg-brand-teal/10 hover:text-brand-teal transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-teal"
          >
            <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
            </svg>
          </button>
          <button
            type="button"
            onClick={() => setWeatherPanelOpen(true)}
            className="text-xs font-medium text-brand-charcoal/70 dark:text-brand-sand/70 tabular-nums flex items-center gap-0.5 rounded-md px-1.5 py-1 hover:bg-brand-teal/10 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-teal"
            aria-label={temp !== null ? `Weather: ${temp}°F. Tap for details.` : 'Weather and online features'}
          >
            {temp !== null ? (
              <>
                {icon && <span aria-hidden="true">{icon}</span>}
                {temp}°F
              </>
            ) : (
              <span aria-hidden="true">🌤️</span>
            )}
          </button>
          {pendingCount > 0 && (
            <span
              className={`w-2 h-2 rounded-full ${syncing ? 'bg-amber-400 animate-pulse' : 'bg-brand-teal'}`}
              aria-label={`${pendingCount} items pending sync${syncing ? ', syncing now' : ''}`}
              title={`${pendingCount} pending sync`}
            />
          )}
          <OfflineBadge />
          {/* Support email link */}
          <a
            href="mailto:studio7inquiry@gmail.com?subject=ForageWise%20Support"
            aria-label="Contact support"
            className="shrink-0 flex items-center justify-center h-7 w-7 rounded-full text-brand-charcoal/50 dark:text-brand-sand/50 hover:bg-brand-teal/10 hover:text-brand-teal transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z" />
            </svg>
          </a>
          {/* Share app QR */}
          <ShareQR variant="icon" />
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
        <main className="min-h-screen"><DataLoader>{children}</DataLoader></main>
        <SupportFooter />
        <LocationSetupPrompt />
        <WeatherPanel isOpen={weatherPanelOpen} onClose={() => setWeatherPanelOpen(false)} />
        <GuidedIntro />
        <FuzzySearchOverlay isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
      </div>
    </>
  );
}
