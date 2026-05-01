/**
 * SightingCard Species Image Matching — Unit Tests
 *
 * Tests the matchSpeciesImage function with specific examples covering
 * matched species, unmatched species, case variations, empty inputs,
 * and species with no images.
 *
 * Since @testing-library/react is not installed, we test the pure
 * function logic that drives the SightingCard species image display.
 *
 * **Validates: Requirements 7.1, 8.1**
 */

import { describe, it, expect } from 'vitest';
import {
  matchSpeciesImage,
  type KnownSpeciesRecord,
} from '@/services/trending';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const knownSpecies: KnownSpeciesRecord[] = [
  {
    id: 'sp-chanterelle',
    commonName: 'Chanterelle',
    images: ['/images/species/sp-chanterelle.jpg', '/images/species/sp-chanterelle-2.jpg'],
  },
  {
    id: 'sp-morel',
    commonName: 'Morel',
    images: ['/images/species/sp-morel.jpg'],
  },
  {
    id: 'sp-turkey-tail',
    commonName: 'Turkey Tail',
    images: ['/images/species/sp-turkey-tail.jpg'],
  },
  {
    id: 'pl-ramps',
    commonName: 'Ramps',
    images: ['/images/plants/pl-ramps.jpg'],
  },
  {
    id: 'sp-empty-images',
    commonName: 'Mystery Mushroom',
    images: [],
  },
];

// ---------------------------------------------------------------------------
// matchSpeciesImage — Specific Examples for SightingCard
// ---------------------------------------------------------------------------

describe('SightingCard species image matching', () => {
  describe('matched species', () => {
    it('returns first image when speciesGuess matches exactly', () => {
      const result = matchSpeciesImage('Chanterelle', knownSpecies);
      expect(result).toEqual({
        id: 'sp-chanterelle',
        image: '/images/species/sp-chanterelle.jpg',
      });
    });

    it('returns first image (not second) for species with multiple images', () => {
      const result = matchSpeciesImage('Chanterelle', knownSpecies);
      expect(result?.image).toBe('/images/species/sp-chanterelle.jpg');
      expect(result?.image).not.toBe('/images/species/sp-chanterelle-2.jpg');
    });

    it('matches plant records the same way as species records', () => {
      const result = matchSpeciesImage('Ramps', knownSpecies);
      expect(result).toEqual({
        id: 'pl-ramps',
        image: '/images/plants/pl-ramps.jpg',
      });
    });

    it('matches multi-word species names', () => {
      const result = matchSpeciesImage('Turkey Tail', knownSpecies);
      expect(result).toEqual({
        id: 'sp-turkey-tail',
        image: '/images/species/sp-turkey-tail.jpg',
      });
    });
  });

  describe('case variations', () => {
    it('matches lowercase guess', () => {
      const result = matchSpeciesImage('chanterelle', knownSpecies);
      expect(result?.id).toBe('sp-chanterelle');
    });

    it('matches uppercase guess', () => {
      const result = matchSpeciesImage('MOREL', knownSpecies);
      expect(result?.id).toBe('sp-morel');
    });

    it('matches mixed case guess', () => {
      const result = matchSpeciesImage('tUrKeY tAiL', knownSpecies);
      expect(result?.id).toBe('sp-turkey-tail');
    });

    it('matches all-caps multi-word guess', () => {
      const result = matchSpeciesImage('TURKEY TAIL', knownSpecies);
      expect(result?.id).toBe('sp-turkey-tail');
    });
  });

  describe('unmatched species (placeholder scenario)', () => {
    it('returns undefined for unknown species guess', () => {
      const result = matchSpeciesImage('Unknown Fungus', knownSpecies);
      expect(result).toBeUndefined();
    });

    it('returns undefined for partial name match', () => {
      // "Chant" is a substring of "Chanterelle" but not an exact match
      const result = matchSpeciesImage('Chant', knownSpecies);
      expect(result).toBeUndefined();
    });

    it('returns undefined for empty string', () => {
      const result = matchSpeciesImage('', knownSpecies);
      expect(result).toBeUndefined();
    });

    it('returns undefined when known species list is empty', () => {
      const result = matchSpeciesImage('Chanterelle', []);
      expect(result).toBeUndefined();
    });
  });

  describe('species with no images', () => {
    it('returns match with undefined image when species has empty images array', () => {
      const result = matchSpeciesImage('Mystery Mushroom', knownSpecies);
      expect(result).toBeDefined();
      expect(result?.id).toBe('sp-empty-images');
      expect(result?.image).toBeUndefined();
    });
  });
});
