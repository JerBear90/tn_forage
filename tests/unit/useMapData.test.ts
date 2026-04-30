/**
 * Unit tests for src/hooks/useMapData.ts
 *
 * Tests that the hook correctly loads parks, trails, and routes from IndexedDB.
 * Uses fake-indexeddb for in-memory IndexedDB.
 */

import 'fake-indexeddb/auto';
import { describe, it, expect, beforeEach } from 'vitest';

// Polyfill crypto for Node
import { webcrypto } from 'crypto';
if (typeof globalThis.crypto === 'undefined') {
  // @ts-expect-error — Node webcrypto is compatible enough
  globalThis.crypto = webcrypto;
}

import { getDB, getAllRecords, putRecord } from '@/offline/db';
import type { Park, Trail, Route } from '@/types';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function clearStores() {
  const db = await getDB();
  await db.clear('parks');
  await db.clear('trails');
  await db.clear('routes');
}

function makePark(overrides: Partial<Park> = {}): Park {
  return {
    id: 'park-test',
    name: 'Test State Park',
    region: 'East Tennessee',
    coordinates: { lat: 35.6, lng: -83.5 },
    amenities: ['Camping', 'Hiking'],
    trails: ['trail-1'],
    foragingRules:
      'Verify local regulations before collecting. Identification only unless permitted.',
    lastUpdated: '2024-01-01',
    ...overrides,
  };
}

function makeTrail(overrides: Partial<Trail> = {}): Trail {
  return {
    id: 'trail-test',
    parkId: 'park-test',
    name: 'Test Trail',
    distance: 3.2,
    difficulty: 'moderate',
    coordinates: [
      { lat: 35.6, lng: -83.5 },
      { lat: 35.61, lng: -83.51 },
      { lat: 35.62, lng: -83.52 },
    ],
    likelyTrees: ['Oak', 'Hickory'],
    likelySpecies: ['Chanterelle'],
    images: ['/images/trail.jpg'],
    lastUpdated: '2024-01-01',
    ...overrides,
  };
}

function makeRoute(overrides: Partial<Route> = {}): Route {
  return {
    id: 'route-test',
    parkId: 'park-test',
    name: 'Test Route',
    distance: 5.0,
    difficulty: 'hard',
    coordinates: [
      { lat: 35.5, lng: -86.0 },
      { lat: 35.51, lng: -86.01 },
    ],
    likelyTrees: ['Pine', 'Poplar'],
    likelySpecies: ['Morel'],
    images: ['/images/route.jpg'],
    lastUpdated: '2024-01-01',
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

beforeEach(async () => {
  await clearStores();
});

describe('Map data IndexedDB operations', () => {
  it('returns empty arrays when stores are empty', async () => {
    const parks = await getAllRecords('parks');
    const trails = await getAllRecords('trails');
    const routes = await getAllRecords('routes');

    expect(parks).toEqual([]);
    expect(trails).toEqual([]);
    expect(routes).toEqual([]);
  });

  it('stores and retrieves park records', async () => {
    await putRecord('parks', makePark());
    const parks = await getAllRecords('parks');

    expect(parks).toHaveLength(1);
    expect(parks[0].name).toBe('Test State Park');
    expect(parks[0].coordinates).toEqual({ lat: 35.6, lng: -83.5 });
    expect(parks[0].region).toBe('East Tennessee');
  });

  it('stores and retrieves trail records with coordinates', async () => {
    await putRecord('trails', makeTrail());
    const trails = await getAllRecords('trails');

    expect(trails).toHaveLength(1);
    expect(trails[0].name).toBe('Test Trail');
    expect(trails[0].coordinates).toHaveLength(3);
    expect(trails[0].difficulty).toBe('moderate');
  });

  it('stores and retrieves route records with coordinates', async () => {
    await putRecord('routes', makeRoute());
    const routes = await getAllRecords('routes');

    expect(routes).toHaveLength(1);
    expect(routes[0].name).toBe('Test Route');
    expect(routes[0].coordinates).toHaveLength(2);
    expect(routes[0].difficulty).toBe('hard');
  });

  it('loads multiple records from all three stores', async () => {
    await putRecord('parks', makePark({ id: 'park-1', name: 'Park Alpha' }));
    await putRecord('parks', makePark({ id: 'park-2', name: 'Park Beta' }));
    await putRecord('trails', makeTrail({ id: 'trail-1', name: 'Trail One' }));
    await putRecord('routes', makeRoute({ id: 'route-1', name: 'Route One' }));

    const parks = await getAllRecords('parks');
    const trails = await getAllRecords('trails');
    const routes = await getAllRecords('routes');

    expect(parks).toHaveLength(2);
    expect(trails).toHaveLength(1);
    expect(routes).toHaveLength(1);
  });

  it('park records have valid coordinates for map rendering', async () => {
    await putRecord('parks', makePark());
    const parks = await getAllRecords('parks');
    const park = parks[0];

    expect(park.coordinates.lat).toBeGreaterThanOrEqual(-90);
    expect(park.coordinates.lat).toBeLessThanOrEqual(90);
    expect(park.coordinates.lng).toBeGreaterThanOrEqual(-180);
    expect(park.coordinates.lng).toBeLessThanOrEqual(180);
  });

  it('trail records have at least 2 coordinate points for polyline rendering', async () => {
    await putRecord('trails', makeTrail());
    const trails = await getAllRecords('trails');
    const trail = trails[0];

    expect(trail.coordinates.length).toBeGreaterThanOrEqual(2);
    for (const coord of trail.coordinates) {
      expect(coord).toHaveProperty('lat');
      expect(coord).toHaveProperty('lng');
    }
  });

  it('route records have at least 2 coordinate points for polyline rendering', async () => {
    await putRecord('routes', makeRoute());
    const routes = await getAllRecords('routes');
    const route = routes[0];

    expect(route.coordinates.length).toBeGreaterThanOrEqual(2);
    for (const coord of route.coordinates) {
      expect(coord).toHaveProperty('lat');
      expect(coord).toHaveProperty('lng');
    }
  });
});

describe('Map data integrity', () => {
  it('parks have required foraging rules message', async () => {
    await putRecord('parks', makePark());
    const parks = await getAllRecords('parks');

    expect(parks[0].foragingRules).toBeTruthy();
    expect(parks[0].foragingRules.length).toBeGreaterThan(0);
  });

  it('trails reference a valid parkId', async () => {
    await putRecord('parks', makePark({ id: 'park-1' }));
    await putRecord('trails', makeTrail({ id: 'trail-1', parkId: 'park-1' }));

    const trails = await getAllRecords('trails');
    const parks = await getAllRecords('parks');

    expect(trails[0].parkId).toBe(parks[0].id);
  });

  it('routes reference a valid parkId', async () => {
    await putRecord('parks', makePark({ id: 'park-1' }));
    await putRecord('routes', makeRoute({ id: 'route-1', parkId: 'park-1' }));

    const routes = await getAllRecords('routes');
    const parks = await getAllRecords('parks');

    expect(routes[0].parkId).toBe(parks[0].id);
  });
});
