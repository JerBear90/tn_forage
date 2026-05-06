'use client';

/**
 * ForageWise — OnlineHint Component
 *
 * A subtle, contextual hint shown when the user is offline and the
 * current section would benefit from an internet connection.
 * Dismissible per-session.
 */

import { useState } from 'react';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';

export interface OnlineHintProps {
  /** What the user would get by going online */
  message: string;
  /** Optional: specific feature context (e.g., "weather", "community") */
  context?: string;
}

export default function OnlineHint({ message, context }: OnlineHintProps) {
  const isOnline = useOnlineStatus();
  const [dismissed, setDismissed] = useState(false);

  // Don't show if online or dismissed
  if (isOnline || dismissed) return null;

  return (
    <div
      className="flex items-start gap-2 rounded-lg bg-brand-teal/5 dark:bg-brand-teal/10 border border-brand-teal/15 dark:border-brand-teal/25 px-3 py-2.5 mb-4"
      role="status"
      aria-label={`Offline notice: ${message}`}
    >
      <span className="text-sm shrink-0 mt-0.5" aria-hidden="true">📡</span>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-brand-charcoal/70 dark:text-brand-sand/70 leading-relaxed">
          {message}
        </p>
      </div>
      <button
        type="button"
        onClick={() => setDismissed(true)}
        aria-label="Dismiss offline notice"
        className="shrink-0 rounded p-1 text-brand-charcoal/40 dark:text-brand-sand/40 hover:text-brand-charcoal/60 dark:hover:text-brand-sand/60 transition-colors"
      >
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}
