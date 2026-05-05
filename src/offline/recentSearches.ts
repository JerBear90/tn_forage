/**
 * ForageWise — Recent Searches Utilities
 *
 * Persists recent search queries in localStorage for quick access.
 * Stores at most 10 entries, newest first, with no duplicates.
 * All operations are wrapped in try/catch for environments where
 * localStorage is unavailable (e.g., private browsing in some browsers).
 */

export const STORAGE_KEY = 'foragewise-recent-searches';
export const MAX_RECENT = 10;

/**
 * Retrieve the list of recent search queries from localStorage.
 * Returns an array of strings, newest first, max 10 entries.
 * Returns an empty array if localStorage is unavailable or data is invalid.
 */
export function getRecentSearches(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    // Filter to only valid strings and cap at MAX_RECENT
    return parsed.filter((item): item is string => typeof item === 'string').slice(0, MAX_RECENT);
  } catch {
    return [];
  }
}

/**
 * Save a search query to the recent searches list.
 *
 * - Trims the query; ignores empty strings
 * - If the query already exists, moves it to the front (no duplicates)
 * - Caps the list at MAX_RECENT entries
 * - No-op if localStorage is unavailable
 */
export function saveRecentSearch(query: string): void {
  try {
    const trimmed = query.trim();
    if (!trimmed) return;

    const current = getRecentSearches();

    // Remove existing occurrence (case-sensitive — preserves user's casing)
    const filtered = current.filter((item) => item !== trimmed);

    // Add to front
    const updated = [trimmed, ...filtered].slice(0, MAX_RECENT);

    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch {
    // localStorage unavailable — silently ignore
  }
}

/**
 * Clear all recent searches from localStorage.
 * No-op if localStorage is unavailable.
 */
export function clearRecentSearches(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // localStorage unavailable — silently ignore
  }
}
