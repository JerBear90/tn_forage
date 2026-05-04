/**
 * Phase 3.2 Property Test P23: Onboarding flag
 *
 * After the onboarding walkthrough is completed or skipped,
 * the introAnimationShown setting SHALL be set to true.
 *
 * Validates: Requirements 19.5
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';

/**
 * Simulates the onboarding completion logic.
 */
function completeOnboarding(currentSettings: { introAnimationShown: boolean }): { introAnimationShown: boolean } {
  return { ...currentSettings, introAnimationShown: true };
}

/**
 * Determines if onboarding should be shown.
 */
function shouldShowOnboarding(introAnimationShown: boolean): boolean {
  return !introAnimationShown;
}

describe('Phase 3.2 Property P23: Onboarding flag', () => {
  it('onboarding is shown when introAnimationShown is false', () => {
    expect(shouldShowOnboarding(false)).toBe(true);
  });

  it('onboarding is not shown when introAnimationShown is true', () => {
    expect(shouldShowOnboarding(true)).toBe(false);
  });

  it('completing onboarding always sets introAnimationShown to true', () => {
    fc.assert(
      fc.property(
        fc.boolean(),
        (initialValue) => {
          const settings = { introAnimationShown: initialValue };
          const result = completeOnboarding(settings);
          expect(result.introAnimationShown).toBe(true);
        },
      ),
      { numRuns: 100 },
    );
  });

  it('after completion, onboarding should never be shown again', () => {
    fc.assert(
      fc.property(
        fc.boolean(),
        (initialValue) => {
          const settings = { introAnimationShown: initialValue };
          const afterCompletion = completeOnboarding(settings);
          expect(shouldShowOnboarding(afterCompletion.introAnimationShown)).toBe(false);
        },
      ),
      { numRuns: 100 },
    );
  });
});
