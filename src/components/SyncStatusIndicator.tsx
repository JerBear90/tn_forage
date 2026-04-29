"use client";

import { useSyncStatus, type SyncState } from "@/hooks/useSyncStatus";

/**
 * Visual configuration for each sync state — dot colour classes,
 * human-readable label, and optional animation class.
 */
const stateConfig: Record<
  SyncState,
  { dotClass: string; label: string; ariaLabel: string }
> = {
  offline: {
    dotClass: "bg-brand-earth",
    label: "Offline",
    ariaLabel: "Sync status: offline",
  },
  syncing: {
    dotClass: "bg-brand-teal animate-pulse",
    label: "Syncing…",
    ariaLabel: "Sync status: syncing pending changes",
  },
  "up-to-date": {
    dotClass: "bg-brand-moss",
    label: "Up to date",
    ariaLabel: "Sync status: up to date",
  },
};

/**
 * Small, unobtrusive sync-status indicator suitable for the app header
 * or near the bottom navigation.
 *
 * Displays one of three states:
 * - **Offline** — earth-brown dot + "Offline"
 * - **Syncing** — pulsing teal dot + "Syncing…"
 * - **Up to date** — moss-green dot + "Up to date"
 *
 * Uses `aria-live="polite"` so screen readers announce state changes
 * without interrupting the user.
 */
export default function SyncStatusIndicator() {
  const syncState = useSyncStatus();
  const { dotClass, label, ariaLabel } = stateConfig[syncState];

  return (
    <div
      role="status"
      aria-live="polite"
      aria-atomic="true"
      aria-label={ariaLabel}
      className="inline-flex items-center gap-1.5 text-xs font-medium text-brand-charcoal/70 dark:text-brand-sand/70 select-none"
    >
      <span
        aria-hidden="true"
        className={`inline-block h-2 w-2 rounded-full ${dotClass}`}
      />
      <span>{label}</span>
    </div>
  );
}
