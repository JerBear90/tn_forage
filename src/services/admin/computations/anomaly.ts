/**
 * Anomaly detection computation utilities.
 *
 * Pure functions for threshold-based anomaly detection. No side effects,
 * no PocketBase calls. These functions determine whether metrics have
 * crossed anomaly thresholds and whether previously anomalous metrics
 * have returned to normal range.
 */

import type { AnomalyType, AnomalyConfig } from '@/types/admin-dashboard';

// ---------------------------------------------------------------------------
// Detection Functions
// ---------------------------------------------------------------------------

/**
 * Detects an error spike anomaly.
 *
 * An error spike is detected when the current error count exceeds
 * the 7-day average multiplied by the configured multiplier.
 *
 * @param currentCount - The current error count for the evaluation period
 * @param sevenDayAvg - The 7-day average error count
 * @param multiplier - The spike multiplier threshold (default: 3)
 * @returns true if currentCount > sevenDayAvg * multiplier
 */
export function detectErrorSpike(
  currentCount: number,
  sevenDayAvg: number,
  multiplier: number
): boolean {
  if (sevenDayAvg <= 0) return false;
  return currentCount > sevenDayAvg * multiplier;
}

/**
 * Detects a traffic drop anomaly.
 *
 * A traffic drop is detected when the current active user count falls
 * below the 7-day average multiplied by the threshold percentage.
 *
 * @param currentActiveUsers - The current active user count
 * @param sevenDayAvg - The 7-day average active user count
 * @param threshold - The drop threshold as a fraction (default: 0.5 = 50%)
 * @returns true if currentActiveUsers < sevenDayAvg * threshold
 */
export function detectTrafficDrop(
  currentActiveUsers: number,
  sevenDayAvg: number,
  threshold: number
): boolean {
  if (sevenDayAvg <= 0) return false;
  return currentActiveUsers < sevenDayAvg * threshold;
}

/**
 * Detects a connection failure anomaly.
 *
 * A connection failure is detected when the time since the last successful
 * health check exceeds the configured threshold in minutes.
 *
 * @param lastSuccessfulCheckMs - Timestamp (ms) of the last successful health check
 * @param thresholdMinutes - The failure threshold in minutes (default: 5)
 * @returns true if (now - lastSuccessfulCheckMs) > thresholdMinutes * 60000
 */
export function detectConnectionFailure(
  lastSuccessfulCheckMs: number,
  thresholdMinutes: number
): boolean {
  if (thresholdMinutes <= 0) return false;
  const now = Date.now();
  const elapsedMs = now - lastSuccessfulCheckMs;
  return elapsedMs > thresholdMinutes * 60000;
}

// ---------------------------------------------------------------------------
// Resolution Function
// ---------------------------------------------------------------------------

/**
 * Determines whether a previously detected anomaly should be resolved.
 *
 * An anomaly is resolved when the metric returns to normal range:
 * - error_spike: resolved when currentValue <= sevenDayAvg * multiplier
 * - traffic_drop: resolved when currentValue >= sevenDayAvg * threshold
 * - connection_failure: resolved when currentValue represents a recent
 *   successful check (within the threshold window)
 *
 * @param anomalyType - The type of anomaly to evaluate
 * @param currentValue - The current metric value
 * @param sevenDayAvg - The 7-day average for the metric
 * @param config - The anomaly detection configuration
 * @returns true if the metric has returned to normal range
 */
export function shouldResolve(
  anomalyType: AnomalyType,
  currentValue: number,
  sevenDayAvg: number,
  config: AnomalyConfig
): boolean {
  switch (anomalyType) {
    case 'error_spike':
      // Resolved when error count is back at or below the spike threshold
      if (sevenDayAvg <= 0) return true;
      return currentValue <= sevenDayAvg * config.errorSpikeMultiplier;

    case 'traffic_drop':
      // Resolved when active users are back at or above the drop threshold
      if (sevenDayAvg <= 0) return true;
      return currentValue >= sevenDayAvg * config.trafficDropThreshold;

    case 'connection_failure':
      // Resolved when the last successful check is within the threshold window
      // currentValue here is the lastSuccessfulCheckMs timestamp
      return !detectConnectionFailure(currentValue, config.connectionFailureMinutes);

    default:
      return false;
  }
}
