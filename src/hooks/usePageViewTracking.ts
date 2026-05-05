'use client';

/**
 * ForageWise — Page View Tracking Hook
 *
 * Fires `recordPageView` on every route change using Next.js `usePathname()`.
 * Should be mounted once in the app layout so it fires globally.
 *
 * Requirements: 2.1, 12.1
 */

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { recordPageView } from '@/services/admin/eventCapture';

/**
 * Hook that tracks page views on route changes.
 * Uses usePathname() to detect navigation and calls recordPageView.
 */
export function usePageViewTracking(): void {
  const pathname = usePathname();
  const previousPathRef = useRef<string | null>(null);

  useEffect(() => {
    // Only record if the path actually changed (avoid double-fires on mount)
    if (pathname && pathname !== previousPathRef.current) {
      previousPathRef.current = pathname;
      recordPageView(pathname);
    }
  }, [pathname]);
}
