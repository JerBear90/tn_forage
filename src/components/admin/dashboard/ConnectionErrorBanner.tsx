'use client';

import { useMemo } from 'react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ConnectionErrorBannerProps {
  /** Whether a connection error is currently active */
  hasConnectionError: boolean;
  /** Whether the dashboard is in degraded mode (3+ consecutive failures) */
  isDegraded: boolean;
  /** ISO timestamp of the last successful data fetch */
  lastUpdated: string | null;
  /** Number of consecutive failures */
  consecutiveFailures: number;
  /** Whether a retry is currently in progress */
  isRetrying: boolean;
  /** Callback to trigger a manual retry */
  onRetry: () => void;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatLastUpdated(isoTimestamp: string | null): string {
  if (!isoTimestamp) return 'Never';

  const now = Date.now();
  const then = new Date(isoTimestamp).getTime();
  const diffMs = now - then;
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);

  if (diffSeconds < 60) return 'Less than a minute ago';
  if (diffMinutes === 1) return '1 minute ago';
  if (diffMinutes < 60) return `${diffMinutes} minutes ago`;
  if (diffHours === 1) return '1 hour ago';
  return `${diffHours} hours ago`;
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function WarningIcon() {
  return (
    <svg
      className="h-5 w-5 shrink-0"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M18.364 5.636a9 9 0 010 12.728M5.636 18.364a9 9 0 010-12.728"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M15.536 8.464a5 5 0 010 7.072M8.464 15.536a5 5 0 010-7.072"
      />
      <circle cx="12" cy="12" r="1.5" fill="currentColor" />
    </svg>
  );
}

function RetryIcon({ spinning }: { spinning: boolean }) {
  return (
    <svg
      className={`h-4 w-4 ${spinning ? 'animate-spin' : ''}`}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
      />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

/**
 * Displays a connection error banner when PocketBase is unreachable.
 *
 * Shows:
 * - Connection error message with "Last updated" indicator
 * - "Degraded mode" message after 3 consecutive failures
 * - Manual retry button
 *
 * Uses brand colors and supports dark mode.
 */
export default function ConnectionErrorBanner({
  hasConnectionError,
  isDegraded,
  lastUpdated,
  consecutiveFailures,
  isRetrying,
  onRetry,
}: ConnectionErrorBannerProps) {
  const lastUpdatedText = useMemo(() => formatLastUpdated(lastUpdated), [lastUpdated]);

  // Don't render if there's no connection error
  if (!hasConnectionError) {
    return null;
  }

  return (
    <div
      role="alert"
      aria-live="polite"
      aria-label="Connection error notification"
      className={`rounded-lg border px-4 py-3 shadow-sm ${
        isDegraded
          ? 'border-red-300 bg-red-50 dark:border-red-700 dark:bg-red-900/20'
          : 'border-yellow-300 bg-yellow-50 dark:border-yellow-700 dark:bg-yellow-900/20'
      }`}
    >
      <div className="flex items-start gap-3">
        {/* Icon */}
        <span
          className={`mt-0.5 ${
            isDegraded
              ? 'text-red-600 dark:text-red-400'
              : 'text-yellow-600 dark:text-yellow-400'
          }`}
        >
          <WarningIcon />
        </span>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Title */}
          <p
            className={`text-sm font-semibold ${
              isDegraded
                ? 'text-red-800 dark:text-red-300'
                : 'text-yellow-800 dark:text-yellow-300'
            }`}
          >
            {isDegraded
              ? 'Connection lost — Degraded mode'
              : 'Connection issue detected'}
          </p>

          {/* Description */}
          <p
            className={`mt-0.5 text-sm ${
              isDegraded
                ? 'text-red-700 dark:text-red-400'
                : 'text-yellow-700 dark:text-yellow-400'
            }`}
          >
            {isDegraded
              ? 'Unable to reach the server after multiple attempts. Showing cached data only.'
              : `Having trouble connecting to the server. Retrying automatically.`}
          </p>

          {/* Last updated indicator */}
          <p
            className={`mt-1 text-xs ${
              isDegraded
                ? 'text-red-600 dark:text-red-500'
                : 'text-yellow-600 dark:text-yellow-500'
            }`}
            aria-label={`Last updated: ${lastUpdatedText}`}
          >
            Last updated: {lastUpdatedText}
            {consecutiveFailures > 1 && (
              <span className="ml-2">
                ({consecutiveFailures} consecutive {consecutiveFailures === 1 ? 'failure' : 'failures'})
              </span>
            )}
          </p>
        </div>

        {/* Retry button */}
        <button
          type="button"
          onClick={onRetry}
          disabled={isRetrying}
          aria-label="Retry connection"
          className={`inline-flex items-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium min-h-[44px] min-w-[44px] transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed ${
            isDegraded
              ? 'text-red-700 bg-red-100 hover:bg-red-200 focus:ring-red-500 dark:text-red-300 dark:bg-red-800/40 dark:hover:bg-red-800/60 dark:focus:ring-red-400'
              : 'text-yellow-700 bg-yellow-100 hover:bg-yellow-200 focus:ring-yellow-500 dark:text-yellow-300 dark:bg-yellow-800/40 dark:hover:bg-yellow-800/60 dark:focus:ring-yellow-400'
          }`}
        >
          <RetryIcon spinning={isRetrying} />
          <span>{isRetrying ? 'Retrying…' : 'Retry'}</span>
        </button>
      </div>
    </div>
  );
}
