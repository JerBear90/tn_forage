/**
 * Funnel computation utilities.
 *
 * Pure functions for computing conversion rates between funnel steps
 * and validating monotonicity of step counts. No side effects, no PocketBase calls.
 */

import type { FunnelStep } from '@/types/admin-dashboard';

/**
 * Computes conversion rates for an ordered array of step counts.
 *
 * For each step, the conversion rate is the percentage of users from the
 * previous step who reached this step. The first step always has 100%
 * conversion. Steps with conversion below 20% are marked as highlighted.
 *
 * @param stepCounts - Ordered array of user counts at each funnel step
 * @param stepNames - Ordered array of step names (must match stepCounts length)
 * @returns Array of FunnelStep objects with computed conversion rates
 */
export function computeConversionRates(
  stepCounts: number[],
  stepNames: string[]
): FunnelStep[] {
  if (stepCounts.length === 0) return [];

  return stepCounts.map((count, index) => {
    let conversionRate: number;

    if (index === 0) {
      // First step is always 100% (entry point)
      conversionRate = 100;
    } else {
      const previousCount = stepCounts[index - 1];
      conversionRate = previousCount > 0
        ? (count / previousCount) * 100
        : 0;
    }

    return {
      name: stepNames[index] ?? `Step ${index + 1}`,
      userCount: count,
      conversionRate: Math.round(conversionRate * 10) / 10,
      highlighted: index > 0 && conversionRate < 20,
    };
  });
}

/**
 * Validates that step counts are monotonically non-increasing.
 *
 * In a valid funnel, each subsequent step should have fewer or equal
 * users compared to the previous step (users can only drop off, not appear).
 *
 * @param stepCounts - Ordered array of user counts at each funnel step
 * @returns true if counts are monotonically non-increasing, false otherwise
 */
export function validateMonotonicity(stepCounts: number[]): boolean {
  if (stepCounts.length <= 1) return true;

  for (let i = 1; i < stepCounts.length; i++) {
    if (stepCounts[i] > stepCounts[i - 1]) {
      return false;
    }
  }

  return true;
}
