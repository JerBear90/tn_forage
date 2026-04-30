/**
 * ForageFlow — Edibility Safety Utilities
 *
 * Pure functions for edibility safety text processing.
 * Separated from the React component for testability.
 *
 * SAFETY RULES:
 * - NEVER display "safe to eat", "definitely edible", "confirmed edible", or "AI verified"
 *
 * Requirements: 14.5
 */

/**
 * Forbidden phrases that must never appear in rendered output.
 * Case-insensitive matching is applied.
 */
export const FORBIDDEN_PHRASES = [
  "safe to eat",
  "definitely edible",
  "confirmed edible",
  "ai verified",
] as const;

/**
 * Runtime sanitizer that strips forbidden phrases from any text.
 * Returns the sanitized string with forbidden phrases removed.
 * Exported for testing.
 */
export function sanitizeSafetyText(text: string): string {
  let result = text;
  for (const phrase of FORBIDDEN_PHRASES) {
    // Case-insensitive global replacement
    const regex = new RegExp(phrase, "gi");
    result = result.replace(regex, "");
  }
  // Clean up any double spaces left by removal
  return result.replace(/\s{2,}/g, " ").trim();
}
