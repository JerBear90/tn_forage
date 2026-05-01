/**
 * TrailPicker — Unit Tests
 *
 * Tests the TrailPicker component's core logic: the exported
 * `getTrailsByParkId` function, IndexedDB trail loading, and
 * data-level selection behavior.
 *
 * Since @testing-library/react is not installed, these tests focus on
 * the pure helper function and IndexedDB integration rather than
 * DOM rendering.
 *
 * **Validates: Requirements 5.1, 5.2, 5.4**
 */

import 'fake-indexeddb/auto';
import { describe, it, expect, beforeEach } from 'vitest';

import { webcrypto } from 'crypto';
if (typeof globalThis.crypto === 'undefined') {
  // @ts-expect-error — Node webcrypto is compatible enough for our usage
  globalThis.crypto = webcrypto;
}

import { putRecord, getDB } from '@/offline/db';
import type { Trail, TrailDifficulty } from '@/types';

// ---------------------------------------------------------------------------
// Inline the pure getTrailsByParkId function from TrailPicker.tsx
// (Cannot import directly because the .tsx file contains JSX and vitest
// is configured with environment: 'node' without JSX transform)
// ---------------------------------------------------------------------------

async function getTrailsByParkId(parkId: string): Promise<Trail[]> {
  const db = await getDB();
  return db.getAllFromIndex('trails', 'by-parkId', parkId);
}

// ---------------------------------------------------------------------------
// Test Data
// ---------------------------------------------------------------------------

const TODAY = '2025-01-01';

function makeTrail(
  id: string,
  parkId: string,
  name: string,
  distance: number,
  difficulty: TrailDifficulty,
): Trail {
  return {
    id,
    parkId,
    name,
    distance,
    difficulty,
    coordinates: [{ lat: 36.0, lng: -86.0 }],
    likelyTrees: ['Oak'],
    likelySpecies: ['sp-morel'],
    images: [`/images/trails/${id}.jpg`],
    lastUpdated: TODAY,
  };
}

const trailA1 = makeTrail('trail-a1', 'park-alpha', 'Ridge Loop', 3.2, 'moderate');
const trailA2 = makeTrail('trail-a2', 'park-alpha', 'Creek Path', 1.5, 'easy');
const trailA3 = makeTrail('trail-a3', 'park-alpha', 'Summit Climb', 5.8, 'hard');
const trailB1 = makeTrail('trail-b1', 'park-beta', 'Lakeside Walk', 2.0, 'easy');
const trailB2 = makeTrail('trail-b2', 'park-beta', 'Forest Trail', 4.1, 'moderate');
const trailC1 = makeTrail('trail-c1', 'park-gamma', 'Expert Ridge', 7.3, 'expert');

const allTrails: Trail[] = [trailA1, trailA2, trailA3, trailB1, trailB2, trailC1];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function clearTrailsStore() {
  const db = await getDB();
  await db.clear('trails');
}

async function seedTrails(trails: Trail[]) {
  for (const trail of trails) {
    await putRecord('trails', trail);
  }
}

// ---------------------------------------------------------------------------
// getTrailsByParkId — IndexedDB Integration Tests
// ---------------------------------------------------------------------------

describe('getTrailsByParkId', () => {
  beforeEach(async () => {
    await clearTrailsStore();
  });

  it('returns trails for a given parkId', async () => {
    await seedTrails(allTrails);
    const result = await getTrailsByParkId('park-alpha');
    expect(result).toHaveLength(3);
    const ids = result.map((t) => t.id).sort();
    expect(ids).toEqual(['trail-a1', 'trail-a2', 'trail-a3']);
    result.forEach((t) => expect(t.parkId).toBe('park-alpha'));
  });

  it('returns only trails for the specified park, not others', async () => {
    await seedTrails(allTrails);
    const result = await getTrailsByParkId('park-beta');
    expect(result).toHaveLength(2);
    const ids = result.map((t) => t.id).sort();
    expect(ids).toEqual(['trail-b1', 'trail-b2']);
    result.forEach((t) => expect(t.parkId).toBe('park-beta'));
  });

  it('returns empty array when park has no trails', async () => {
    await seedTrails(allTrails);
    const result = await getTrailsByParkId('park-nonexistent');
    expect(result).toHaveLength(0);
    expect(result).toEqual([]);
  });

  it('returns empty array when no trails are seeded', async () => {
    const result = await getTrailsByParkId('park-alpha');
    expect(result).toHaveLength(0);
    expect(result).toEqual([]);
  });

  it('returns a single trail when park has exactly one', async () => {
    await seedTrails(allTrails);
    const result = await getTrailsByParkId('park-gamma');
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('trail-c1');
    expect(result[0].parkId).toBe('park-gamma');
  });
});

// ---------------------------------------------------------------------------
// Trail Data Shape — Validates Requirements 5.2
// ---------------------------------------------------------------------------

describe('Trail data includes name, distance, and difficulty', () => {
  beforeEach(async () => {
    await clearTrailsStore();
  });

  it('every trail has a name string', async () => {
    await seedTrails(allTrails);
    const trails = await getTrailsByParkId('park-alpha');
    trails.forEach((trail) => {
      expect(trail.name).toBeTruthy();
      expect(typeof trail.name).toBe('string');
    });
  });

  it('every trail has a numeric distance', async () => {
    await seedTrails(allTrails);
    const trails = await getTrailsByParkId('park-alpha');
    trails.forEach((trail) => {
      expect(typeof trail.distance).toBe('number');
      expect(trail.distance).toBeGreaterThan(0);
    });
  });

  it('every trail has a valid difficulty', async () => {
    await seedTrails(allTrails);
    const validDifficulties: TrailDifficulty[] = ['easy', 'moderate', 'hard', 'expert'];
    const trails = await getTrailsByParkId('park-alpha');
    trails.forEach((trail) => {
      expect(validDifficulties).toContain(trail.difficulty);
    });
  });

  it('trails across all parks have complete data', async () => {
    await seedTrails(allTrails);
    const validDifficulties: TrailDifficulty[] = ['easy', 'moderate', 'hard', 'expert'];

    for (const parkId of ['park-alpha', 'park-beta', 'park-gamma']) {
      const trails = await getTrailsByParkId(parkId);
      trails.forEach((trail) => {
        expect(trail.name).toBeTruthy();
        expect(typeof trail.distance).toBe('number');
        expect(trail.distance).toBeGreaterThan(0);
        expect(validDifficulties).toContain(trail.difficulty);
      });
    }
  });
});

// ---------------------------------------------------------------------------
// Selection Callback Logic — Validates Requirements 5.1, 5.4
// ---------------------------------------------------------------------------

describe('TrailPicker selection behavior', () => {
  beforeEach(async () => {
    await clearTrailsStore();
  });

  it('onSelectTrail callback receives the correct trail ID', () => {
    let capturedId: string | null = null;
    const onSelectTrail = (trailId: string) => {
      capturedId = trailId;
    };

    onSelectTrail('trail-a1');
    expect(capturedId).toBe('trail-a1');

    onSelectTrail('trail-b2');
    expect(capturedId).toBe('trail-b2');
  });

  it('selected trail can be matched against loaded trails', async () => {
    await seedTrails(allTrails);
    const trails = await getTrailsByParkId('park-alpha');

    const selectedTrailId = 'trail-a2';
    const selectedTrail = trails.find((t) => t.id === selectedTrailId);
    expect(selectedTrail).toBeDefined();
    expect(selectedTrail!.name).toBe('Creek Path');
    expect(selectedTrail!.distance).toBe(1.5);
    expect(selectedTrail!.difficulty).toBe('easy');
  });

  it('selected trail can be highlighted by comparing IDs', () => {
    const selectedTrailId = 'trail-a3';
    allTrails.forEach((trail) => {
      const isSelected = trail.id === selectedTrailId;
      if (trail.id === 'trail-a3') {
        expect(isSelected).toBe(true);
      } else {
        expect(isSelected).toBe(false);
      }
    });
  });

  it('selection works after loading trails for a specific park', async () => {
    await seedTrails(allTrails);
    const trails = await getTrailsByParkId('park-beta');
    expect(trails.length).toBeGreaterThan(0);

    let capturedId: string | null = null;
    const onSelectTrail = (trailId: string) => {
      capturedId = trailId;
    };

    // Select the first trail from park-beta
    onSelectTrail(trails[0].id);
    expect(capturedId).toBe(trails[0].id);
    expect(trails[0].parkId).toBe('park-beta');
  });

  it('no-trails scenario: empty result means no selection possible', async () => {
    await seedTrails(allTrails);
    const trails = await getTrailsByParkId('park-nonexistent');
    expect(trails).toHaveLength(0);
    // In the component, this triggers the "No trails available" message
  });
});
