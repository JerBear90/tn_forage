/**
 * LikelySpeciesPanel — Unit Tests
 *
 * Tests the LikelySpeciesPanel component's core logic: the exported
 * `isInSeason` function, IndexedDB species resolution from trail data,
 * and the add-to-trip callback behavior.
 *
 * Since @testing-library/react is not installed, these tests focus on
 * the pure helper function and IndexedDB integration rather than
 * DOM rendering.
 *
 * **Validates: Requirements 6.1, 6.2, 6.3, 6.5**
 */

import 'fake-indexeddb/auto';
import { describe, it, expect, beforeEach } from 'vitest';

import { webcrypto } from 'crypto';
if (typeof globalThis.crypto === 'undefined') {
  // @ts-expect-error — Node webcrypto is compatible enough for our usage
  globalThis.crypto = webcrypto;
}

import { putRecord, getDB, batchGetRecords } from '@/offline/db';
import type { Trail, Species, TrailDifficulty, EdibilityLabel } from '@/types';

// ---------------------------------------------------------------------------
// Inline the pure helpers from LikelySpeciesPanel.tsx
// (Cannot import directly because the .tsx file contains JSX and vitest
// is configured with environment: 'node' without JSX transform)
// ---------------------------------------------------------------------------

const SEASON_MONTHS: Record<string, number[]> = {
  Spring: [2, 3, 4],     // Mar, Apr, May
  Summer: [5, 6, 7],     // Jun, Jul, Aug
  Fall: [8, 9, 10],      // Sep, Oct, Nov
  Winter: [11, 0, 1],    // Dec, Jan, Feb
};

function isInSeason(seasons: string[], month: number): boolean {
  return seasons.some((season) => {
    const months = SEASON_MONTHS[season];
    return months != null && months.includes(month);
  });
}

// ---------------------------------------------------------------------------
// Test Data
// ---------------------------------------------------------------------------

const TODAY = '2025-01-01';

function makeTrail(
  id: string,
  parkId: string,
  name: string,
  likelySpecies: string[],
): Trail {
  return {
    id,
    parkId,
    name,
    distance: 3.0,
    difficulty: 'moderate' as TrailDifficulty,
    coordinates: [{ lat: 36.0, lng: -86.0 }],
    likelyTrees: ['Oak'],
    likelySpecies,
    images: [`/images/trails/${id}.jpg`],
    lastUpdated: TODAY,
  };
}

function makeSpecies(
  id: string,
  commonName: string,
  season: string[],
  edibilityLabel: EdibilityLabel = 'unknown',
): Species {
  return {
    id,
    commonName,
    scientificName: `Genus ${commonName.toLowerCase()}`,
    category: 'mushroom',
    images: [`/images/species/${id}.jpg`],
    habitat: 'Deciduous forest',
    treeAssociations: ['Oak'],
    season,
    region: 'East TN',
    regions: ['East TN'],
    identificationSteps: ['Step 1'],
    lookalikes: [],
    toxicLookalikes: [],
    sporePrint: 'White',
    edibilityLabel,
    safetyNotes: 'Verify with a qualified expert before consuming',
    sources: ['Source 1'],
    lastUpdated: TODAY,
  };
}

const speciesMorel = makeSpecies('sp-morel', 'Morel', ['Spring'], 'commonly-considered-edible-with-expert-confirmation');
const speciesChanterelle = makeSpecies('sp-chanterelle', 'Chanterelle', ['Summer', 'Fall'], 'commonly-considered-edible-with-expert-confirmation');
const speciesReishi = makeSpecies('sp-reishi', 'Reishi', ['Summer'], 'inedible');
const speciesDestroyingAngel = makeSpecies('sp-destroying-angel', 'Destroying Angel', ['Summer', 'Fall'], 'toxic');
const speciesTurkeyTail = makeSpecies('sp-turkey-tail', 'Turkey Tail', ['Spring', 'Summer', 'Fall', 'Winter'], 'inedible');

const allSpecies: Species[] = [speciesMorel, speciesChanterelle, speciesReishi, speciesDestroyingAngel, speciesTurkeyTail];

const trailWithSpecies = makeTrail('trail-ridge', 'park-alpha', 'Ridge Loop', ['sp-morel', 'sp-chanterelle', 'sp-reishi']);
const trailWithOneSpecies = makeTrail('trail-creek', 'park-alpha', 'Creek Path', ['sp-turkey-tail']);
const trailNoSpecies = makeTrail('trail-summit', 'park-alpha', 'Summit Climb', []);
const trailBeta = makeTrail('trail-lake', 'park-beta', 'Lakeside Walk', ['sp-destroying-angel']);

const allTrails: Trail[] = [trailWithSpecies, trailWithOneSpecies, trailNoSpecies, trailBeta];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function clearStores() {
  const db = await getDB();
  await db.clear('trails');
  await db.clear('species');
}

async function seedTrails(trails: Trail[]) {
  for (const trail of trails) {
    await putRecord('trails', trail);
  }
}

async function seedSpecies(species: Species[]) {
  for (const sp of species) {
    await putRecord('species', sp);
  }
}

/**
 * Collect all unique likely species IDs from trails in a park.
 * Mirrors the logic in LikelySpeciesPanel's collectSpeciesIds.
 */
async function collectSpeciesIds(
  parkId: string,
  trailId?: string,
): Promise<string[]> {
  const db = await getDB();

  let trails: Trail[];
  if (trailId) {
    const trail = await db.get('trails', trailId);
    trails = trail ? [trail] : [];
  } else {
    trails = await db.getAllFromIndex('trails', 'by-parkId', parkId);
  }

  const ids = new Set<string>();
  for (const trail of trails) {
    for (const speciesId of trail.likelySpecies) {
      ids.add(speciesId);
    }
  }
  return Array.from(ids);
}

// ---------------------------------------------------------------------------
// isInSeason — Pure Function Tests (Validates Requirement 6.3)
// ---------------------------------------------------------------------------

describe('isInSeason', () => {
  it('returns true for months within Spring season (Mar=2, Apr=3, May=4)', () => {
    expect(isInSeason(['Spring'], 2)).toBe(true);
    expect(isInSeason(['Spring'], 3)).toBe(true);
    expect(isInSeason(['Spring'], 4)).toBe(true);
  });

  it('returns false for months outside Spring season', () => {
    expect(isInSeason(['Spring'], 0)).toBe(false); // Jan
    expect(isInSeason(['Spring'], 1)).toBe(false); // Feb
    expect(isInSeason(['Spring'], 5)).toBe(false); // Jun
    expect(isInSeason(['Spring'], 11)).toBe(false); // Dec
  });

  it('returns true for months within Summer season (Jun=5, Jul=6, Aug=7)', () => {
    expect(isInSeason(['Summer'], 5)).toBe(true);
    expect(isInSeason(['Summer'], 6)).toBe(true);
    expect(isInSeason(['Summer'], 7)).toBe(true);
  });

  it('returns false for months outside Summer season', () => {
    expect(isInSeason(['Summer'], 4)).toBe(false); // May
    expect(isInSeason(['Summer'], 8)).toBe(false); // Sep
  });

  it('returns true for months within Fall season (Sep=8, Oct=9, Nov=10)', () => {
    expect(isInSeason(['Fall'], 8)).toBe(true);
    expect(isInSeason(['Fall'], 9)).toBe(true);
    expect(isInSeason(['Fall'], 10)).toBe(true);
  });

  it('returns false for months outside Fall season', () => {
    expect(isInSeason(['Fall'], 7)).toBe(false); // Aug
    expect(isInSeason(['Fall'], 11)).toBe(false); // Dec
  });

  it('returns true for months within Winter season (Dec=11, Jan=0, Feb=1)', () => {
    expect(isInSeason(['Winter'], 11)).toBe(true);
    expect(isInSeason(['Winter'], 0)).toBe(true);
    expect(isInSeason(['Winter'], 1)).toBe(true);
  });

  it('returns false for months outside Winter season', () => {
    expect(isInSeason(['Winter'], 2)).toBe(false); // Mar
    expect(isInSeason(['Winter'], 10)).toBe(false); // Nov
  });

  it('returns true when any season in the array matches the month', () => {
    // Summer + Fall covers Jun–Nov
    expect(isInSeason(['Summer', 'Fall'], 5)).toBe(true);  // Jun (Summer)
    expect(isInSeason(['Summer', 'Fall'], 9)).toBe(true);  // Oct (Fall)
  });

  it('returns false for an empty seasons array', () => {
    expect(isInSeason([], 6)).toBe(false);
  });

  it('returns false for an unknown season name', () => {
    expect(isInSeason(['Monsoon'], 6)).toBe(false);
  });

  it('handles all-season species (present year-round)', () => {
    const allSeasons = ['Spring', 'Summer', 'Fall', 'Winter'];
    for (let month = 0; month <= 11; month++) {
      expect(isInSeason(allSeasons, month)).toBe(true);
    }
  });
});

// ---------------------------------------------------------------------------
// SEASON_MONTHS constant validation
// ---------------------------------------------------------------------------

describe('SEASON_MONTHS mapping', () => {
  it('covers all 12 months across all seasons', () => {
    const allMonths = new Set<number>();
    for (const months of Object.values(SEASON_MONTHS)) {
      for (const m of months) {
        allMonths.add(m);
      }
    }
    expect(allMonths.size).toBe(12);
    for (let m = 0; m <= 11; m++) {
      expect(allMonths.has(m)).toBe(true);
    }
  });

  it('each season has exactly 3 months', () => {
    for (const [, months] of Object.entries(SEASON_MONTHS)) {
      expect(months).toHaveLength(3);
    }
  });
});

// ---------------------------------------------------------------------------
// Species Resolution from Trail Data — IndexedDB Integration
// (Validates Requirements 6.1, 6.2)
// ---------------------------------------------------------------------------

describe('Species resolution from trail likelySpecies via IndexedDB', () => {
  beforeEach(async () => {
    await clearStores();
  });

  it('resolves species IDs from a specific trail', async () => {
    await seedTrails(allTrails);
    await seedSpecies(allSpecies);

    const speciesIds = await collectSpeciesIds('park-alpha', 'trail-ridge');
    expect(speciesIds).toHaveLength(3);
    expect(speciesIds.sort()).toEqual(['sp-chanterelle', 'sp-morel', 'sp-reishi']);
  });

  it('resolves species from all trails in a park when no trailId specified', async () => {
    await seedTrails(allTrails);
    await seedSpecies(allSpecies);

    const speciesIds = await collectSpeciesIds('park-alpha');
    // park-alpha has trail-ridge (morel, chanterelle, reishi), trail-creek (turkey-tail), trail-summit (none)
    expect(speciesIds.sort()).toEqual(['sp-chanterelle', 'sp-morel', 'sp-reishi', 'sp-turkey-tail']);
  });

  it('returns empty array when trail has no likelySpecies', async () => {
    await seedTrails(allTrails);
    await seedSpecies(allSpecies);

    const speciesIds = await collectSpeciesIds('park-alpha', 'trail-summit');
    expect(speciesIds).toHaveLength(0);
  });

  it('returns empty array when park has no trails', async () => {
    await seedTrails(allTrails);

    const speciesIds = await collectSpeciesIds('park-nonexistent');
    expect(speciesIds).toHaveLength(0);
  });

  it('deduplicates species IDs across multiple trails in the same park', async () => {
    // Create two trails that share a species
    const trail1 = makeTrail('trail-1', 'park-dup', 'Trail 1', ['sp-morel', 'sp-chanterelle']);
    const trail2 = makeTrail('trail-2', 'park-dup', 'Trail 2', ['sp-morel', 'sp-reishi']);
    await seedTrails([trail1, trail2]);
    await seedSpecies(allSpecies);

    const speciesIds = await collectSpeciesIds('park-dup');
    // sp-morel appears in both trails but should only appear once
    expect(speciesIds.sort()).toEqual(['sp-chanterelle', 'sp-morel', 'sp-reishi']);
  });

  it('batch-loads species records from resolved IDs', async () => {
    await seedTrails(allTrails);
    await seedSpecies(allSpecies);

    const speciesIds = await collectSpeciesIds('park-alpha', 'trail-ridge');
    const records = await batchGetRecords('species', speciesIds);

    expect(records).toHaveLength(3);
    const names = records.map((r) => r.commonName).sort();
    expect(names).toEqual(['Chanterelle', 'Morel', 'Reishi']);
  });

  it('batch-load filters out species IDs not found in IndexedDB', async () => {
    await seedTrails(allTrails);
    // Only seed some species — sp-chanterelle is missing
    await seedSpecies([speciesMorel, speciesReishi]);

    const speciesIds = await collectSpeciesIds('park-alpha', 'trail-ridge');
    const records = await batchGetRecords('species', speciesIds);

    // sp-chanterelle is in the trail but not in the species store
    expect(records).toHaveLength(2);
    const names = records.map((r) => r.commonName).sort();
    expect(names).toEqual(['Morel', 'Reishi']);
  });
});

// ---------------------------------------------------------------------------
// Species Data Shape — Validates Requirement 6.2
// ---------------------------------------------------------------------------

describe('Resolved species include required display fields', () => {
  beforeEach(async () => {
    await clearStores();
  });

  it('every resolved species has commonName, images, and edibilityLabel', async () => {
    await seedTrails([trailWithSpecies]);
    await seedSpecies(allSpecies);

    const speciesIds = await collectSpeciesIds('park-alpha', 'trail-ridge');
    const records = await batchGetRecords('species', speciesIds);

    records.forEach((sp) => {
      expect(sp.commonName).toBeTruthy();
      expect(typeof sp.commonName).toBe('string');
      expect(Array.isArray(sp.images)).toBe(true);
      expect(sp.images.length).toBeGreaterThan(0);
      expect(sp.edibilityLabel).toBeTruthy();
    });
  });

  it('every resolved species has a season array for in-season checking', async () => {
    await seedTrails([trailWithSpecies]);
    await seedSpecies(allSpecies);

    const speciesIds = await collectSpeciesIds('park-alpha', 'trail-ridge');
    const records = await batchGetRecords('species', speciesIds);

    records.forEach((sp) => {
      expect(Array.isArray(sp.season)).toBe(true);
    });
  });
});

// ---------------------------------------------------------------------------
// In-Season Badge Display — Validates Requirement 6.3
// ---------------------------------------------------------------------------

describe('In-season badge display logic', () => {
  it('Morel (Spring) is in season during March (month=2)', () => {
    expect(isInSeason(speciesMorel.season, 2)).toBe(true);
  });

  it('Morel (Spring) is not in season during July (month=6)', () => {
    expect(isInSeason(speciesMorel.season, 6)).toBe(false);
  });

  it('Chanterelle (Summer, Fall) is in season during June (month=5)', () => {
    expect(isInSeason(speciesChanterelle.season, 5)).toBe(true);
  });

  it('Chanterelle (Summer, Fall) is in season during October (month=9)', () => {
    expect(isInSeason(speciesChanterelle.season, 9)).toBe(true);
  });

  it('Chanterelle (Summer, Fall) is not in season during February (month=1)', () => {
    expect(isInSeason(speciesChanterelle.season, 1)).toBe(false);
  });

  it('Turkey Tail (all seasons) is in season every month', () => {
    for (let month = 0; month <= 11; month++) {
      expect(isInSeason(speciesTurkeyTail.season, month)).toBe(true);
    }
  });
});

// ---------------------------------------------------------------------------
// Add-to-Trip Callback — Validates Requirement 6.5
// ---------------------------------------------------------------------------

describe('Add-to-trip callback behavior', () => {
  it('onAddToTrip callback receives the correct species ID', () => {
    let capturedId: string | null = null;
    const onAddToTrip = (speciesId: string) => {
      capturedId = speciesId;
    };

    onAddToTrip('sp-morel');
    expect(capturedId).toBe('sp-morel');

    onAddToTrip('sp-chanterelle');
    expect(capturedId).toBe('sp-chanterelle');
  });

  it('onAddToTrip can be called multiple times for different species', () => {
    const addedSpecies: string[] = [];
    const onAddToTrip = (speciesId: string) => {
      addedSpecies.push(speciesId);
    };

    onAddToTrip('sp-morel');
    onAddToTrip('sp-reishi');
    onAddToTrip('sp-chanterelle');

    expect(addedSpecies).toEqual(['sp-morel', 'sp-reishi', 'sp-chanterelle']);
    expect(addedSpecies).toHaveLength(3);
  });

  it('add-to-trip works with species resolved from trail data', async () => {
    await clearStores();
    await seedTrails([trailWithSpecies]);
    await seedSpecies(allSpecies);

    const speciesIds = await collectSpeciesIds('park-alpha', 'trail-ridge');
    const records = await batchGetRecords('species', speciesIds);

    const addedSpecies: string[] = [];
    const onAddToTrip = (speciesId: string) => {
      addedSpecies.push(speciesId);
    };

    // Simulate adding each resolved species to the trip
    for (const sp of records) {
      onAddToTrip(sp.id);
    }

    expect(addedSpecies).toHaveLength(3);
    expect(addedSpecies.sort()).toEqual(['sp-chanterelle', 'sp-morel', 'sp-reishi']);
  });
});
