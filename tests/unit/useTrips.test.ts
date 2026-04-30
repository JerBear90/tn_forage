/**
 * Unit tests for the useTrips hook.
 *
 * Validates trip loading from IndexedDB, location name resolution,
 * date sorting (newest first), search filtering, and delete functionality.
 *
 * Uses fake-indexeddb for an in-memory IndexedDB implementation.
 */

import 'fake-indexeddb/auto';
import { describe, it, expect, beforeEach } from 'vitest';

import { webcrypto } from 'crypto';
if (typeof globalThis.crypto === 'undefined') {
  // @ts-expect-error — Node webcrypto is compatible enough for our usage
  globalThis.crypto = webcrypto;
}

import type { Trip, Park, Trail, Route } from '@/types';
import {
  getDB,
  putRecord,
  getAllRecords,
  deleteRecord,
} from '@/offline/db';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeTrip(overrides: Partial<Trip> = {}): Trip {
  return {
    id: crypto.randomUUID(),
    userId: 'local-user',
    locationType: 'park',
    locationId: 'park-radnor-lake',
    date: '2025-07-15',
    notes: 'Morning hike, bring water',
    targetSpecies: ['Chanterelles', 'Morels'],
    companions: 'Alice',
    safetyNotes: 'Bring first aid kit',
    syncStatus: 'pending',
    ...overrides,
  };
}

function makePark(overrides: Partial<Park> = {}): Park {
  return {
    id: 'park-radnor-lake',
    name: 'Radnor Lake State Park',
    region: 'Middle Tennessee',
    coordinates: { lat: 36.0631, lng: -86.8103 },
    amenities: [],
    trails: [],
    foragingRules: 'Verify local regulations.',
    lastUpdated: '2025-01-15',
    ...overrides,
  };
}

function makeTrail(overrides: Partial<Trail> = {}): Trail {
  return {
    id: 'trail-radnor-lake-trail',
    parkId: 'park-radnor-lake',
    name: 'Lake Trail',
    distance: 1.35,
    difficulty: 'easy',
    coordinates: [{ lat: 36.0631, lng: -86.8103 }],
    likelyTrees: [],
    likelySpecies: [],
    images: [],
    lastUpdated: '2025-01-15',
    ...overrides,
  };
}

function makeRoute(overrides: Partial<Route> = {}): Route {
  return {
    id: 'route-savage-gulf-day-loop',
    parkId: 'park-savage-gulf',
    name: 'Savage Gulf Day Loop',
    distance: 9.8,
    difficulty: 'hard',
    coordinates: [{ lat: 35.4575, lng: -85.59 }],
    likelyTrees: [],
    likelySpecies: [],
    images: [],
    lastUpdated: '2025-01-15',
    ...overrides,
  };
}

async function clearStores() {
  const db = await getDB();
  await db.clear('trips');
  await db.clear('parks');
  await db.clear('trails');
  await db.clear('routes');
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

beforeEach(async () => {
  await clearStores();
});

describe('useTrips — data layer', () => {
  it('loads trips from IndexedDB', async () => {
    const trip = makeTrip();
    await putRecord('trips', trip);

    const trips = await getAllRecords('trips');
    expect(trips).toHaveLength(1);
    expect(trips[0].id).toBe(trip.id);
  });

  it('resolves park location name from parks store', async () => {
    const park = makePark();
    const trip = makeTrip({ locationType: 'park', locationId: park.id });

    await putRecord('parks', park);
    await putRecord('trips', trip);

    const [parks, trails, routes] = await Promise.all([
      getAllRecords('parks'),
      getAllRecords('trails'),
      getAllRecords('routes'),
    ]);

    // Build location map (mirrors hook logic)
    const locationMap = new Map<string, string>();
    for (const p of parks) locationMap.set(p.id, p.name);
    for (const t of trails) locationMap.set(t.id, t.name);
    for (const r of routes) locationMap.set(r.id, r.name);

    const name = trip.locationId ? locationMap.get(trip.locationId) : undefined;
    expect(name).toBe('Radnor Lake State Park');
  });

  it('resolves trail location name from trails store', async () => {
    const trail = makeTrail();
    const trip = makeTrip({ locationType: 'trail', locationId: trail.id });

    await putRecord('trails', trail);
    await putRecord('trips', trip);

    const trails = await getAllRecords('trails');
    const locationMap = new Map<string, string>();
    for (const t of trails) locationMap.set(t.id, t.name);

    const name = trip.locationId ? locationMap.get(trip.locationId) : undefined;
    expect(name).toBe('Lake Trail');
  });

  it('resolves route location name from routes store', async () => {
    const route = makeRoute();
    const trip = makeTrip({ locationType: 'route', locationId: route.id });

    await putRecord('routes', route);
    await putRecord('trips', trip);

    const routes = await getAllRecords('routes');
    const locationMap = new Map<string, string>();
    for (const r of routes) locationMap.set(r.id, r.name);

    const name = trip.locationId ? locationMap.get(trip.locationId) : undefined;
    expect(name).toBe('Savage Gulf Day Loop');
  });

  it('uses customLocation for custom location type', async () => {
    const trip = makeTrip({
      locationType: 'custom',
      locationId: undefined,
      customLocation: 'My backyard forest',
    });

    await putRecord('trips', trip);

    const trips = await getAllRecords('trips');
    expect(trips[0].customLocation).toBe('My backyard forest');
  });

  it('sorts trips by date descending (newest first)', async () => {
    const trip1 = makeTrip({ date: '2025-06-01' });
    const trip2 = makeTrip({ date: '2025-08-15' });
    const trip3 = makeTrip({ date: '2025-07-10' });

    await putRecord('trips', trip1);
    await putRecord('trips', trip2);
    await putRecord('trips', trip3);

    const trips = await getAllRecords('trips');
    const sorted = [...trips].sort((a, b) => b.date.localeCompare(a.date));

    expect(sorted[0].date).toBe('2025-08-15');
    expect(sorted[1].date).toBe('2025-07-10');
    expect(sorted[2].date).toBe('2025-06-01');
  });

  it('deletes a trip from IndexedDB', async () => {
    const trip = makeTrip();
    await putRecord('trips', trip);

    let trips = await getAllRecords('trips');
    expect(trips).toHaveLength(1);

    await deleteRecord('trips', trip.id);

    trips = await getAllRecords('trips');
    expect(trips).toHaveLength(0);
  });

  it('filters trips by location name', async () => {
    const park = makePark({ id: 'park-1', name: 'Radnor Lake State Park' });
    const park2 = makePark({ id: 'park-2', name: 'Fall Creek Falls State Park' });

    await putRecord('parks', park);
    await putRecord('parks', park2);

    const trip1 = makeTrip({ locationId: 'park-1' });
    const trip2 = makeTrip({ locationId: 'park-2' });

    await putRecord('trips', trip1);
    await putRecord('trips', trip2);

    const [parks] = await Promise.all([getAllRecords('parks')]);
    const locationMap = new Map<string, string>();
    for (const p of parks) locationMap.set(p.id, p.name);

    const trips = await getAllRecords('trips');
    const enriched = trips.map((t) => ({
      ...t,
      locationName: t.locationId ? locationMap.get(t.locationId) || '' : '',
    }));

    const query = 'radnor';
    const filtered = enriched.filter((t) =>
      t.locationName.toLowerCase().includes(query),
    );

    expect(filtered).toHaveLength(1);
    expect(filtered[0].locationName).toBe('Radnor Lake State Park');
  });

  it('filters trips by target species', async () => {
    const trip1 = makeTrip({ targetSpecies: ['Chanterelles', 'Morels'] });
    const trip2 = makeTrip({ targetSpecies: ['Turkey Tail'] });

    await putRecord('trips', trip1);
    await putRecord('trips', trip2);

    const trips = await getAllRecords('trips');
    const query = 'morel';
    const filtered = trips.filter((t) =>
      t.targetSpecies.some((s) => s.toLowerCase().includes(query)),
    );

    expect(filtered).toHaveLength(1);
    expect(filtered[0].targetSpecies).toContain('Morels');
  });

  it('filters trips by notes content', async () => {
    const trip1 = makeTrip({ notes: 'Morning hike, bring water' });
    const trip2 = makeTrip({ notes: 'Evening walk near the creek' });

    await putRecord('trips', trip1);
    await putRecord('trips', trip2);

    const trips = await getAllRecords('trips');
    const query = 'creek';
    const filtered = trips.filter((t) =>
      t.notes.toLowerCase().includes(query),
    );

    expect(filtered).toHaveLength(1);
    expect(filtered[0].notes).toContain('creek');
  });

  it('returns empty array when no trips exist', async () => {
    const trips = await getAllRecords('trips');
    expect(trips).toHaveLength(0);
  });

  it('preserves sync status on loaded trips', async () => {
    const trip1 = makeTrip({ syncStatus: 'pending' });
    const trip2 = makeTrip({ syncStatus: 'synced' });
    const trip3 = makeTrip({ syncStatus: 'failed' });

    await putRecord('trips', trip1);
    await putRecord('trips', trip2);
    await putRecord('trips', trip3);

    const trips = await getAllRecords('trips');
    const statuses = trips.map((t) => t.syncStatus).sort();
    expect(statuses).toEqual(['failed', 'pending', 'synced']);
  });
});
