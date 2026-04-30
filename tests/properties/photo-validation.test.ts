/**
 * Photo File Validation — Property-Based Test
 *
 * Feature: social-profile-and-park-details, Property 5: Photo file validation
 *
 * For any blob with a MIME type and file size, validatePhoto shall return
 * { valid: true } if and only if the MIME type is image/jpeg or image/png
 * AND the file size is ≤ 10 MB. All other inputs shall be rejected.
 *
 * **Validates: Requirements 3.2**
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import {
  validatePhoto,
  MAX_PHOTO_SIZE,
  ACCEPTED_MIME_TYPES,
} from '@/social/photoService';

// ---------------------------------------------------------------------------
// Arbitraries
// ---------------------------------------------------------------------------

/** Valid MIME types for photos */
const arbValidMime = fc.constantFrom('image/jpeg', 'image/png');

/** Invalid MIME types — anything that is NOT image/jpeg or image/png */
const arbInvalidMime = fc
  .string({ minLength: 1, maxLength: 30 })
  .filter((s) => !ACCEPTED_MIME_TYPES.includes(s));

/** Valid file size: 0 to MAX_PHOTO_SIZE (10 MB) */
const arbValidSize = fc.integer({ min: 0, max: MAX_PHOTO_SIZE });

/** Invalid file size: strictly greater than 10 MB (up to ~15 MB for testing) */
const arbInvalidSize = fc.integer({ min: MAX_PHOTO_SIZE + 1, max: 15 * 1024 * 1024 });

// ---------------------------------------------------------------------------
// Helper: create a Blob with a given MIME type and approximate size
// ---------------------------------------------------------------------------

function makeBlob(size: number, mimeType: string): Blob {
  // Create a blob of the specified size with the given MIME type
  const content = size > 0 ? 'x'.repeat(size) : '';
  return new Blob([content], { type: mimeType });
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('Feature: social-profile-and-park-details, Property 5: Photo file validation', () => {
  it('valid MIME + valid size → valid: true', () => {
    fc.assert(
      fc.property(arbValidMime, arbValidSize, (mimeType, size) => {
        const blob = makeBlob(size, mimeType);
        const result = validatePhoto(blob);
        expect(result.valid).toBe(true);
        expect(result.error).toBeUndefined();
      }),
      { numRuns: 100 },
    );
  });

  it('invalid MIME → valid: false', () => {
    fc.assert(
      fc.property(arbInvalidMime, arbValidSize, (mimeType, size) => {
        const blob = makeBlob(size, mimeType);
        const result = validatePhoto(blob);
        expect(result.valid).toBe(false);
        expect(result.error).toBeDefined();
      }),
      { numRuns: 100 },
    );
  });

  it('valid MIME + size > 10 MB → valid: false', () => {
    fc.assert(
      fc.property(arbValidMime, arbInvalidSize, (mimeType, size) => {
        const blob = makeBlob(size, mimeType);
        const result = validatePhoto(blob);
        expect(result.valid).toBe(false);
        expect(result.error).toBeDefined();
      }),
      { numRuns: 100 },
    );
  });
});
