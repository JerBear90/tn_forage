/**
 * Property-based tests for PWA install prompt visibility logic.
 *
 * Feature: foragewise-enhancements, Property 4: PWA install prompt visibility logic
 *
 * **Validates: Requirements 10.1, 10.3, 10.4**
 */

import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import { shouldShowPwaPrompt } from "@/components/pwaPromptUtils";

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

describe("Property 4: PWA install prompt visibility logic", () => {
  it("prompt visible iff isStandalone === false AND (dismissalTimestamp === null OR currentTimestamp - dismissalTimestamp >= 7 days)", () => {
    fc.assert(
      fc.property(
        fc.boolean(),
        fc.option(
          fc.integer({ min: 0, max: Number.MAX_SAFE_INTEGER }),
          { nil: null },
        ),
        fc.integer({ min: 0, max: Number.MAX_SAFE_INTEGER }),
        (isStandalone, dismissalTimestamp, currentTimestamp) => {
          const result = shouldShowPwaPrompt(
            isStandalone,
            dismissalTimestamp,
            currentTimestamp,
          );

          // Compute expected value from the specification
          const expected =
            !isStandalone &&
            (dismissalTimestamp === null ||
              currentTimestamp - dismissalTimestamp >= SEVEN_DAYS_MS);

          expect(result).toBe(expected);
        },
      ),
      { numRuns: 200 },
    );
  });

  it("always hidden when running in standalone mode regardless of dismissal state", () => {
    fc.assert(
      fc.property(
        fc.option(
          fc.integer({ min: 0, max: Number.MAX_SAFE_INTEGER }),
          { nil: null },
        ),
        fc.integer({ min: 0, max: Number.MAX_SAFE_INTEGER }),
        (dismissalTimestamp, currentTimestamp) => {
          const result = shouldShowPwaPrompt(true, dismissalTimestamp, currentTimestamp);
          expect(result).toBe(false);
        },
      ),
      { numRuns: 100 },
    );
  });

  it("always visible when not standalone and never dismissed", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: Number.MAX_SAFE_INTEGER }),
        (currentTimestamp) => {
          const result = shouldShowPwaPrompt(false, null, currentTimestamp);
          expect(result).toBe(true);
        },
      ),
      { numRuns: 100 },
    );
  });

  it("hidden when dismissed less than 7 days ago", () => {
    fc.assert(
      fc.property(
        // Generate a dismissal that happened 0 to (7 days - 1ms) ago
        fc.integer({ min: 1_000_000_000_000, max: Number.MAX_SAFE_INTEGER }),
        fc.integer({ min: 0, max: SEVEN_DAYS_MS - 1 }),
        (dismissalTimestamp, elapsedMs) => {
          const currentTimestamp = dismissalTimestamp + elapsedMs;
          const result = shouldShowPwaPrompt(false, dismissalTimestamp, currentTimestamp);
          expect(result).toBe(false);
        },
      ),
      { numRuns: 100 },
    );
  });

  it("visible when dismissed exactly 7 days ago or more", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 1_000_000_000_000 }),
        fc.integer({ min: 0, max: 1_000_000_000_000 }),
        (dismissalTimestamp, extraMs) => {
          const currentTimestamp = dismissalTimestamp + SEVEN_DAYS_MS + extraMs;
          const result = shouldShowPwaPrompt(false, dismissalTimestamp, currentTimestamp);
          expect(result).toBe(true);
        },
      ),
      { numRuns: 100 },
    );
  });
});
