"use client";

import { useEffect, useRef, useState } from "react";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import { useAuth } from "@/auth/useAuth";
import {
  processQueue,
  hasPendingSync,
  setSyncAuthToken,
  type SyncResult,
} from "@/offline/syncWorker";

/**
 * Automatically processes the sync queue when the device comes online.
 *
 * - Triggers on online status change
 * - Runs every 60 seconds while online and items are pending
 * - Sets the PocketBase auth token from the current session
 * - Returns sync status for UI indicators
 */
export function useAutoSync() {
  const isOnline = useOnlineStatus();
  const { user, isAuthenticated } = useAuth();
  const [syncing, setSyncing] = useState(false);
  const [lastResult, setLastResult] = useState<SyncResult | null>(null);
  const [pendingCount, setPendingCount] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!isOnline || !isAuthenticated) {
      // Clear interval when offline or not authenticated
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    async function runSync() {
      const hasPending = await hasPendingSync();
      if (!hasPending) {
        setPendingCount(0);
        return;
      }

      setSyncing(true);
      try {
        // Set auth token for PocketBase requests
        // In a real implementation, this would come from the PocketBase auth store
        // For now, we use the user ID as a placeholder token
        if (user?.id) {
          setSyncAuthToken(user.id);
        }

        const result = await processQueue();
        setLastResult(result);
        setPendingCount(result.remaining);
      } catch {
        // Sync failed — will retry on next interval
      } finally {
        setSyncing(false);
      }
    }

    // Run immediately when coming online
    runSync();

    // Then run every 60 seconds while online
    intervalRef.current = setInterval(runSync, 60_000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isOnline, isAuthenticated, user?.id]);

  return { syncing, lastResult, pendingCount };
}
