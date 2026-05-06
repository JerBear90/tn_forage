"use client";

import { useEffect, useState, useCallback } from "react";
import { usePathname } from "next/navigation";

const STORAGE_KEY = "foragewise-intro-seen";
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
      aria-label="ForageWise welcome animation"
    >
      {/* Animated logo */}
      <div className="logo-intro__logo" aria-hidden="true">
        <img
          src="/branding/mush_logo.png"
          width={120}
          height={120}
          alt="ForageWise logo"
          className="logo-intro__icon"
        />

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
        ForageWise
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
