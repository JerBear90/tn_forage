"use client";

import { useEffect, useState, useCallback } from "react";
import { usePathname } from "next/navigation";

const STORAGE_KEY = "forageflow-intro-seen";
const ANIMATION_DURATION = 2500; // 2.5 seconds total
const FADE_OUT_DURATION = 400; // fade-out transition time

/** Auth pages where the intro should never show. */
const AUTH_PATHS = ["/login", "/signup"];

/**
 * Safe localStorage helpers — return gracefully in private browsing
 * or environments where localStorage is unavailable.
 */
function getIntroSeen(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) === "true";
  } catch {
    return false;
  }
}

function setIntroSeen(): void {
  try {
    localStorage.setItem(STORAGE_KEY, "true");
  } catch {
    // Private browsing or quota exceeded — silently ignore
  }
}

/**
 * Animated logo intro overlay.
 *
 * Shown once on first visit, then cached in localStorage so it never
 * appears again. The animation runs for ~2.5 seconds and auto-fades out.
 * A "Skip" button lets users dismiss it immediately.
 *
 * This is separate from PwaSplash — PwaSplash bridges hydration,
 * while LogoIntro is a branded first-visit animation.
 */
export default function LogoIntro() {
  const pathname = usePathname();

  // Start with null to avoid hydration mismatch (server doesn't have localStorage)
  const [shouldShow, setShouldShow] = useState<boolean | null>(null);
  const [fadingOut, setFadingOut] = useState(false);
  const [removed, setRemoved] = useState(false);

  // Determine on mount whether to show the intro
  useEffect(() => {
    if (AUTH_PATHS.includes(pathname)) {
      setShouldShow(false);
      return;
    }
    setShouldShow(!getIntroSeen());
  }, [pathname]);

  const dismiss = useCallback(() => {
    setFadingOut((prev) => {
      if (prev) return prev; // already fading
      setIntroSeen();
      setTimeout(() => setRemoved(true), FADE_OUT_DURATION);
      return true;
    });
  }, []);

  // Auto-dismiss after animation duration
  useEffect(() => {
    if (shouldShow !== true) return;

    const timer = setTimeout(() => {
      dismiss();
    }, ANIMATION_DURATION);

    return () => clearTimeout(timer);
  }, [shouldShow, dismiss]);

  // Don't render until we've checked localStorage (avoids flash)
  if (shouldShow === null || shouldShow === false || removed) return null;

  return (
    <div
      className={`logo-intro ${fadingOut ? "logo-intro--hidden" : ""}`}
      role="dialog"
      aria-label="ForageFlow welcome animation"
    >
      {/* Animated logo */}
      <div className="logo-intro__logo" aria-hidden="true">
        <svg
          width="120"
          height="120"
          viewBox="0 0 512 512"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="logo-intro__icon"
        >
          <rect width="512" height="512" rx="112" fill="#0F766E" />
          <path
            d="M256 70C185 70 128 122 128 186c0 18 15 33 33 33h190c18 0 33-15 33-33C384 122 327 70 256 70Z"
            fill="#F5F0DF"
          />
          <path
            d="M214 219h84l22 163c4 29-19 55-48 55h-32c-29 0-52-26-48-55l22-163Z"
            fill="#F5F0DF"
          />
          <path
            d="M256 284c-35 0-63 28-63 63 0 58 63 101 63 101s63-43 63-101c0-35-28-63-63-63Zm0 88a25 25 0 1 1 0-50 25 25 0 0 1 0 50Z"
            fill="#14532D"
          />
          <path
            d="M342 112c31 4 57 28 66 59 30-23 50-56 57-94-44 2-85 14-123 35Z"
            fill="#4D7C0F"
          />
          <circle cx="190" cy="160" r="12" fill="#0F766E" />
          <circle cx="249" cy="137" r="10" fill="#0F766E" />
          <circle cx="314" cy="164" r="12" fill="#0F766E" />
        </svg>

        {/* Subtle leaf accent */}
        <svg
          className="logo-intro__leaf"
          width="32"
          height="32"
          viewBox="0 0 32 32"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <path
            d="M8 28C8 28 4 18 12 10C20 2 28 4 28 4C28 4 30 14 22 22C14 30 8 28 8 28Z"
            fill="#4D7C0F"
            opacity="0.6"
          />
          <path
            d="M8 28C12 22 18 14 28 4"
            stroke="#F5F0DF"
            strokeWidth="1.5"
            strokeLinecap="round"
            opacity="0.4"
          />
        </svg>
      </div>

      {/* Brand name — fades in after a short delay */}
      <p className="logo-intro__title" aria-hidden="true">
        ForageFlow
      </p>

      {/* Tagline */}
      <p className="logo-intro__tagline" aria-hidden="true">
        Discover Tennessee&apos;s wild side
      </p>

      {/* Skip button */}
      <button
        type="button"
        className="logo-intro__skip"
        onClick={dismiss}
        aria-label="Skip intro animation"
      >
        Skip
      </button>
    </div>
  );
}
