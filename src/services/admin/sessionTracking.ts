'use client';

/**
 * ForageWise — Session Tracking Service
 *
 * Tracks user sessions based on a 30-minute inactivity timeout.
 * When a session ends (timeout fires or tab closes), writes a session record
 * to the PocketBase `analytics_sessions` collection.
 *
 * - Uses the same session ID from sessionStorage as page view tracking
 * - Respects analytics opt-out (does not write session records for opted-out users)
 * - Computes duration (seconds) and page count per session
 *
 * Requirements: 4.1, 4.4
 */

import { pb, getCurrentUser, isAuthenticated } from '@/auth/authService';
import { getRecord } from '@/offline/db';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** 30 minutes in milliseconds */
const INACTIVITY_TIMEOUT_MS = 30 * 60 * 1000;

/** Session storage key (shared with eventCapture.ts) */
const SESSION_STORAGE_KEY = 'fw_analytics_session_id';

// ---------------------------------------------------------------------------
// Internal State
// ---------------------------------------------------------------------------

let sessionStartTime: string | null = null;
let lastActivityTime: string | null = null;
let pageCount = 0;
let inactivityTimer: ReturnType<typeof setTimeout> | null = null;
let initialized = false;

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
// Session ID
// ---------------------------------------------------------------------------

/**
 * Get the current session ID from sessionStorage.
 * Returns null if sessionStorage is unavailable or no session exists.
 */
function getSessionId(): string | null {
  if (typeof sessionStorage === 'undefined') {
    return null;
  }
  return sessionStorage.getItem(SESSION_STORAGE_KEY);
}

// ---------------------------------------------------------------------------
// Session Flush
// ---------------------------------------------------------------------------

/**
 * Write the current session record to PocketBase and reset state.
 * Called when the inactivity timeout fires or on beforeunload.
 */
async function flushSession(): Promise<void> {
  // Clear the timer first
  if (inactivityTimer !== null) {
    clearTimeout(inactivityTimer);
    inactivityTimer = null;
  }

  // Nothing to flush if no session started
  if (!sessionStartTime || !lastActivityTime || pageCount === 0) {
    resetState();
    return;
  }

  // Check opt-out before writing
  const optedOut = await isAnalyticsOptedOut();
  if (optedOut) {
    resetState();
    return;
  }

  const sessionId = getSessionId();
  if (!sessionId) {
    resetState();
    return;
  }

  // Compute duration in seconds
  const startMs = new Date(sessionStartTime).getTime();
  const endMs = new Date(lastActivityTime).getTime();
  const duration = Math.max(0, Math.round((endMs - startMs) / 1000));

  // Build the session record
  const data: Record<string, unknown> = {
    sessionId,
    startedAt: sessionStartTime,
    endedAt: lastActivityTime,
    duration,
    pageCount,
  };

  // Include userId only if authenticated
  if (isAuthenticated()) {
    const user = getCurrentUser();
    if (user?.id) {
      data.userId = user.id;
    }
  }

  try {
    await pb.collection('analytics_sessions').create(data);
  } catch {
    // Silently fail — analytics should never break the app
  }

  resetState();
}

/**
 * Reset all session tracking state after a session is written.
 */
function resetState(): void {
  sessionStartTime = null;
  lastActivityTime = null;
  pageCount = 0;
}

// ---------------------------------------------------------------------------
// Inactivity Timer
// ---------------------------------------------------------------------------

/**
 * Reset the inactivity timer. When it fires, the session is considered ended.
 */
function resetInactivityTimer(): void {
  if (inactivityTimer !== null) {
    clearTimeout(inactivityTimer);
  }
  inactivityTimer = setTimeout(() => {
    flushSession();
  }, INACTIVITY_TIMEOUT_MS);
}

// ---------------------------------------------------------------------------
// beforeunload Handler
// ---------------------------------------------------------------------------

/**
 * Handle tab close / navigation away — flush the session synchronously.
 * Uses sendBeacon for reliability when the page is unloading.
 */
function handleBeforeUnload(): void {
  if (!sessionStartTime || !lastActivityTime || pageCount === 0) {
    return;
  }

  const sessionId = getSessionId();
  if (!sessionId) {
    return;
  }

  // Compute duration
  const startMs = new Date(sessionStartTime).getTime();
  const endMs = new Date(lastActivityTime).getTime();
  const duration = Math.max(0, Math.round((endMs - startMs) / 1000));

  const data: Record<string, unknown> = {
    sessionId,
    startedAt: sessionStartTime,
    endedAt: lastActivityTime,
    duration,
    pageCount,
  };

  if (isAuthenticated()) {
    const user = getCurrentUser();
    if (user?.id) {
      data.userId = user.id;
    }
  }

  // Use sendBeacon for reliable delivery during page unload
  const url = `${pb.baseURL}/api/collections/analytics_sessions/records`;
  try {
    const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
    navigator.sendBeacon(url, blob);
  } catch {
    // Last resort — fire and forget fetch
    try {
      fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
        keepalive: true,
      });
    } catch {
      // Silently fail
    }
  }

  resetState();
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Initialize session tracking.
 * Sets up the beforeunload listener for flushing sessions on tab close.
 * Should be called once on app startup.
 */
export function initSessionTracking(): void {
  if (initialized) return;
  if (typeof window === 'undefined') return;

  initialized = true;
  window.addEventListener('beforeunload', handleBeforeUnload);
}

/**
 * Record activity (called on each page view / route change).
 * Resets the inactivity timer and updates session state.
 *
 * - On first call: sets session start time
 * - On every call: updates last activity time, increments page count, resets timer
 */
export function recordActivity(): void {
  if (typeof window === 'undefined') return;

  const now = new Date().toISOString();

  // First activity in this session
  if (!sessionStartTime) {
    sessionStartTime = now;
  }

  lastActivityTime = now;
  pageCount += 1;

  // Reset the 30-minute inactivity timer
  resetInactivityTimer();
}

/**
 * Clean up session tracking (remove event listeners, clear timers).
 * Useful for testing or when the app unmounts.
 */
export function cleanupSessionTracking(): void {
  if (typeof window === 'undefined') return;

  if (inactivityTimer !== null) {
    clearTimeout(inactivityTimer);
    inactivityTimer = null;
  }

  window.removeEventListener('beforeunload', handleBeforeUnload);
  initialized = false;
  resetState();
}
