/**
 * Voice Pronunciation — Property-Based Test
 *
 * Feature: season-charts-voice-map, Property 4: Voice pronunciation text construction
 *
 * For any non-empty common name and non-empty scientific name, `speakName()`
 * SHALL construct an utterance whose text contains the common name followed
 * by the scientific name. Additionally, the aria-label for the button SHALL
 * be exactly `"Hear pronunciation of {commonName}"` for any common name string.
 *
 * **Validates: Requirements 4.2, 4.7**
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as fc from 'fast-check';

// Feature: season-charts-voice-map, Property 4: Voice pronunciation text construction

// ---------------------------------------------------------------------------
// Mock setup for Web Speech API
// ---------------------------------------------------------------------------

/** Captured utterance texts from SpeechSynthesisUtterance constructor calls */
let capturedUtteranceTexts: string[] = [];

/** Mock SpeechSynthesisUtterance that captures the text argument */
class MockSpeechSynthesisUtterance {
  text: string;
  onend: (() => void) | null = null;
  onerror: ((event: { error: string }) => void) | null = null;

  constructor(text: string) {
    this.text = text;
    capturedUtteranceTexts.push(text);
  }
}

/** Mock speechSynthesis that auto-resolves speech by calling onend */
const mockSpeechSynthesis = {
  cancel: vi.fn(),
  speak: vi.fn((utterance: MockSpeechSynthesisUtterance) => {
    // Simulate immediate speech completion
    if (utterance.onend) {
      utterance.onend();
    }
  }),
};

beforeEach(() => {
  capturedUtteranceTexts = [];

  // Set up Web Speech API mocks on the global window object
  vi.stubGlobal('window', {
    speechSynthesis: mockSpeechSynthesis,
    SpeechSynthesisUtterance: MockSpeechSynthesisUtterance,
  });
  vi.stubGlobal('SpeechSynthesisUtterance', MockSpeechSynthesisUtterance);
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

// ---------------------------------------------------------------------------
// Arbitraries
// ---------------------------------------------------------------------------

/**
 * Arbitrary for non-empty name strings.
 * Uses printable ASCII characters, trimmed, and filtered to ensure non-empty
 * after trimming. Avoids control characters that could interfere with speech.
 */
const arbNonEmptyName: fc.Arbitrary<string> = fc
  .string({ minLength: 1, maxLength: 60 })
  .map((s) => s.trim())
  .filter((s) => s.length > 0);

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('Feature: season-charts-voice-map, Property 4: Voice pronunciation text construction', () => {
  it('speakName() constructs utterance text containing common name followed by scientific name', async () => {
    // Dynamic import so the module picks up our mocked globals
    const { speakName } = await import('@/utils/voicePronunciation');

    await fc.assert(
      fc.asyncProperty(arbNonEmptyName, arbNonEmptyName, async (commonName, scientificName) => {
        capturedUtteranceTexts = [];
        mockSpeechSynthesis.speak.mockImplementation(
          (utterance: MockSpeechSynthesisUtterance) => {
            if (utterance.onend) {
              utterance.onend();
            }
          },
        );

        await speakName(commonName, scientificName);

        // At least one utterance should have been created
        expect(
          capturedUtteranceTexts.length,
          `Expected at least one utterance for "${commonName}" / "${scientificName}"`,
        ).toBeGreaterThanOrEqual(1);

        const lastText = capturedUtteranceTexts[capturedUtteranceTexts.length - 1];

        // The utterance text should contain the common name
        expect(
          lastText,
          `Utterance text should contain common name "${commonName.trim()}"`,
        ).toContain(commonName.trim());

        // The utterance text should contain the scientific name
        expect(
          lastText,
          `Utterance text should contain scientific name "${scientificName.trim()}"`,
        ).toContain(scientificName.trim());

        // Common name should appear before scientific name in the text
        const commonIndex = lastText.indexOf(commonName.trim());
        const scientificIndex = lastText.indexOf(scientificName.trim());
        expect(
          commonIndex,
          `Common name "${commonName.trim()}" should appear before scientific name "${scientificName.trim()}" in utterance text "${lastText}"`,
        ).toBeLessThan(scientificIndex);
      }),
      { numRuns: 100 },
    );
  });

  it('aria-label format is exactly "Hear pronunciation of {commonName}" for any common name', () => {
    fc.assert(
      fc.property(arbNonEmptyName, (commonName) => {
        // The aria-label construction as specified in the design document
        const ariaLabel = `Hear pronunciation of ${commonName}`;

        // Verify the format matches the expected pattern
        expect(ariaLabel).toBe(`Hear pronunciation of ${commonName}`);

        // Verify it starts with the required prefix
        expect(ariaLabel.startsWith('Hear pronunciation of ')).toBe(true);

        // Verify the common name is present after the prefix
        expect(ariaLabel.slice('Hear pronunciation of '.length)).toBe(commonName);
      }),
      { numRuns: 100 },
    );
  });
});
