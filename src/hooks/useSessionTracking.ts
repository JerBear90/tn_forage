'use client';

/**
 * ForageWise — Session Tracking Hook
 *
 * Initializes session tracking on mount and calls `recordActivity()`
 * on every route change to track page count and reset the inactivity timer.
 *
 * Should be mounted once in the app layout (AppShell).
 *
 * Requirements: 4.1, 4.4
 */

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { initSessionTracking, recordActivity, cleanupSessionTracking } from '@/services/admin/sessionTracking';

/**
 * Hook that initializes session tracking and records activity on route changes.
 */
export function useSessionTracking(): void {
  const pathname = usePathname();

  // Initialize session tracking once on mount
  useEffect(() => {
    initSessionTracking();
    return () => {
      cleanupSessionTracking();
    };
  }, []);

  // Record activity on every route change
  useEffect(() => {
    if (pathname) {
      recordActivity();
    }
  }, [pathname]);
}
