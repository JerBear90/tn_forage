'use client';

/**
 * ForageWise — Error Capture Hook
 *
 * Initializes global error capture handlers on mount.
 * Should be mounted once in the app layout so it captures errors globally.
 *
 * Requirements: 5.1, 5.7, 12.3
 */

import { useEffect } from 'react';
import { initErrorCapture } from '@/services/admin/errorCapture';

/**
 * Hook that initializes global error capture on mount.
 * Sets up window.onerror and window.onunhandledrejection handlers.
 * Safe to call multiple times — only initializes once.
 */
export function useErrorCapture(): void {
  useEffect(() => {
    initErrorCapture();
  }, []);
}
