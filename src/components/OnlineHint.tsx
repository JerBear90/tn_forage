'use client';

/**
 * ForageWise — OnlineHint Component
 *
 * A minimal, non-intrusive inline text hint shown when offline.
 * Just a single line of text — no borders, no boxes, no dismiss button.
 * Disappears automatically when online.
 */

import { useOnlineStatus } from '@/hooks/useOnlineStatus';

export interface OnlineHintProps {
  /** Short message about what's available online */
  message: string;
}

export default function OnlineHint({ message }: OnlineHintProps) {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <p className="text-[11px] text-brand-charcoal/40 dark:text-brand-sand/40 mb-3 flex items-center gap-1">
      <span aria-hidden="true">📡</span>
      {message}
    </p>
  );
}
