'use client';

import { useRef, useCallback, useEffect } from 'react';

/**
 * Options for the useDoubleTap hook.
 */
export interface UseDoubleTapOptions {
  /** Callback fired on double-tap (two taps within threshold). */
  onDoubleTap: () => void;
  /** Callback fired on single-tap (no second tap within threshold). */
  onSingleTap: () => void;
  /** Time window in ms to detect a double-tap. Defaults to 300ms. */
  threshold?: number;
}

/**
 * Distinguishes between single-tap and double-tap gestures.
 *
 * A double-tap is detected when two taps occur within the given threshold
 * (default 300ms). If no second tap arrives within the threshold, the
 * single-tap callback fires. The pending single-tap timer is cleaned up
 * on unmount to prevent memory leaks and stale callbacks.
 *
 * @example
 * ```tsx
 * const { handleTap } = useDoubleTap({
 *   onDoubleTap: () => likePost(),
 *   onSingleTap: () => expandPost(),
 * });
 *
 * return <div onClick={handleTap}>...</div>;
 * ```
 */
export function useDoubleTap({
  onDoubleTap,
  onSingleTap,
  threshold = 300,
}: UseDoubleTapOptions): { handleTap: () => void } {
  const lastTapTime = useRef(0);
  const singleTapTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleTap = useCallback(() => {
    const now = Date.now();
    const elapsed = now - lastTapTime.current;

    if (elapsed < threshold) {
      // Double tap detected — cancel pending single-tap
      if (singleTapTimer.current) {
        clearTimeout(singleTapTimer.current);
        singleTapTimer.current = null;
      }
      onDoubleTap();
    } else {
      // Potential single tap — wait for threshold to confirm
      singleTapTimer.current = setTimeout(() => {
        onSingleTap();
        singleTapTimer.current = null;
      }, threshold);
    }

    lastTapTime.current = now;
  }, [onDoubleTap, onSingleTap, threshold]);

  // Clean up any pending timer on unmount
  useEffect(() => {
    return () => {
      if (singleTapTimer.current) {
        clearTimeout(singleTapTimer.current);
        singleTapTimer.current = null;
      }
    };
  }, []);

  return { handleTap };
}
