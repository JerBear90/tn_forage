'use client';

import { useCallback, useEffect, useRef } from 'react';
import { putRecord, getAllRecords, deleteRecord, getRecord } from '@/offline/db';
import type { UsageEvent } from '@/types';

const SYNC_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes
const PURGE_AGE_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

/**
 * Generates a simple unique ID for usage events.
 */
function generateEventId(): string {
  return `evt-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

/**
 * Gets or creates a session ID for the current browser session.
 */
function getSessionId(): string {
  const key = 'foragewise_session_id';
  let sessionId = sessionStorage.getItem(key);
  if (!sessionId) {
    sessionId = `sess-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    sessionStorage.setItem(key, sessionId);
  }
  return sessionId;
}

/**
 * Usage analytics hook that logs feature usage events to IndexedDB.
 *
 * - Logs events locally in IndexedDB
 * - Batch syncs every 5 minutes when online
 * - Respects the user's analyticsOptOut setting
 * - Auto-purges events older than 7 days
 *
 * Requirements: 20.1, 20.2, 20.3, 20.4, 20.5, 20.6
 */
export function useUsageAnalytics() {
  const syncTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const optedOutRef = useRef<boolean>(false);

  // Check opt-out status on mount
  useEffect(() => {
    async function checkOptOut() {
      try {
        const settings = await getRecord('settings', 'app-settings');
        if (settings && typeof settings === 'object' && 'analyticsOptOut' in settings) {
          optedOutRef.current = !!(settings as { analyticsOptOut?: boolean }).analyticsOptOut;
        }
      } catch {
        // Default to not opted out
      }
    }
    checkOptOut();
  }, []);

  // Set up periodic sync and purge
  useEffect(() => {
    async function syncAndPurge() {
      if (optedOutRef.current) return;

      try {
        const events = await getAllRecords('usageEvents');
        const now = Date.now();

        // Purge events older than 7 days
        for (const event of events) {
          const eventTime = new Date(event.timestamp).getTime();
          if (now - eventTime > PURGE_AGE_MS) {
            await deleteRecord('usageEvents', event.id);
          }
        }

        // Batch sync when online (placeholder — actual sync endpoint TBD)
        if (navigator.onLine && events.length > 0) {
          // In Phase 3.2, events are stored locally only.
          // Server sync will be implemented when the analytics backend is ready.
        }
      } catch {
        // Silently fail — analytics should never break the app
      }
    }

    syncTimerRef.current = setInterval(syncAndPurge, SYNC_INTERVAL_MS);

    // Run initial purge
    syncAndPurge();

    return () => {
      if (syncTimerRef.current) {
        clearInterval(syncTimerRef.current);
      }
    };
  }, []);

  /**
   * Log a usage event for a specific feature.
   */
  const logEvent = useCallback(async (featureKey: string, userId?: string) => {
    if (optedOutRef.current) return;

    try {
      const event: UsageEvent = {
        id: generateEventId(),
        featureKey,
        timestamp: new Date().toISOString(),
        userId,
        sessionId: getSessionId(),
      };

      await putRecord('usageEvents', event);
    } catch {
      // Silently fail — analytics should never break the app
    }
  }, []);

  return { logEvent };
}
