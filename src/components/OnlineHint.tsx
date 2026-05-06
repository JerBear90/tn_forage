'use client';

/**
 * ForageWise — OnlineHint Component
 *
 * A minimal, non-intrusive inline text hint shown when offline.
 * Can be permanently hidden by the user via localStorage.
 * Disappears automatically when online.
 */

import { useState, useEffect } from 'react';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';

const HIDDEN_KEY = 'foragewise-hide-online-hints';

export interface OnlineHintProps {
  /** Short message about what's available online */
  message: string;
}

export default function OnlineHint({ message }: OnlineHintProps) {
  const isOnline = useOnlineStatus();
  const [hidden, setHidden] = useState(true); // Start hidden to avoid flash

  useEffect(() => {
    const stored = localStorage.getItem(HIDDEN_KEY);
    setHidden(stored === 'true');
  }, []);

  if (isOnline || hidden) return null;

  return (
    <p className="text-[11px] text-brand-charcoal/40 dark:text-brand-sand/40 mb-3 flex items-center gap-1">
      <span aria-hidden="true">📡</span>
      <span className="flex-1">{message}</span>
      <button
        type="button"
        onClick={() => {
          localStorage.setItem(HIDDEN_KEY, 'true');
          setHidden(true);
        }}
        aria-label="Hide offline hints permanently"
        className="shrink-0 text-[10px] text-brand-charcoal/30 dark:text-brand-sand/30 hover:text-brand-charcoal/50 dark:hover:text-brand-sand/50 underline"
      >
        hide
      </button>
    </p>
  );
}
