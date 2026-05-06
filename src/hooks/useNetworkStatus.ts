'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface NetworkStatus {
  /** Whether the dashboard is in degraded mode (3+ consecutive failures) */
  isDegraded: boolean;
  /** Number of consecutive fetch failures */
  consecutiveFailures: number;
  /** ISO timestamp of the last successful data fetch, or null if never fetched */
  lastUpdated: string | null;
  /** Whether a connection error is currently active (at least 1 failure) */
  hasConnectionError: boolean;
  /** Current polling interval in ms (may be increased due to rate limiting) */
  pollingIntervalMs: number;
  /** Whether the hook is currently retrying */
  isRetrying: boolean;
  /** Manually trigger a retry */
  retryNow: () => void;
  /** Report a successful fetch (resets failure count) */
  reportSuccess: () => void;
  /** Report a failed fetch with optional HTTP status code */
  reportFailure: (statusCode?: number) => void;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const DEFAULT_POLLING_INTERVAL_MS = 30_000; // 30 seconds
const RATE_LIMITED_POLLING_INTERVAL_MS = 60_000; // 60 seconds
const DEGRADED_THRESHOLD = 3;

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

/**
 * Tracks network connectivity status for the admin dashboard.
 *
 * Provides:
 * - Consecutive failure count tracking
 * - Degraded mode detection (after 3 consecutive failures)
 * - Last updated timestamp
 * - Manual retry trigger
 * - HTTP status code handling (401/403, 404, 429, 500)
 *
 * Usage:
 * ```ts
 * const network = useNetworkStatus();
 * // After a successful fetch:
 * network.reportSuccess();
 * // After a failed fetch:
 * network.reportFailure(statusCode);
 * ```
 */
export function useNetworkStatus(): NetworkStatus {
  const [consecutiveFailures, setConsecutiveFailures] = useState(0);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [pollingIntervalMs, setPollingIntervalMs] = useState(DEFAULT_POLLING_INTERVAL_MS);
  const [isRetrying, setIsRetrying] = useState(false);

  // Use ref for retry callbacks to avoid stale closures
  const retryCallbacksRef = useRef<Array<() => void>>([]);

  const isDegraded = consecutiveFailures >= DEGRADED_THRESHOLD;
  const hasConnectionError = consecutiveFailures > 0;

  const reportSuccess = useCallback(() => {
    setConsecutiveFailures(0);
    setLastUpdated(new Date().toISOString());
    setPollingIntervalMs(DEFAULT_POLLING_INTERVAL_MS);
    setIsRetrying(false);
  }, []);

  const reportFailure = useCallback((statusCode?: number) => {
    setConsecutiveFailures((prev) => prev + 1);
    setIsRetrying(false);

    // Handle specific HTTP status codes
    if (statusCode === 429) {
      // Rate limited — back off to 60 seconds
      setPollingIntervalMs(RATE_LIMITED_POLLING_INTERVAL_MS);
    }

    // 401/403 handling is done at the component level (redirect to login)
    // 404 handling is done at the widget level (show no data state)
    // 500 handling is done at the widget level (show error with retry)
  }, []);

  const retryNow = useCallback(() => {
    setIsRetrying(true);
    // Trigger all registered retry callbacks
    retryCallbacksRef.current.forEach((cb) => cb());
  }, []);

  return {
    isDegraded,
    consecutiveFailures,
    lastUpdated,
    hasConnectionError,
    pollingIntervalMs,
    isRetrying,
    retryNow,
    reportSuccess,
    reportFailure,
  };
}
