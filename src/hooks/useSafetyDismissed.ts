'use client';

/**
 * ForageWise — useSafetyDismissed Hook
 *
 * Shared hook for dismissible safety disclaimers across the app.
 * Checks both the global safety disclaimer key and an optional
 * page-specific key. If either has been acknowledged, the disclaimer
 * is considered dismissed.
 *
 * Persists acknowledgment in localStorage so it survives page reloads.
 */

import { useState, useEffect, useCallback } from 'react';

const GLOBAL_KEY = 'foragewise-safety-dismissed';

export function useSafetyDismissed(pageKey?: string) {
  const [dismissed, setDismissed] = useState<boolean | null>(null);

  useEffect(() => {
    try {
      const globalDismissed = localStorage.getItem(GLOBAL_KEY) === 'true';
      const pageDismissed = pageKey
        ? localStorage.getItem(pageKey) === 'true'
        : false;
      setDismissed(globalDismissed || pageDismissed);
    } catch {
      setDismissed(false);
    }
  }, [pageKey]);

  const dismiss = useCallback(() => {
    setDismissed(true);
    try {
      if (pageKey) {
        localStorage.setItem(pageKey, 'true');
      }
    } catch {
      // Session-only dismiss
    }
  }, [pageKey]);

  return { dismissed, dismiss };
}
