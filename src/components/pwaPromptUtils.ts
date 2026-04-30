/**
 * Pure utility functions for PWA install prompt logic.
 *
 * Extracted from PwaInstallPrompt.tsx so they can be tested
 * without requiring JSX/DOM parsing.
 */

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

/**
 * Determines whether the PWA install prompt should be visible.
 *
 * Visible iff:
 *  1. The app is NOT running in standalone PWA mode, AND
 *  2. Either no dismissal timestamp exists, OR the dismissal was 7+ days ago.
 */
export function shouldShowPwaPrompt(
  isStandalone: boolean,
  dismissalTimestamp: number | null,
  currentTimestamp: number,
): boolean {
  if (isStandalone) return false;
  if (dismissalTimestamp === null) return true;
  return currentTimestamp - dismissalTimestamp >= SEVEN_DAYS_MS;
}
