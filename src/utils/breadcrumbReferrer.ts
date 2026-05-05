/**
 * ForageFlow — Breadcrumb Referrer Utilities
 *
 * Manages the sessionStorage-based referrer stack for contextual
 * breadcrumb navigation between detail pages.
 *
 * Requirements: 1.1, 1.2, 1.3
 */

import type { BreadcrumbReferrer } from '@/types';

export const BREADCRUMB_STORAGE_KEY = 'forageflow-detail-referrer';

/**
 * Reads the breadcrumb referrer from sessionStorage.
 * Returns null if unavailable or unparseable.
 */
export function readReferrer(): BreadcrumbReferrer | null {
  try {
    const raw = sessionStorage.getItem(BREADCRUMB_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as BreadcrumbReferrer;
    if (parsed && parsed.href && parsed.title && parsed.category) {
      return parsed;
    }
    return null;
  } catch {
    // sessionStorage unavailable (private browsing) or invalid JSON
    return null;
  }
}

/**
 * Writes the breadcrumb referrer to sessionStorage.
 */
export function writeReferrer(referrer: BreadcrumbReferrer): void {
  try {
    sessionStorage.setItem(BREADCRUMB_STORAGE_KEY, JSON.stringify(referrer));
  } catch {
    // sessionStorage unavailable — silently fail
  }
}

/**
 * Clears the breadcrumb referrer from sessionStorage.
 */
export function clearReferrer(): void {
  try {
    sessionStorage.removeItem(BREADCRUMB_STORAGE_KEY);
  } catch {
    // sessionStorage unavailable — silently fail
  }
}
