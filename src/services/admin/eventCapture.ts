'use client';

/**
 * ForageWise — Admin Analytics Event Capture
 *
 * Client-side event capture for page views. Records page view events
 * to the PocketBase `analytics_page_views` collection.
 *
 * - Generates a client-side session ID (UUID v4) stored in sessionStorage
 * - Respects the user's analytics opt-out setting from IndexedDB
 * - Includes userId only if user is authenticated AND not opted out
 *
 * Requirements: 2.1, 12.1
 */

import { pb, getCurrentUser, isAuthenticated } from '@/auth/authService';
import { getRecord } from '@/offline/db';

// ---------------------------------------------------------------------------
// Session ID Management
// ---------------------------------------------------------------------------

const SESSION_STORAGE_KEY = 'fw_analytics_session_id';

/**
 * Get or create a session ID for the current browser session.
 * Uses crypto.randomUUID() for UUID v4 generation.
 * Stored in sessionStorage so it persists for the tab lifetime.
 */
function getSessionId(): string {
  if (typeof sessionStorage === 'undefined') {
    return crypto.randomUUID();
  }

  let sessionId = sessionStorage.getItem(SESSION_STORAGE_KEY);
  if (!sessionId) {
    sessionId = crypto.randomUUID();
    sessionStorage.setItem(SESSION_STORAGE_KEY, sessionId);
  }
  return sessionId;
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
// Feature Usage Keys
// ---------------------------------------------------------------------------

/**
 * Valid feature keys for usage event tracking.
 * These correspond to the main feature areas of ForageWise.
 */
export const FEATURE_KEYS = [
  'field-guide',
  'map',
  'trips',
  'community',
  'identification',
  'journal',
] as const;

export type FeatureKey = (typeof FEATURE_KEYS)[number];

// ---------------------------------------------------------------------------
// Page View Recording
// ---------------------------------------------------------------------------

/**
 * Record a page view event to the PocketBase `analytics_page_views` collection.
 *
 * - Checks if user has opted out of analytics; if so, returns early
 * - Gets or creates a session ID from sessionStorage
 * - Creates a record in PocketBase with path, timestamp, sessionId, and optionally userId
 *
 * @param path - The page path being viewed (e.g., `/field-guide/chanterelle`)
 */
export async function recordPageView(path: string): Promise<void> {
  try {
    // Check opt-out status
    const optedOut = await isAnalyticsOptedOut();
    if (optedOut) {
      return;
    }

    const sessionId = getSessionId();

    // Build the record data
    const data: Record<string, unknown> = {
      path,
      timestamp: new Date().toISOString(),
      sessionId,
    };

    // Include userId only if authenticated and not opted out
    if (isAuthenticated()) {
      const user = getCurrentUser();
      if (user?.id) {
        data.userId = user.id;
      }
    }

    // Write to PocketBase — fire and forget, analytics should never break the app
    await pb.collection('analytics_page_views').create(data);
  } catch {
    // Silently fail — analytics should never break the app
  }
}

// ---------------------------------------------------------------------------
// Feature Usage Event Recording
// ---------------------------------------------------------------------------

/**
 * Record a feature usage event to the PocketBase `analytics_usage_events` collection.
 *
 * - Checks if user has opted out of analytics; if so, returns early
 * - Gets or creates a session ID from sessionStorage
 * - Creates a record in PocketBase with featureKey, timestamp, sessionId, and optionally userId
 *
 * @param featureKey - The feature being used (e.g., `field-guide`, `map`, `trips`)
 *
 * Requirements: 7.1, 12.1
 */
export async function recordUsageEvent(featureKey: string): Promise<void> {
  try {
    // Check opt-out status
    const optedOut = await isAnalyticsOptedOut();
    if (optedOut) {
      return;
    }

    const sessionId = getSessionId();

    // Build the record data
    const data: Record<string, unknown> = {
      featureKey,
      timestamp: new Date().toISOString(),
      sessionId,
    };

    // Include userId only if authenticated
    if (isAuthenticated()) {
      const user = getCurrentUser();
      if (user?.id) {
        data.userId = user.id;
      }
    }

    // Write to PocketBase — fire and forget, analytics should never break the app
    await pb.collection('analytics_usage_events').create(data);
  } catch {
    // Silently fail — analytics should never break the app
  }
}

// ---------------------------------------------------------------------------
// Search Query Event Recording
// ---------------------------------------------------------------------------

/**
 * Record a search query event to the PocketBase `analytics_search_queries` collection.
 *
 * - Checks if user has opted out of analytics; if so, returns early
 * - Creates a record in PocketBase with term, timestamp, resultsCount, clickedResult, and optionally userId
 *
 * @param term - The search query text entered by the user
 * @param resultsCount - Number of results returned for the search
 * @param clickedResult - Whether the user clicked on a result
 *
 * Requirements: 19.1
 */
export async function recordSearchQuery(
  term: string,
  resultsCount: number,
  clickedResult: boolean
): Promise<void> {
  try {
    // Check opt-out status
    const optedOut = await isAnalyticsOptedOut();
    if (optedOut) {
      return;
    }

    // Build the record data
    const data: Record<string, unknown> = {
      term,
      timestamp: new Date().toISOString(),
      resultsCount,
      clickedResult,
    };

    // Include userId only if authenticated
    if (isAuthenticated()) {
      const user = getCurrentUser();
      if (user?.id) {
        data.userId = user.id;
      }
    }

    // Write to PocketBase — fire and forget, analytics should never break the app
    await pb.collection('analytics_search_queries').create(data);
  } catch {
    // Silently fail — analytics should never break the app
  }
}
