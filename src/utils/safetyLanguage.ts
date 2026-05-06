/**
 * ForageWise — Safety Language Utilities
 *
 * Banned phrase detection for safety-first language compliance.
 * No feature may display "safe to eat", "confirmed edible",
 * "definitely edible", or "AI verified" in any user-facing text.
 *
 * Requirements: 3.4, 6.5, 8.3, 10.1
 */

/** Banned phrases that must never appear in user-facing text */
export const BANNED_PHRASES: string[] = [
  'safe to eat',
  'definitely edible',
  'confirmed edible',
  'ai verified',
];

/**
 * Check if a string contains any banned safety phrases (case-insensitive).
 * Returns the first banned phrase found, or null if clean.
 */
export function containsBannedPhrase(text: string): string | null {
  const lower = text.toLowerCase();
  for (const phrase of BANNED_PHRASES) {
    if (lower.includes(phrase)) {
      return phrase;
    }
  }
  return null;
}
