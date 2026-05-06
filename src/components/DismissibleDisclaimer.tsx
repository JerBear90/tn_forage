'use client';

/**
 * ForageWise — DismissibleDisclaimer Component
 *
 * A safety disclaimer banner that can be dismissed by the user.
 * Once the global safety disclaimer has been acknowledged (via the
 * AppShell SafetyDisclaimer), all page-level disclaimers auto-hide.
 * Users can also dismiss individual page disclaimers independently.
 *
 * Persists acknowledgment in localStorage.
 */

import { useSafetyDismissed } from '@/hooks/useSafetyDismissed';

export interface DismissibleDisclaimerProps {
  /** Unique localStorage key for this disclaimer instance */
  storageKey: string;
  /** The disclaimer message content */
  children: React.ReactNode;
  /** Visual variant */
  variant?: 'amber' | 'earth';
}

export default function DismissibleDisclaimer({
  storageKey,
  children,
  variant = 'amber',
}: DismissibleDisclaimerProps) {
  const { dismissed, dismiss } = useSafetyDismissed(storageKey);

  // While reading localStorage, render nothing to avoid layout shift
  if (dismissed === null || dismissed === true) {
    return null;
  }

  const isAmber = variant === 'amber';

  return (
    <div
      className={`rounded-lg border p-4 mb-4 text-sm ${
        isAmber
          ? 'border-amber-300 bg-amber-50 dark:bg-amber-900/20 dark:border-amber-700 text-amber-800 dark:text-amber-300'
          : 'border-brand-earth/20 bg-brand-earth/10 text-brand-earth'
      }`}
      role="alert"
    >
      <div className="flex items-start gap-2">
        <svg
          aria-hidden="true"
          className={`w-5 h-5 shrink-0 mt-0.5 ${
            isAmber
              ? 'text-amber-600 dark:text-amber-400'
              : 'text-brand-earth'
          }`}
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
          {children}
          <button
            type="button"
            onClick={dismiss}
            className={`mt-3 inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 ${
              isAmber
                ? 'border-amber-400 dark:border-amber-600 bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300 hover:bg-amber-200 dark:hover:bg-amber-900/60 focus-visible:outline-amber-500'
                : 'border-brand-earth/30 bg-brand-earth/10 text-brand-earth hover:bg-brand-earth/20 focus-visible:outline-brand-earth'
            }`}
          >
            I acknowledge — dismiss
          </button>
        </div>
      </div>
    </div>
  );
}
