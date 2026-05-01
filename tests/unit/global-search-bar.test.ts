/**
 * GlobalSearchBar — Unit Tests
 *
 * Tests the pure functions that power the GlobalSearchBar component:
 * - searchIndexedDB: search across IndexedDB stores
 * - recentSearches: localStorage-backed recent search management
 *
 * Since @testing-library/react is not installed, we test the underlying
 * logic directly. The component wires these functions together with
 * React state and effects.
 *
 * **Validates: Requirements 15.1, 15.2, 15.3, 15.4, 15.5**
 */

import 'fake-indexeddb/auto';
import { describe, it, expect, beforeEach } from 'vitest';

import { webcrypto } from 'crypto';
if (typeof globalThis.crypto === 'undefined') {
  // @ts-expect-error — Node webcrypto is compatible enough for our usage
  globalThis.crypto = webcrypto;
}

import { searchIndexedDB } from '@/offline/search';
import {
  getRecentSearches,
  saveRecentSearch,
  clearRecentSearches,
  STORAGE_KEY,
  MAX_RECENT,
} from '@/offline/recentSearches';
import { putRecord, getDB } from '@/offline/db';
import type { Species, Park, Trail } from '@/types';

// ---------------------------------------------------------------------------
// localStorage polyfill for Node test environment
// ---------------------------------------------------------------------------

if (typeof globalThis.localStorage === 'undefined') {
  const store: Record<string, string> = {};
  globalThis.localStorage = {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => { store[key] = value; },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { for (const k of Object.keys(store)) delete store[k]; },
    get length() { return Object.keys(store).length; },
    key: (index: number) => Object.keys(store)[index] ?? null,
  };
}

// ---------------------------------------------------------------------------
// Test Data Factories
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

function makePark(id: string, name: string): Park {
  return {
    id,
    name,
    region: 'East TN',
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
    distance: 3.0,
    difficulty: 'moderate',
    coordinates: [],
    likelyTrees: [],
    likelySpecies: [],
    images: [],
    lastUpdated: '2025-01-01T00:00:00Z',
  };
}

// ---------------------------------------------------------------------------
// Helpers
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
// searchIndexedDB Tests
// ---------------------------------------------------------------------------

describe('searchIndexedDB', () => {
  beforeEach(async () => {
    await clearAllStores();
  });

  it('finds species by commonName (case-insensitive)', async () => {
    await putRecord('species', makeSpecies('sp-chanterelle', 'Chanterelle', 'Cantharellus cibarius'));
    await putRecord('species', makeSpecies('sp-morel', 'Morel', 'Morchella esculenta'));

    const results = await searchIndexedDB({ query: 'chant' });

    expect(results.length).toBeGreaterThan(0);
    const speciesGroup = results.find((g) => g.category === 'Species');
    expect(speciesGroup).toBeDefined();
    expect(speciesGroup!.items.some((i) => i.id === 'sp-chanterelle')).toBe(true);
    expect(speciesGroup!.items.some((i) => i.id === 'sp-morel')).toBe(false);
  });

  it('finds species by scientificName (case-insensitive)', async () => {
    await putRecord('species', makeSpecies('sp-chanterelle', 'Chanterelle', 'Cantharellus cibarius'));

    const results = await searchIndexedDB({ query: 'cantharellus' });

    const speciesGroup = results.find((g) => g.category === 'Species');
    expect(speciesGroup).toBeDefined();
    expect(speciesGroup!.items[0].id).toBe('sp-chanterelle');
  });

  it('finds parks by name', async () => {
    await putRecord('parks', makePark('pk-frozen-head', 'Frozen Head State Park'));
    await putRecord('parks', makePark('pk-fall-creek', 'Fall Creek Falls'));

    const results = await searchIndexedDB({ query: 'frozen' });

    const parksGroup = results.find((g) => g.category === 'Parks');
    expect(parksGroup).toBeDefined();
    expect(parksGroup!.items.length).toBe(1);
    expect(parksGroup!.items[0].id).toBe('pk-frozen-head');
  });

  it('finds trails by name', async () => {
    await putRecord('trails', makeTrail('tl-loop', 'Chimney Top Loop', 'pk-frozen-head'));
    await putRecord('trails', makeTrail('tl-falls', 'Waterfall Trail', 'pk-fall-creek'));

    const results = await searchIndexedDB({ query: 'chimney' });

    const trailsGroup = results.find((g) => g.category === 'Trails');
    expect(trailsGroup).toBeDefined();
    expect(trailsGroup!.items.length).toBe(1);
    expect(trailsGroup!.items[0].id).toBe('tl-loop');
  });

  it('returns results grouped by category', async () => {
    await putRecord('species', makeSpecies('sp-test', 'Test Mushroom', 'Testus fungus'));
    await putRecord('parks', makePark('pk-test', 'Test State Park'));
    await putRecord('trails', makeTrail('tl-test', 'Test Trail', 'pk-test'));

    const results = await searchIndexedDB({ query: 'test' });

    const categories = results.map((g) => g.category);
    expect(categories).toContain('Species');
    expect(categories).toContain('Parks');
    expect(categories).toContain('Trails');
  });

  it('returns empty array for empty query', async () => {
    const results = await searchIndexedDB({ query: '' });
    expect(results).toEqual([]);
  });

  it('returns empty array when no matches found', async () => {
    await putRecord('species', makeSpecies('sp-morel', 'Morel', 'Morchella esculenta'));

    const results = await searchIndexedDB({ query: 'zzzznotfound' });
    expect(results).toEqual([]);
  });

  it('respects the limit parameter per store', async () => {
    // Add 15 species all matching "alpha"
    for (let i = 0; i < 15; i++) {
      await putRecord('species', makeSpecies(`sp-alpha-${i}`, `Alpha Species ${i}`, `Genus alpha${i}`));
    }

    const results = await searchIndexedDB({ query: 'alpha', limit: 5 });
    const speciesGroup = results.find((g) => g.category === 'Species');
    expect(speciesGroup).toBeDefined();
    expect(speciesGroup!.items.length).toBeLessThanOrEqual(5);
  });

  it('default limit is 10 per store', async () => {
    for (let i = 0; i < 15; i++) {
      await putRecord('species', makeSpecies(`sp-beta-${i}`, `Beta Species ${i}`, `Genus beta${i}`));
    }

    const results = await searchIndexedDB({ query: 'beta' });
    const speciesGroup = results.find((g) => g.category === 'Species');
    expect(speciesGroup).toBeDefined();
    expect(speciesGroup!.items.length).toBeLessThanOrEqual(10);
  });

  it('search result items have correct href for species', async () => {
    await putRecord('species', makeSpecies('sp-morel', 'Morel', 'Morchella esculenta'));

    const results = await searchIndexedDB({ query: 'morel' });
    const speciesGroup = results.find((g) => g.category === 'Species');
    expect(speciesGroup!.items[0].href).toBe('/field-guide/sp-morel');
  });

  it('search result items have correct href for parks', async () => {
    await putRecord('parks', makePark('pk-frozen', 'Frozen Head'));

    const results = await searchIndexedDB({ query: 'frozen' });
    const parksGroup = results.find((g) => g.category === 'Parks');
    expect(parksGroup!.items[0].href).toBe('/map');
  });
});

// ---------------------------------------------------------------------------
// recentSearches Tests
// ---------------------------------------------------------------------------

describe('recentSearches', () => {
  beforeEach(() => {
    clearRecentSearches();
  });

  it('returns empty array when no searches saved', () => {
    expect(getRecentSearches()).toEqual([]);
  });

  it('saves and retrieves a search query', () => {
    saveRecentSearch('chanterelle');
    expect(getRecentSearches()).toEqual(['chanterelle']);
  });

  it('stores newest first', () => {
    saveRecentSearch('morel');
    saveRecentSearch('chanterelle');
    saveRecentSearch('reishi');

    const recent = getRecentSearches();
    expect(recent[0]).toBe('reishi');
    expect(recent[1]).toBe('chanterelle');
    expect(recent[2]).toBe('morel');
  });

  it('caps at MAX_RECENT entries', () => {
    for (let i = 0; i < 15; i++) {
      saveRecentSearch(`query-${i}`);
    }

    const recent = getRecentSearches();
    expect(recent.length).toBe(MAX_RECENT);
  });

  it('moves duplicate to front without creating a new entry', () => {
    saveRecentSearch('morel');
    saveRecentSearch('chanterelle');
    saveRecentSearch('reishi');
    saveRecentSearch('morel'); // duplicate

    const recent = getRecentSearches();
    expect(recent[0]).toBe('morel');
    expect(recent.filter((q) => q === 'morel').length).toBe(1);
    expect(recent.length).toBe(3);
  });

  it('ignores empty strings', () => {
    saveRecentSearch('');
    saveRecentSearch('   ');
    expect(getRecentSearches()).toEqual([]);
  });

  it('clearRecentSearches removes all entries', () => {
    saveRecentSearch('morel');
    saveRecentSearch('chanterelle');
    clearRecentSearches();
    expect(getRecentSearches()).toEqual([]);
  });

  it('uses the correct localStorage key', () => {
    saveRecentSearch('test');
    const raw = localStorage.getItem(STORAGE_KEY);
    expect(raw).toBeTruthy();
    const parsed = JSON.parse(raw!);
    expect(parsed).toContain('test');
  });
});
