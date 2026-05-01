/**
 * Global Search Result Correctness — Property-Based Test
 *
 * Feature: phase3-enhancements, Property 10: Global search result correctness
 *
 * For any query string of 3 or more characters and any dataset of species,
 * plants, trees, parks, and trails, the searchIndexedDB function shall return
 * only records where at least one searchable field (commonName, scientificName
 * for species/plants/trees; name for parks/trails) contains the query as a
 * case-insensitive substring. Results shall be grouped by category (Species,
 * Parks, Trails).
 *
 * **Validates: Requirements 15.2, 15.4, 15.7**
 */

import 'fake-indexeddb/auto';
import { describe, it, expect, beforeEach } from 'vitest';
import * as fc from 'fast-check';

import { webcrypto } from 'crypto';
if (typeof globalThis.crypto === 'undefined') {
  // @ts-expect-error — Node webcrypto is compatible enough for our usage
  globalThis.crypto = webcrypto;
}

import { searchIndexedDB, type SearchResultGroup } from '@/offline/search';
import { putRecord, getDB } from '@/offline/db';
import type { Species, Plant, Tree, Park, Trail } from '@/types';

// Feature: phase3-enhancements, Property 10: Global search result correctness

// ---------------------------------------------------------------------------
// Helpers — Record Factories
// ---------------------------------------------------------------------------

function makeSpecies(id: string, commonName: string, scientificName: string): Species {
  return {
    id,
    commonName,
    scientificName,
    category: 'mushroom',
    images: [`/images/species/${id}.jpg`],
    habitat: 'Forest',
    treeAssociations: ['Oak'],
    season: ['Fall'],
    region: 'East TN',
    regions: ['East TN'],
    identificationSteps: ['Step 1'],
    lookalikes: [],
    toxicLookalikes: [],
    sporePrint: 'White',
    edibilityLabel: 'unknown',
    safetyNotes: 'Verify with a qualified expert before consuming',
    sources: ['https://example.com'],
    lastUpdated: '2025-01-01T00:00:00Z',
  };
}

function makePlant(id: string, commonName: string, scientificName: string): Plant {
  return {
    id,
    commonName,
    scientificName,
    category: 'plant',
    images: [`/images/plants/${id}.jpg`],
    habitat: 'Forest',
    treeAssociations: ['Oak'],
    season: ['Spring'],
    region: 'Middle TN',
    regions: ['Middle TN'],
    identificationSteps: ['Step 1'],
    lookalikes: [],
    toxicLookalikes: [],
    edibilityLabel: 'unknown',
    safetyNotes: 'Verify with a qualified expert before consuming',
    sources: ['https://example.com'],
    lastUpdated: '2025-01-01T00:00:00Z',
  };
}

function makeTree(id: string, commonName: string, scientificName: string): Tree {
  return {
    id,
    commonName,
    scientificName,
    images: [`/images/trees/${id}.jpg`],
    habitat: 'Forest',
    barkDescription: 'Rough bark',
    leafDescription: 'Broad leaves',
    shapeDescription: 'Tall',
    associatedSpecies: [],
    region: 'West TN',
    lastUpdated: '2025-01-01T00:00:00Z',
  };
}

function makePark(id: string, name: string, region: string): Park {
  return {
    id,
    name,
    region,
    coordinates: { lat: 35.5, lng: -86.5 },
    amenities: [],
    trails: [],
    foragingRules: 'Follow park rules',
    lastUpdated: '2025-01-01T00:00:00Z',
  };
}

function makeTrail(id: string, name: string, parkId: string): Trail {
  return {
    id,
    parkId,
    name,
    distance: 2.5,
    difficulty: 'moderate',
    coordinates: [],
    likelyTrees: [],
    likelySpecies: [],
    images: [],
    lastUpdated: '2025-01-01T00:00:00Z',
  };
}

// ---------------------------------------------------------------------------
// Arbitraries
// ---------------------------------------------------------------------------

const ALPHA = 'abcdefghijklmnopqrstuvwxyz';

const arbName = fc
  .array(fc.constantFrom(...ALPHA.split('')), { minLength: 3, maxLength: 15 })
  .map((chars) => chars.join(''));

const arbQuery = fc
  .array(fc.constantFrom(...ALPHA.split('')), { minLength: 3, maxLength: 8 })
  .map((chars) => chars.join(''));

// ---------------------------------------------------------------------------
// Store Cleanup
// ---------------------------------------------------------------------------

async function clearAllStores() {
  const db = await getDB();
  await db.clear('species');
  await db.clear('plants');
  await db.clear('trees');
  await db.clear('parks');
  await db.clear('trails');
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

beforeEach(async () => {
  await clearAllStores();
});

describe('Feature: phase3-enhancements, Property 10: Global search result correctness', () => {
  it('returns only records whose searchable fields contain the query as a case-insensitive substring', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(fc.tuple(arbName, arbName), { minLength: 1, maxLength: 5 }),
        fc.array(fc.tuple(arbName, arbName), { minLength: 1, maxLength: 3 }),
        fc.array(fc.tuple(arbName, arbName), { minLength: 1, maxLength: 3 }),
        fc.array(arbName, { minLength: 1, maxLength: 3 }),
        fc.array(arbName, { minLength: 1, maxLength: 3 }),
        arbQuery,
        async (speciesData, plantData, treeData, parkNames, trailNames, query) => {
          await clearAllStores();

          // Seed species
          for (let i = 0; i < speciesData.length; i++) {
            const [cn, sn] = speciesData[i];
            await putRecord('species', makeSpecies(`sp-${i}`, cn, sn));
          }

          // Seed plants
          for (let i = 0; i < plantData.length; i++) {
            const [cn, sn] = plantData[i];
            await putRecord('plants', makePlant(`pl-${i}`, cn, sn));
          }

          // Seed trees
          for (let i = 0; i < treeData.length; i++) {
            const [cn, sn] = treeData[i];
            await putRecord('trees', makeTree(`tr-${i}`, cn, sn));
          }

          // Seed parks
          for (let i = 0; i < parkNames.length; i++) {
            await putRecord('parks', makePark(`pk-${i}`, parkNames[i], 'East TN'));
          }

          // Seed trails
          for (let i = 0; i < trailNames.length; i++) {
            await putRecord('trails', makeTrail(`tl-${i}`, trailNames[i], 'pk-0'));
          }

          const results = await searchIndexedDB({ query });
          const lowerQuery = query.toLowerCase();

          // Flatten all result items
          const allItems = results.flatMap((g) => g.items);

          // Verify every returned item has a matching field
          for (const item of allItems) {
            const titleMatch = item.title.toLowerCase().includes(lowerQuery);
            const subtitleMatch = item.subtitle.toLowerCase().includes(lowerQuery);
            expect(titleMatch || subtitleMatch).toBe(true);
          }

          // Verify results are grouped by valid categories
          for (const group of results) {
            expect(['Species', 'Parks', 'Trails']).toContain(group.category);
          }

          // Verify no matching record was missed:
          // Check species
          for (let i = 0; i < speciesData.length; i++) {
            const [cn, sn] = speciesData[i];
            if (cn.toLowerCase().includes(lowerQuery) || sn.toLowerCase().includes(lowerQuery)) {
              const found = allItems.some((item) => item.id === `sp-${i}`);
              expect(found).toBe(true);
            }
          }

          // Check plants
          for (let i = 0; i < plantData.length; i++) {
            const [cn, sn] = plantData[i];
            if (cn.toLowerCase().includes(lowerQuery) || sn.toLowerCase().includes(lowerQuery)) {
              const found = allItems.some((item) => item.id === `pl-${i}`);
              expect(found).toBe(true);
            }
          }

          // Check trees
          for (let i = 0; i < treeData.length; i++) {
            const [cn, sn] = treeData[i];
            if (cn.toLowerCase().includes(lowerQuery) || sn.toLowerCase().includes(lowerQuery)) {
              const found = allItems.some((item) => item.id === `tr-${i}`);
              expect(found).toBe(true);
            }
          }

          // Check parks
          for (let i = 0; i < parkNames.length; i++) {
            if (parkNames[i].toLowerCase().includes(lowerQuery)) {
              const found = allItems.some((item) => item.id === `pk-${i}`);
              expect(found).toBe(true);
            }
          }

          // Check trails
          for (let i = 0; i < trailNames.length; i++) {
            if (trailNames[i].toLowerCase().includes(lowerQuery)) {
              const found = allItems.some((item) => item.id === `tl-${i}`);
              expect(found).toBe(true);
            }
          }
        },
      ),
      { numRuns: 100 },
    );
  });

  it('groups species, plants, and trees under the Species category', async () => {
    await clearAllStores();

    // Seed one of each with a common substring
    await putRecord('species', makeSpecies('sp-test', 'testmushroom', 'Genus testus'));
    await putRecord('plants', makePlant('pl-test', 'testplant', 'Plantus testus'));
    await putRecord('trees', makeTree('tr-test', 'testtree', 'Treeus testus'));

    const results = await searchIndexedDB({ query: 'test' });

    const speciesGroup = results.find((g) => g.category === 'Species');
    expect(speciesGroup).toBeDefined();
    expect(speciesGroup!.items.length).toBe(3);

    const ids = speciesGroup!.items.map((i) => i.id);
    expect(ids).toContain('sp-test');
    expect(ids).toContain('pl-test');
    expect(ids).toContain('tr-test');
  });

  it('returns empty results for empty query', async () => {
    const results = await searchIndexedDB({ query: '' });
    expect(results).toEqual([]);
  });

  it('respects the per-store limit', async () => {
    await clearAllStores();

    // Seed 15 species all matching "abc"
    for (let i = 0; i < 15; i++) {
      await putRecord('species', makeSpecies(`sp-abc-${i}`, `abc species ${i}`, `Genus abc${i}`));
    }

    const results = await searchIndexedDB({ query: 'abc', limit: 5 });
    const speciesGroup = results.find((g) => g.category === 'Species');
    // Limit is per store, species store has 15 but limit is 5
    expect(speciesGroup).toBeDefined();
    expect(speciesGroup!.items.length).toBeLessThanOrEqual(5);
  });
});
