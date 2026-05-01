/**
 * aggregateTrendingSpecies & matchSpeciesImage — Unit Tests
 *
 * Verifies the trending species aggregation utility correctly filters
 * sightings to the current month, groups case-insensitively, sorts by
 * count descending, matches known species for images, and caps at top N.
 *
 * **Validates: Requirements 8.2, 8.3**
 */

import { describe, it, expect } from 'vitest';
import {
  aggregateTrendingSpecies,
  matchSpeciesImage,
  type KnownSpeciesRecord,
} from '@/services/trending';
import type { CommunityDraft } from '@/types';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeSighting(
  id: string,
  speciesGuess: string,
  createdAt: string,
): CommunityDraft {
  return {
    id,
    userId: 'user-1',
    speciesGuess,
    photos: [],
    notes: '',
    visibility: 'public',
    createdAt,
    updatedAt: createdAt,
  };
}

function currentMonthDate(day: number = 15): string {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), day).toISOString();
}

function lastMonthDate(day: number = 15): string {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth() - 1, day).toISOString();
}

const knownSpecies: KnownSpeciesRecord[] = [
  { id: 'sp-chanterelle', commonName: 'Chanterelle', images: ['/images/species/sp-chanterelle.jpg'] },
  { id: 'sp-morel', commonName: 'Morel', images: ['/images/species/sp-morel.jpg'] },
  { id: 'sp-reishi', commonName: 'Reishi', images: ['/images/species/sp-reishi.jpg'] },
  { id: 'sp-turkey-tail', commonName: 'Turkey Tail', images: ['/images/species/sp-turkey-tail.jpg'] },
  { id: 'sp-no-image', commonName: 'No Image Mushroom', images: [] },
];

// ---------------------------------------------------------------------------
// matchSpeciesImage
// ---------------------------------------------------------------------------

describe('matchSpeciesImage', () => {
  it('returns matched species with first image on exact case match', () => {
    const result = matchSpeciesImage('Chanterelle', knownSpecies);
    expect(result).toEqual({
      id: 'sp-chanterelle',
      image: '/images/species/sp-chanterelle.jpg',
    });
  });

  it('matches case-insensitively', () => {
    const result = matchSpeciesImage('chanterelle', knownSpecies);
    expect(result).toEqual({
      id: 'sp-chanterelle',
      image: '/images/species/sp-chanterelle.jpg',
    });

    const result2 = matchSpeciesImage('MOREL', knownSpecies);
    expect(result2).toEqual({
      id: 'sp-morel',
      image: '/images/species/sp-morel.jpg',
    });
  });

  it('returns undefined for no match', () => {
    const result = matchSpeciesImage('Unknown Fungus', knownSpecies);
    expect(result).toBeUndefined();
  });

  it('returns undefined for empty string', () => {
    const result = matchSpeciesImage('', knownSpecies);
    expect(result).toBeUndefined();
  });

  it('returns undefined image when species has no images', () => {
    const result = matchSpeciesImage('No Image Mushroom', knownSpecies);
    expect(result).toEqual({
      id: 'sp-no-image',
      image: undefined,
    });
  });
});

// ---------------------------------------------------------------------------
// aggregateTrendingSpecies
// ---------------------------------------------------------------------------

describe('aggregateTrendingSpecies', () => {
  it('filters sightings to current calendar month only', () => {
    const sightings = [
      makeSighting('s1', 'Chanterelle', currentMonthDate(1)),
      makeSighting('s2', 'Morel', lastMonthDate(15)),
      makeSighting('s3', 'Chanterelle', currentMonthDate(20)),
    ];

    const result = aggregateTrendingSpecies(sightings, knownSpecies);

    // Only current month sightings counted — Chanterelle: 2, Morel excluded
    expect(result).toHaveLength(1);
    expect(result[0].speciesGuess).toBe('Chanterelle');
    expect(result[0].count).toBe(2);
  });

  it('groups by case-insensitive speciesGuess', () => {
    const sightings = [
      makeSighting('s1', 'Chanterelle', currentMonthDate(1)),
      makeSighting('s2', 'chanterelle', currentMonthDate(2)),
      makeSighting('s3', 'CHANTERELLE', currentMonthDate(3)),
    ];

    const result = aggregateTrendingSpecies(sightings, knownSpecies);

    expect(result).toHaveLength(1);
    expect(result[0].count).toBe(3);
    // Display name should be the first occurrence
    expect(result[0].speciesGuess).toBe('Chanterelle');
  });

  it('sorts by count descending', () => {
    const sightings = [
      makeSighting('s1', 'Morel', currentMonthDate(1)),
      makeSighting('s2', 'Chanterelle', currentMonthDate(2)),
      makeSighting('s3', 'Chanterelle', currentMonthDate(3)),
      makeSighting('s4', 'Chanterelle', currentMonthDate(4)),
      makeSighting('s5', 'Morel', currentMonthDate(5)),
      makeSighting('s6', 'Reishi', currentMonthDate(6)),
    ];

    const result = aggregateTrendingSpecies(sightings, knownSpecies);

    expect(result[0].speciesGuess).toBe('Chanterelle');
    expect(result[0].count).toBe(3);
    expect(result[1].speciesGuess).toBe('Morel');
    expect(result[1].count).toBe(2);
    expect(result[2].speciesGuess).toBe('Reishi');
    expect(result[2].count).toBe(1);
  });

  it('returns top N results (default 3)', () => {
    const sightings = [
      makeSighting('s1', 'Chanterelle', currentMonthDate(1)),
      makeSighting('s2', 'Chanterelle', currentMonthDate(2)),
      makeSighting('s3', 'Morel', currentMonthDate(3)),
      makeSighting('s4', 'Morel', currentMonthDate(4)),
      makeSighting('s5', 'Reishi', currentMonthDate(5)),
      makeSighting('s6', 'Turkey Tail', currentMonthDate(6)),
      makeSighting('s7', 'Unknown Fungus', currentMonthDate(7)),
    ];

    const result = aggregateTrendingSpecies(sightings, knownSpecies);

    expect(result).toHaveLength(3);
  });

  it('respects custom topN parameter', () => {
    const sightings = [
      makeSighting('s1', 'Chanterelle', currentMonthDate(1)),
      makeSighting('s2', 'Morel', currentMonthDate(2)),
      makeSighting('s3', 'Reishi', currentMonthDate(3)),
      makeSighting('s4', 'Turkey Tail', currentMonthDate(4)),
    ];

    const result = aggregateTrendingSpecies(sightings, knownSpecies, 2);
    expect(result).toHaveLength(2);

    const resultAll = aggregateTrendingSpecies(sightings, knownSpecies, 10);
    expect(resultAll).toHaveLength(4);
  });

  it('matches known species for images', () => {
    const sightings = [
      makeSighting('s1', 'Chanterelle', currentMonthDate(1)),
    ];

    const result = aggregateTrendingSpecies(sightings, knownSpecies);

    expect(result[0].matchedSpeciesId).toBe('sp-chanterelle');
    expect(result[0].image).toBe('/images/species/sp-chanterelle.jpg');
  });

  it('handles unmatched species guess gracefully', () => {
    const sightings = [
      makeSighting('s1', 'Unknown Fungus', currentMonthDate(1)),
    ];

    const result = aggregateTrendingSpecies(sightings, knownSpecies);

    expect(result).toHaveLength(1);
    expect(result[0].speciesGuess).toBe('Unknown Fungus');
    expect(result[0].matchedSpeciesId).toBeUndefined();
    expect(result[0].image).toBeUndefined();
  });

  it('skips sightings without speciesGuess', () => {
    const sightings = [
      makeSighting('s1', 'Chanterelle', currentMonthDate(1)),
      { ...makeSighting('s2', '', currentMonthDate(2)), speciesGuess: undefined },
      makeSighting('s3', 'Chanterelle', currentMonthDate(3)),
    ];

    const result = aggregateTrendingSpecies(sightings, knownSpecies);

    expect(result).toHaveLength(1);
    expect(result[0].count).toBe(2);
  });

  it('returns empty array when no sightings in current month', () => {
    const sightings = [
      makeSighting('s1', 'Chanterelle', lastMonthDate(1)),
      makeSighting('s2', 'Morel', lastMonthDate(15)),
    ];

    const result = aggregateTrendingSpecies(sightings, knownSpecies);
    expect(result).toEqual([]);
  });

  it('returns empty array for empty sightings input', () => {
    const result = aggregateTrendingSpecies([], knownSpecies);
    expect(result).toEqual([]);
  });

  it('returns empty array for empty known species', () => {
    const sightings = [
      makeSighting('s1', 'Chanterelle', currentMonthDate(1)),
    ];

    // Should still return the trending species, just without matched images
    const result = aggregateTrendingSpecies(sightings, []);
    expect(result).toHaveLength(1);
    expect(result[0].speciesGuess).toBe('Chanterelle');
    expect(result[0].matchedSpeciesId).toBeUndefined();
    expect(result[0].image).toBeUndefined();
  });
});
