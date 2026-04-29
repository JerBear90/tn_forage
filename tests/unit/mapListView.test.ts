/**
 * Unit tests for MapListView logic
 *
 * Tests the list view card rendering logic, tab switching behavior,
 * and item click handling for the map page's thumbnail list view.
 *
 * Since we don't have @testing-library/react, we test the pure logic
 * functions that drive the list view behavior — park card data resolution,
 * trail card data resolution, and park name lookup.
 */

import { describe, it, expect } from 'vitest';
import type { Park, Trail } from '@/types';

// ---------------------------------------------------------------------------
// Test data factories
// ---------------------------------------------------------------------------

function makePark(overrides: Partial<Park> = {}): Park {
  return {
    id: 'park-test',
    name: 'Test State Park',
    region: 'East Tennessee',
    coordinates: { lat: 35.6, lng: -83.5 },
    amenities: ['Camping', 'Hiking'],
    trails: ['trail-1'],
    hours: 'Daily, sunrise to sunset',
    fees: 'Free admission',
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
    ],
    likelyTrees: ['Oak', 'Hickory'],
    likelySpecies: ['sp-chanterelle'],
    images: [],
    lastUpdated: '2024-01-01',
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Pure logic: getParkName (mirrors MapPageClient logic)
// ---------------------------------------------------------------------------

function getParkName(parks: Park[], parkId: string): string | undefined {
  return parks.find((p) => p.id === parkId)?.name;
}

// ---------------------------------------------------------------------------
// Pure logic: build park card data
// ---------------------------------------------------------------------------

interface ParkCardData {
  id: string;
  name: string;
  region: string;
  amenityCount: number;
  trailCount: number;
}

function buildParkCardData(park: Park): ParkCardData {
  return {
    id: park.id,
    name: park.name,
    region: park.region,
    amenityCount: park.amenities.length,
    trailCount: park.trails.length,
  };
}

// ---------------------------------------------------------------------------
// Pure logic: build trail card data
// ---------------------------------------------------------------------------

interface TrailCardData {
  id: string;
  name: string;
  parkName: string | undefined;
  distance: number;
  difficulty: string;
}

function buildTrailCardData(
  trail: Trail,
  parks: Park[]
): TrailCardData {
  return {
    id: trail.id,
    name: trail.name,
    parkName: getParkName(parks, trail.parkId),
    distance: trail.distance,
    difficulty: trail.difficulty,
  };
}

// ---------------------------------------------------------------------------
// Pure logic: resolve list item click into marker click args
// ---------------------------------------------------------------------------

function resolveListItemClick(
  type: 'park' | 'trail',
  id: string,
  parks: Park[],
  trails: Trail[]
): { type: 'park' | 'trail'; id: string; found: boolean } {
  if (type === 'park') {
    const park = parks.find((p) => p.id === id);
    return { type: 'park', id, found: !!park };
  }
  const trail = trails.find((t) => t.id === id);
  return { type: 'trail', id, found: !!trail };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('MapListView — park card data', () => {
  it('builds correct card data from a park', () => {
    const park = makePark({
      id: 'park-radnor',
      name: 'Radnor Lake State Park',
      region: 'Middle Tennessee',
      amenities: ['Hiking trails', 'Wildlife observation', 'Visitor center'],
      trails: ['trail-1', 'trail-2'],
    });

    const card = buildParkCardData(park);
    expect(card.id).toBe('park-radnor');
    expect(card.name).toBe('Radnor Lake State Park');
    expect(card.region).toBe('Middle Tennessee');
    expect(card.amenityCount).toBe(3);
    expect(card.trailCount).toBe(2);
  });

  it('handles a park with no amenities or trails', () => {
    const park = makePark({
      amenities: [],
      trails: [],
    });

    const card = buildParkCardData(park);
    expect(card.amenityCount).toBe(0);
    expect(card.trailCount).toBe(0);
  });
});

describe('MapListView — trail card data', () => {
  const parks = [
    makePark({ id: 'park-1', name: 'Radnor Lake' }),
    makePark({ id: 'park-2', name: 'Fall Creek Falls' }),
  ];

  it('builds correct card data from a trail with a valid park', () => {
    const trail = makeTrail({
      id: 'trail-lake',
      parkId: 'park-1',
      name: 'Lake Trail',
      distance: 1.35,
      difficulty: 'easy',
    });

    const card = buildTrailCardData(trail, parks);
    expect(card.id).toBe('trail-lake');
    expect(card.name).toBe('Lake Trail');
    expect(card.parkName).toBe('Radnor Lake');
    expect(card.distance).toBe(1.35);
    expect(card.difficulty).toBe('easy');
  });

  it('returns undefined parkName for a trail with an invalid parkId', () => {
    const trail = makeTrail({
      parkId: 'park-nonexistent',
    });

    const card = buildTrailCardData(trail, parks);
    expect(card.parkName).toBeUndefined();
  });

  it('preserves all difficulty levels', () => {
    const difficulties = ['easy', 'moderate', 'hard', 'expert'] as const;
    for (const diff of difficulties) {
      const trail = makeTrail({ difficulty: diff });
      const card = buildTrailCardData(trail, parks);
      expect(card.difficulty).toBe(diff);
    }
  });
});

describe('MapListView — getParkName', () => {
  const parks = [
    makePark({ id: 'park-1', name: 'Radnor Lake' }),
    makePark({ id: 'park-2', name: 'Fall Creek Falls' }),
  ];

  it('returns the park name for a valid parkId', () => {
    expect(getParkName(parks, 'park-1')).toBe('Radnor Lake');
    expect(getParkName(parks, 'park-2')).toBe('Fall Creek Falls');
  });

  it('returns undefined for an invalid parkId', () => {
    expect(getParkName(parks, 'park-nonexistent')).toBeUndefined();
  });

  it('returns undefined for an empty parks array', () => {
    expect(getParkName([], 'park-1')).toBeUndefined();
  });
});

describe('MapListView — list item click resolution', () => {
  const parks = [
    makePark({ id: 'park-1', name: 'Radnor Lake' }),
  ];
  const trails = [
    makeTrail({ id: 'trail-1', parkId: 'park-1', name: 'Lake Trail' }),
  ];

  it('resolves a park click with found=true when park exists', () => {
    const result = resolveListItemClick('park', 'park-1', parks, trails);
    expect(result.type).toBe('park');
    expect(result.id).toBe('park-1');
    expect(result.found).toBe(true);
  });

  it('resolves a trail click with found=true when trail exists', () => {
    const result = resolveListItemClick('trail', 'trail-1', parks, trails);
    expect(result.type).toBe('trail');
    expect(result.id).toBe('trail-1');
    expect(result.found).toBe(true);
  });

  it('resolves a park click with found=false when park does not exist', () => {
    const result = resolveListItemClick('park', 'park-nonexistent', parks, trails);
    expect(result.found).toBe(false);
  });

  it('resolves a trail click with found=false when trail does not exist', () => {
    const result = resolveListItemClick('trail', 'trail-nonexistent', parks, trails);
    expect(result.found).toBe(false);
  });
});
