'use client';

/**
 * ForageWise — Admin Analytics Error Capture
 *
 * Client-side error capture service that records unhandled JavaScript errors
 * and unhandled promise rejections to the PocketBase `analytics_errors` collection.
 *
 * Features:
 * - Global `window.onerror` and `window.onunhandledrejection` handlers
 * - Rate limiting: max 10 errors per minute to prevent flooding PocketBase
 * - Stack trace truncation to 5000 characters
 * - Skips errors originating from `/admin/dashboard` paths (avoid circular reporting)
 * - Omits userId for opted-out users while still recording the error
 * - Includes userId for opted-in authenticated users
 *
 * Requirements: 5.1, 5.7, 12.3
 */

import { pb, getCurrentUser, isAuthenticated } from '@/auth/authService';
import { getRecord } from '@/offline/db';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Maximum number of errors recorded per minute */
const MAX_ERRORS_PER_MINUTE = 10;

/** Maximum stack trace length in characters */
const MAX_STACK_LENGTH = 5000;

/** Admin dashboard path prefix — errors from here are skipped to avoid circular reporting */
const ADMIN_DASHBOARD_PATH = '/admin/dashboard';

// ---------------------------------------------------------------------------
// Rate Limiting State
// ---------------------------------------------------------------------------

/** Timestamps of errors recorded in the current minute window */
let errorTimestamps: number[] = [];

/**
 * Check if we can record another error within the rate limit.
 * Cleans up timestamps older than 1 minute.
 * @returns true if under the rate limit
 */
function isWithinRateLimit(): boolean {
  const now = Date.now();
  const oneMinuteAgo = now - 60_000;

  // Remove timestamps older than 1 minute
  errorTimestamps = errorTimestamps.filter((ts) => ts > oneMinuteAgo);

  if (errorTimestamps.length >= MAX_ERRORS_PER_MINUTE) {
    return false;
  }

  errorTimestamps.push(now);
  return true;
}

// ---------------------------------------------------------------------------
// Opt-Out Check
// ---------------------------------------------------------------------------

/**
 * Check if the user has opted out of analytics.
 * Reads from the IndexedDB settings store.
 */
async function isAnalyticsOptedOut(): Promise<boolean> {
  try {
    const settings = await getRecord('settings', 'app-settings');
    if (settings && typeof settings === 'object' && 'analyticsOptOut' in settings) {
      return !!(settings as { analyticsOptOut?: boolean }).analyticsOptOut;
    }
  } catch {
    // Default to not opted out if settings can't be read
  }
  return false;
}

// ---------------------------------------------------------------------------
// Stack Trace Truncation
// ---------------------------------------------------------------------------

/**
 * Truncate a stack trace to the maximum allowed length.
 * @param stack - The raw stack trace string
 * @returns Truncated stack trace (max 5000 chars)
 */
function truncateStack(stack: string | undefined | null): string {
  if (!stack) return '';
  if (stack.length <= MAX_STACK_LENGTH) return stack;
  return stack.slice(0, MAX_STACK_LENGTH);
}

// ---------------------------------------------------------------------------
// Circular Reporting Check
// ---------------------------------------------------------------------------

/**
 * Check if the error originates from the admin dashboard.
 * Errors from `/admin/dashboard` paths are skipped to avoid circular reporting.
 * @param pageUrl - The URL where the error occurred
 * @returns true if the error is from the admin dashboard
 */
function isFromAdminDashboard(pageUrl: string): boolean {
  try {
    const url = new URL(pageUrl, window.location.origin);
    return url.pathname.startsWith(ADMIN_DASHBOARD_PATH);
  } catch {
    // If URL parsing fails, check as a plain string
    return pageUrl.includes(ADMIN_DASHBOARD_PATH);
  }
}

// ---------------------------------------------------------------------------
// Error Recording
// ---------------------------------------------------------------------------

/**
 * Record an error to the PocketBase `analytics_errors` collection.
 *
 * - Skips errors from admin dashboard paths (circular reporting prevention)
 * - Applies rate limiting (max 10 per minute)
 * - Truncates stack traces to 5000 characters
 * - For opted-out users: records the error but omits userId
 * - For opted-in authenticated users: includes userId
 *
 * @param message - The error message
 * @param stack - The stack trace (will be truncated to 5000 chars)
 * @param pageUrl - The URL where the error occurred
 */
export async function recordError(
  message: string,
  stack: string | undefined | null,
  pageUrl: string,
): Promise<void> {
  try {
    // Skip errors from admin dashboard to avoid circular reporting
    if (isFromAdminDashboard(pageUrl)) {
      return;
    }

    // Check rate limit
    if (!isWithinRateLimit()) {
      return;
    }

    // Check opt-out status
    const optedOut = await isAnalyticsOptedOut();

    // Build the record data
    const data: Record<string, unknown> = {
      message: message || 'Unknown error',
      stack: truncateStack(stack),
      pageUrl,
      timestamp: new Date().toISOString(),
      browser: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
      resolved: false,
    };

    // Include userId only if authenticated AND not opted out
    if (!optedOut && isAuthenticated()) {
      const user = getCurrentUser();
      if (user?.id) {
        data.userId = user.id;
      }
    }

    // Write to PocketBase — fire and forget, error capture should never break the app
    await pb.collection('analytics_errors').create(data);
  } catch {
    // Silently fail — error capture should never break the app
  }
}

// ---------------------------------------------------------------------------
// Global Error Handlers
// ---------------------------------------------------------------------------

/** Track whether error capture has been initialized */
let initialized = false;

/**
 * Initialize global error capture handlers.
 *
 * Sets up `window.onerror` and `window.onunhandledrejection` to capture
 * unhandled errors and promise rejections.
 *
 * Safe to call multiple times — only initializes once.
 */
export function initErrorCapture(): void {
  if (typeof window === 'undefined') return;
  if (initialized) return;

  initialized = true;

  // Global error handler for uncaught exceptions
  window.onerror = (
    messageOrEvent: string | Event,
    source?: string,
    lineno?: number,
    colno?: number,
    error?: Error,
  ) => {
    const message =
      typeof messageOrEvent === 'string'
        ? messageOrEvent
        : messageOrEvent?.type ?? 'Unknown error';

    const stack =
      error?.stack ??
      (source ? `at ${source}:${lineno ?? 0}:${colno ?? 0}` : undefined);

    const pageUrl = window.location.href;

    // Fire and forget — don't await in the error handler
    recordError(message, stack, pageUrl);
  };

  // Global handler for unhandled promise rejections
  window.onunhandledrejection = (event: PromiseRejectionEvent) => {
    const reason = event.reason;

    let message: string;
    let stack: string | undefined;

    if (reason instanceof Error) {
      message = reason.message;
      stack = reason.stack;
    } else if (typeof reason === 'string') {
      message = reason;
    } else {
      message = 'Unhandled promise rejection';
      try {
        message = JSON.stringify(reason);
      } catch {
        // Keep the default message
      }
    }

    const pageUrl = window.location.href;

    // Fire and forget — don't await in the rejection handler
    recordError(message, stack, pageUrl);
  };
}

// ---------------------------------------------------------------------------
// Testing Helpers (exported for unit tests only)
// ---------------------------------------------------------------------------

/**
 * Reset internal state for testing. Clears rate limit timestamps and
 * resets the initialized flag.
 * @internal
 */
export function _resetForTesting(): void {
  errorTimestamps = [];
  initialized = false;
}
