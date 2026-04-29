"use client";

import { useOnlineStatus } from "@/hooks/useOnlineStatus";

/**
 * Compact badge that appears in the header when the device is offline.
 * Renders nothing when online. Uses `aria-live="polite"` so screen readers
 * announce connectivity changes without interrupting the user.
 */
export default function OfflineBadge() {
  const isOnline = useOnlineStatus();

  return (
    <div aria-live="polite" aria-atomic="true">
      {!isOnline && (
        <span className="inline-flex items-center gap-1 rounded-full bg-brand-earth/15 dark:bg-brand-earth/25 px-2.5 py-0.5 text-xs font-medium text-brand-earth dark:text-amber-300 border border-brand-earth/30 dark:border-amber-400/30">
          {/* Wifi-off icon */}
          <svg
            aria-hidden="true"
            className="w-3.5 h-3.5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M8.288 15.038a5.25 5.25 0 017.424 0M5.106 11.856c3.807-3.808 9.98-3.808 13.788 0M1.924 8.674c5.565-5.565 14.587-5.565 20.152 0M12.53 18.22l-.53.53-.53-.53a.75.75 0 011.06 0z"
            />
            {/* Diagonal strike-through line */}
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M3 3l18 18"
            />
          </svg>
          Offline
        </span>
      )}
    </div>
  );
}
