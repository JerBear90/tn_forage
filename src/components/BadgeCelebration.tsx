"use client";

/**
 * ForageWise — Badge Celebration Component
 *
 * Modal overlay that displays when a badge is newly earned.
 * Features animated entrance (scale + fade), large badge icon,
 * congratulatory text, and auto-dismiss after 5 seconds.
 *
 * Accessibility: focus-trapped dismiss button, ARIA live region,
 * keyboard dismissible via Escape key.
 */

import { useEffect, useRef } from "react";
import type { ChallengeBadge } from "@/types";

interface BadgeCelebrationProps {
  badge: ChallengeBadge;
  onDismiss: () => void;
}

export default function BadgeCelebration({
  badge,
  onDismiss,
}: BadgeCelebrationProps) {
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Auto-dismiss after 5 seconds
  useEffect(() => {
    const timer = setTimeout(onDismiss, 5000);
    return () => clearTimeout(timer);
  }, [onDismiss]);

  // Focus the dismiss button on mount
  useEffect(() => {
    buttonRef.current?.focus();
  }, []);

  // Dismiss on Escape key
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        onDismiss();
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onDismiss]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Badge earned celebration"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-brand-charcoal/60 dark:bg-black/70 animate-fade-in"
        onClick={onDismiss}
        aria-hidden="true"
      />

      {/* Celebration card */}
      <div
        className="relative z-10 w-full max-w-sm rounded-2xl bg-white dark:bg-dark-surface border border-brand-teal/20 shadow-2xl p-6 text-center animate-badge-pop"
        role="alert"
        aria-live="assertive"
      >
        {/* Badge icon */}
        <div className="flex items-center justify-center mb-4">
          <span
            className="text-6xl leading-none"
            role="img"
            aria-label={badge.title}
          >
            {badge.icon}
          </span>
        </div>

        {/* Title */}
        <h2 className="font-heading text-xl font-bold text-brand-forest dark:text-brand-moss mb-1">
          Badge Earned!
        </h2>

        {/* Badge name */}
        <p className="text-lg font-semibold text-brand-charcoal dark:text-dark-text mb-2">
          {badge.title}
        </p>

        {/* Description */}
        <p className="text-sm text-brand-charcoal/70 dark:text-dark-text-muted mb-6 leading-relaxed">
          {badge.description}
        </p>

        {/* Dismiss button */}
        <button
          ref={buttonRef}
          onClick={onDismiss}
          className="inline-flex items-center justify-center min-h-[44px] min-w-[44px] px-6 py-3 rounded-lg bg-brand-teal text-white font-medium text-sm transition-colors hover:bg-brand-teal/90 focus:outline-none focus:ring-2 focus:ring-brand-teal focus:ring-offset-2 dark:focus:ring-offset-dark-surface"
          aria-label="Dismiss badge celebration"
        >
          Awesome!
        </button>
      </div>
    </div>
  );
}
