"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const STORAGE_KEY = "foragewise-safety-dismissed";

/**
 * Global safety disclaimer banner shown on first use.
 * Dismissible — once acknowledged, the flag is cached in localStorage
 * so the banner does not reappear on subsequent visits.
 *
 * Handles SSR by deferring localStorage reads to a useEffect.
 */
export default function SafetyDisclaimer() {
  // Start with `null` (unknown) to avoid flash during hydration.
  const [dismissed, setDismissed] = useState<boolean | null>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  /* Read localStorage only on the client after mount. */
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      setDismissed(stored === "true");
    } catch {
      // localStorage unavailable (e.g. private browsing quota) — show banner.
      setDismissed(false);
    }
  }, []);

  /* Focus the acknowledge button when the banner first appears. */
  useEffect(() => {
    if (dismissed === false && buttonRef.current) {
      buttonRef.current.focus();
    }
  }, [dismissed]);

  const handleDismiss = useCallback(() => {
    try {
      localStorage.setItem(STORAGE_KEY, "true");
    } catch {
      // Silently ignore — banner won't persist but user can still dismiss.
    }
    setDismissed(true);
  }, []);

  // While we haven't read localStorage yet, render nothing to avoid layout shift.
  if (dismissed === null || dismissed === true) {
    return null;
  }

  return (
    <div
      role="alert"
      className="mx-3 mt-3 mb-1 rounded-lg border border-brand-earth/40 bg-amber-50 dark:bg-amber-950/40 dark:border-amber-700/50 p-4 shadow-sm"
    >
      {/* Warning icon + heading */}
      <div className="flex items-start gap-3">
        <svg
          aria-hidden="true"
          className="mt-0.5 h-5 w-5 flex-shrink-0 text-brand-earth dark:text-amber-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"
          />
        </svg>

        <div className="flex-1">
          <h2 className="text-sm font-semibold text-brand-earth dark:text-amber-300">
            Important Safety Notice
          </h2>
          <p className="mt-1.5 text-sm leading-relaxed text-brand-charcoal/85 dark:text-brand-sand/85">
            ForageWise provides identification assistance only. Species results
            are <strong>possible matches</strong>, not confirmations. Always{" "}
            <strong>verify with a qualified expert before consuming</strong> any
            wild mushroom or plant.
          </p>
        </div>
      </div>

      {/* Acknowledge button */}
      <div className="mt-3 flex justify-end">
        <button
          ref={buttonRef}
          type="button"
          onClick={handleDismiss}
          className="rounded-md bg-brand-earth px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-brand-earth/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-earth active:bg-brand-earth/80"
        >
          I Understand
        </button>
      </div>
    </div>
  );
}
