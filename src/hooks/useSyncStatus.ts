"use client";

import { useState, useEffect, useCallback } from "react";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import { getPending } from "@/offline/syncQueue";

/**
 * Sync status states displayed to the user.
 *
 * - `"offline"` — device has no network connection
 * - `"syncing"` — online but pending items exist in the sync queue
 * - `"up-to-date"` — online with nothing left to sync
 */
export type SyncState = "offline" | "syncing" | "up-to-date";

/**
 * Combines browser online/offline status with the IndexedDB sync queue
 * to derive a single {@link SyncState} value.
 *
 * Polls the sync queue every `pollIntervalMs` milliseconds (default 5 000)
 * while the device is online. When offline the poll is paused and the state
 * is always `"offline"`.
 */
export function useSyncStatus(pollIntervalMs = 5_000): SyncState {
  const isOnline = useOnlineStatus();
  const [pendingCount, setPendingCount] = useState(0);

  const checkQueue = useCallback(async () => {
    try {
      const pending = await getPending();
      setPendingCount(pending.length);
    } catch {
      // IndexedDB may not be available (SSR, test env) — treat as zero
      setPendingCount(0);
    }
  }, []);

  useEffect(() => {
    // Don't poll when offline — we already know the state
    if (!isOnline) return;

    // Check immediately when coming online
    checkQueue();

    const id = setInterval(checkQueue, pollIntervalMs);
    return () => clearInterval(id);
  }, [isOnline, pollIntervalMs, checkQueue]);

  if (!isOnline) return "offline";
  if (pendingCount > 0) return "syncing";
  return "up-to-date";
}
