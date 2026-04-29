/**
 * Unit tests for Create Trip functionality.
 *
 * Validates that trips can be created and persisted to IndexedDB
 * with the correct shape, including the new companions and safetyNotes fields.
 *
 * Uses fake-indexeddb to provide an in-memory IndexedDB implementation.
 */

import 'fake-indexeddb/auto';
import { describe, it, expect, beforeEach } from 'vitest';

import { webcrypto } from 'crypto';
if (typeof globalThis.crypto === 'undefined') {
  // @ts-expect-error — Node webcrypto is compatible enough for our usage
  globalThis.crypto = webcrypto;
}

import type { Trip } from '@/types';
import { getDB, putRecord, getRecord, getAllRecords } from '@/offline/db';

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
    companions: 'Alice, Bob',
    safetyNotes: 'Bring first aid kit',
    syncStatus: 'pending',
    ...overrides,
  };
}

async function clearTrips() {
  const db = await getDB();
  await db.clear('trips');
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

beforeEach(async () => {
  await clearTrips();
});

describe('Trip type and persistence', () => {
  it('saves a park trip to IndexedDB and retrieves it', async () => {
    const trip = makeTrip();
    await putRecord('trips', trip);

    const saved = await getRecord('trips', trip.id);
    expect(saved).toBeDefined();
    expect(saved!.id).toBe(trip.id);
    expect(saved!.locationType).toBe('park');
    expect(saved!.locationId).toBe('park-radnor-lake');
    expect(saved!.date).toBe('2025-07-15');
    expect(saved!.notes).toBe('Morning hike, bring water');
    expect(saved!.targetSpecies).toEqual(['Chanterelles', 'Morels']);
    expect(saved!.companions).toBe('Alice, Bob');
    expect(saved!.safetyNotes).toBe('Bring first aid kit');
    expect(saved!.syncStatus).toBe('pending');
  });

  it('saves a trail trip with locationId', async () => {
    const trip = makeTrip({
      locationType: 'trail',
      locationId: 'trail-radnor-lake-trail',
    });
    await putRecord('trips', trip);

    const saved = await getRecord('trips', trip.id);
    expect(saved!.locationType).toBe('trail');
    expect(saved!.locationId).toBe('trail-radnor-lake-trail');
  });

  it('saves a route trip with locationId', async () => {
    const trip = makeTrip({
      locationType: 'route',
      locationId: 'route-savage-gulf-day-loop',
    });
    await putRecord('trips', trip);

    const saved = await getRecord('trips', trip.id);
    expect(saved!.locationType).toBe('route');
    expect(saved!.locationId).toBe('route-savage-gulf-day-loop');
  });

  it('saves a custom location trip with customLocation field', async () => {
    const trip = makeTrip({
      locationType: 'custom',
      locationId: undefined,
      customLocation: 'My backyard forest',
    });
    await putRecord('trips', trip);

    const saved = await getRecord('trips', trip.id);
    expect(saved!.locationType).toBe('custom');
    expect(saved!.customLocation).toBe('My backyard forest');
    expect(saved!.locationId).toBeUndefined();
  });

  it('saves a trip with empty optional fields', async () => {
    const trip = makeTrip({
      notes: '',
      targetSpecies: [],
      companions: '',
      safetyNotes: '',
    });
    await putRecord('trips', trip);

    const saved = await getRecord('trips', trip.id);
    expect(saved!.notes).toBe('');
    expect(saved!.targetSpecies).toEqual([]);
    expect(saved!.companions).toBe('');
    expect(saved!.safetyNotes).toBe('');
  });

  it('always saves with syncStatus pending', async () => {
    const trip = makeTrip({ syncStatus: 'pending' });
    await putRecord('trips', trip);

    const saved = await getRecord('trips', trip.id);
    expect(saved!.syncStatus).toBe('pending');
  });

  it('stores multiple trips and retrieves all', async () => {
    const trip1 = makeTrip({ date: '2025-07-01' });
    const trip2 = makeTrip({ date: '2025-07-02' });
    const trip3 = makeTrip({ date: '2025-07-03' });

    await putRecord('trips', trip1);
    await putRecord('trips', trip2);
    await putRecord('trips', trip3);

    const all = await getAllRecords('trips');
    expect(all).toHaveLength(3);
  });

  it('generates unique IDs for each trip', async () => {
    const trip1 = makeTrip();
    const trip2 = makeTrip();

    expect(trip1.id).not.toBe(trip2.id);
  });
});
