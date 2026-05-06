/**
 * ForageWise — Location Privacy Service Tests
 *
 * Tests for GPS coordinate fuzzing logic used to protect user privacy
 * on public community sightings.
 */

import { describe, it, expect } from 'vitest';
import {
  fuzzCoordinates,
  applyLocationPrivacy,
  FUZZ_OFFSET,
} from '@/services/locationPrivacy';
import type { Coordinates } from '@/types';

describe('fuzzCoordinates', () => {
  const baseCoords: Coordinates = { lat: 36.1627, lng: -86.7816 }; // Nashville, TN

  it('returns a new Coordinates object (not the same reference)', () => {
    const result = fuzzCoordinates(baseCoords);
    expect(result).not.toBe(baseCoords);
  });

  it('offsets latitude within ±FUZZ_OFFSET', () => {
    // Use deterministic rng that returns 0 (maps to -FUZZ_OFFSET)
    const result = fuzzCoordinates(baseCoords, () => 0);
    expect(result.lat).toBeCloseTo(baseCoords.lat - FUZZ_OFFSET, 10);
  });

  it('offsets longitude within ±FUZZ_OFFSET', () => {
    // rng returns 1 → offset = (1*2 - 1) * FUZZ_OFFSET = +FUZZ_OFFSET
    const result = fuzzCoordinates(baseCoords, () => 1);
    expect(result.lng).toBeCloseTo(baseCoords.lng + FUZZ_OFFSET, 10);
  });

  it('produces different results with different rng values', () => {
    const r1 = fuzzCoordinates(baseCoords, () => 0.25);
    const r2 = fuzzCoordinates(baseCoords, () => 0.75);
    expect(r1.lat).not.toEqual(r2.lat);
    expect(r1.lng).not.toEqual(r2.lng);
  });

  it('midpoint rng (0.5) produces zero offset', () => {
    const result = fuzzCoordinates(baseCoords, () => 0.5);
    expect(result.lat).toBeCloseTo(baseCoords.lat, 10);
    expect(result.lng).toBeCloseTo(baseCoords.lng, 10);
  });

  it('fuzzed coordinates stay within FUZZ_OFFSET of original', () => {
    // Run with several deterministic rng values
    for (const rngVal of [0, 0.1, 0.3, 0.5, 0.7, 0.9, 1]) {
      const result = fuzzCoordinates(baseCoords, () => rngVal);
      expect(Math.abs(result.lat - baseCoords.lat)).toBeLessThanOrEqual(FUZZ_OFFSET + 1e-10);
      expect(Math.abs(result.lng - baseCoords.lng)).toBeLessThanOrEqual(FUZZ_OFFSET + 1e-10);
    }
  });
});

describe('applyLocationPrivacy', () => {
  const coords: Coordinates = { lat: 35.9606, lng: -83.9207 }; // Knoxville, TN

  it('returns undefined when coordinates are undefined', () => {
    expect(applyLocationPrivacy(undefined, 'public')).toBeUndefined();
    expect(applyLocationPrivacy(undefined, 'private')).toBeUndefined();
  });

  it('returns exact coordinates for private visibility', () => {
    const result = applyLocationPrivacy(coords, 'private');
    expect(result).toEqual(coords);
  });

  it('returns fuzzed coordinates for public visibility', () => {
    // Use deterministic rng that produces a known offset
    const result = applyLocationPrivacy(coords, 'public', () => 0);
    expect(result).toBeDefined();
    expect(result!.lat).toBeCloseTo(coords.lat - FUZZ_OFFSET, 10);
    expect(result!.lng).toBeCloseTo(coords.lng - FUZZ_OFFSET, 10);
  });

  it('private coordinates are the same object reference', () => {
    const result = applyLocationPrivacy(coords, 'private');
    expect(result).toBe(coords);
  });

  it('public coordinates are a different object', () => {
    const result = applyLocationPrivacy(coords, 'public');
    expect(result).not.toBe(coords);
  });
});
