/**
 * ForageWise — Visibility Filter Utility
 *
 * Filters items by visibility for use in profile components.
 * When viewing another user's profile, only public items are shown.
 *
 * Requirements: 5.5, 13.4, 15.4
 */

/**
 * Filter items to only those with public visibility.
 *
 * Used when a user views another user's profile to ensure
 * private trips, achievements, and other content remain hidden.
 *
 * @param items - Array of items with a visibility field
 * @returns Only items where visibility === 'public'
 */
export function filterPublicItems<T extends { visibility: 'private' | 'public' }>(
  items: T[],
): T[] {
  return items.filter((item) => item.visibility === 'public');
}
