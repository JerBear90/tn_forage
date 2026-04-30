/**
 * Trail utility functions for hiking time estimation and formatting.
 *
 * Uses Naismith's rule: 3 mph base pace + 30 minutes per 1000 ft elevation gain.
 */

/**
 * Estimate hiking time using Naismith's rule.
 * Base: 3 mph + 30 minutes per 1000 ft elevation gain.
 *
 * Negative inputs are clamped to 0.
 *
 * @param distanceMiles - Trail distance in miles
 * @param elevationGainFeet - Total elevation gain in feet
 * @returns Estimated time in minutes
 */
export function estimateHikingTime(
  distanceMiles: number,
  elevationGainFeet: number,
): number {
  const d = Math.max(0, distanceMiles);
  const e = Math.max(0, elevationGainFeet);
  return (d / 3) * 60 + (e / 1000) * 30;
}

/**
 * Format minutes into a human-readable string like "2h 15m" or "45m".
 *
 * - 0 minutes → "0m"
 * - Only hours (e.g. 120) → "2h"
 * - Only minutes (e.g. 45) → "45m"
 * - Both (e.g. 135) → "2h 15m"
 *
 * Negative inputs are clamped to 0. Values are rounded to the nearest minute.
 *
 * @param minutes - Time in minutes
 * @returns Human-readable time string
 */
export function formatHikingTime(minutes: number): string {
  const clamped = Math.max(0, Math.round(minutes));
  const h = Math.floor(clamped / 60);
  const m = clamped % 60;

  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}
