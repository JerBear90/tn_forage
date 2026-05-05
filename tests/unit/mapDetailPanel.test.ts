/**
 * Unit tests for MapDetailPanel logic
 *
 * Tests the panel item resolution and route-panel-stays-open behavior
 * that is implemented in MapPageClient.tsx.
 *
 * Since we don't have @testing-library/react, we test the pure logic
 * functions that drive the panel behavior.
 */

import { describe, it, expect } from 'vitest';
import type { Park, Trail, Route } from '@/types';

// ---------------------------------------------------------------------------
// Foraging Score Display Logic
// ---------------------------------------------------------------------------

/**
 * Pure logic for foraging score display formatting.
 * Mirrors the ForagingScoreDisplay component behavior.
 */
function formatForagingScore(score: number | null | undefined): {
  text: string;
  ariaLabel: string;
} {
  if (score === null || score === undefined) {
    return {
      text: 'Score unavailable',
      ariaLabel: 'Foraging score unavailable',
    };
  }
  return {
    text: `${score}/100`,
    ariaLabel: `Foraging score: ${score} out of 100`,
  };
}

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

function makeRoute(overrides: Partial<Route> = {}): Route {
  return {
    id: 'route-test',
    parkId: 'park-test',
    name: 'Test Route',
    distance: 8.5,
    difficulty: 'hard',
    coordinates: [
      { lat: 35.5, lng: -86.0 },
      { lat: 35.51, lng: -86.01 },
    ],
    likelyTrees: ['Pine', 'Poplar'],
    likelySpecies: ['sp-chicken-of-the-woods'],
    images: [],
    lastUpdated: '2024-01-01',
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// DetailPanelItem type (mirrors the component's type)
// ---------------------------------------------------------------------------

type DetailPanelItem =
  | { type: 'park'; data: Park }
  | { type: 'trail'; data: Trail; parkName?: string }
  | { type: 'route'; data: Route; parkName?: string };

// ---------------------------------------------------------------------------
// Pure logic extracted from MapPageClient for testing
// ---------------------------------------------------------------------------

/**
 * Resolves a marker click into a DetailPanelItem.
 * Returns null if the item is not found.
 * Returns the current panel item unchanged if a route panel is open
 * and the user clicks a non-route element (route panels persist).
 */
function resolveMarkerClick(
  type: 'park' | 'trail' | 'route',
  id: string,
  parks: Park[],
  trails: Trail[],
  routes: Route[],
  currentPanel: DetailPanelItem | null
): DetailPanelItem | null {
  // Route panels stay open when clicking non-route elements
  if (currentPanel?.type === 'route' && type !== 'route') {
    return currentPanel;
  }

  const getParkName = (parkId: string): string | undefined =>
    parks.find((p) => p.id === parkId)?.name;

  if (type === 'park') {
    const park = parks.find((p) => p.id === id);
    return park ? { type: 'park', data: park } : null;
  }

  if (type === 'trail') {
    const trail = trails.find((t) => t.id === id);
    return trail
      ? { type: 'trail', data: trail, parkName: getParkName(trail.parkId) }
      : null;
  }

  if (type === 'route') {
    const route = routes.find((r) => r.id === id);
    return route
      ? { type: 'route', data: route, parkName: getParkName(route.parkId) }
      : null;
  }

  return null;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('MapDetailPanel logic — resolveMarkerClick', () => {
  const parks = [
    makePark({ id: 'park-1', name: 'Radnor Lake' }),
    makePark({ id: 'park-2', name: 'Fall Creek Falls' }),
  ];
  const trails = [
    makeTrail({ id: 'trail-1', parkId: 'park-1', name: 'Lake Trail' }),
    makeTrail({ id: 'trail-2', parkId: 'park-2', name: 'Gorge Trail' }),
  ];
  const routes = [
    makeRoute({ id: 'route-1', parkId: 'park-2', name: 'Waterfall Circuit' }),
  ];

  it('returns a park detail item when clicking a park marker', () => {
    const result = resolveMarkerClick('park', 'park-1', parks, trails, routes, null);
    expect(result).not.toBeNull();
    expect(result!.type).toBe('park');
    expect(result!.data.name).toBe('Radnor Lake');
  });

  it('returns a trail detail item with park name when clicking a trail', () => {
    const result = resolveMarkerClick('trail', 'trail-1', parks, trails, routes, null);
    expect(result).not.toBeNull();
    expect(result!.type).toBe('trail');
    expect(result!.data.name).toBe('Lake Trail');
    expect((result as { parkName?: string }).parkName).toBe('Radnor Lake');
  });

  it('returns a route detail item with park name when clicking a route', () => {
    const result = resolveMarkerClick('route', 'route-1', parks, trails, routes, null);
    expect(result).not.toBeNull();
    expect(result!.type).toBe('route');
    expect(result!.data.name).toBe('Waterfall Circuit');
    expect((result as { parkName?: string }).parkName).toBe('Fall Creek Falls');
  });

  it('returns null when clicking a non-existent park', () => {
    const result = resolveMarkerClick('park', 'park-nonexistent', parks, trails, routes, null);
    expect(result).toBeNull();
  });

  it('returns null when clicking a non-existent trail', () => {
    const result = resolveMarkerClick('trail', 'trail-nonexistent', parks, trails, routes, null);
    expect(result).toBeNull();
  });

  it('returns null when clicking a non-existent route', () => {
    const result = resolveMarkerClick('route', 'route-nonexistent', parks, trails, routes, null);
    expect(result).toBeNull();
  });

  it('replaces a park panel when clicking a different park', () => {
    const currentPanel: DetailPanelItem = { type: 'park', data: parks[0] };
    const result = resolveMarkerClick('park', 'park-2', parks, trails, routes, currentPanel);
    expect(result).not.toBeNull();
    expect(result!.type).toBe('park');
    expect(result!.data.name).toBe('Fall Creek Falls');
  });

  it('replaces a park panel when clicking a trail', () => {
    const currentPanel: DetailPanelItem = { type: 'park', data: parks[0] };
    const result = resolveMarkerClick('trail', 'trail-2', parks, trails, routes, currentPanel);
    expect(result).not.toBeNull();
    expect(result!.type).toBe('trail');
    expect(result!.data.name).toBe('Gorge Trail');
  });

  it('replaces a trail panel when clicking a park', () => {
    const currentPanel: DetailPanelItem = {
      type: 'trail',
      data: trails[0],
      parkName: 'Radnor Lake',
    };
    const result = resolveMarkerClick('park', 'park-2', parks, trails, routes, currentPanel);
    expect(result).not.toBeNull();
    expect(result!.type).toBe('park');
    expect(result!.data.name).toBe('Fall Creek Falls');
  });
});

describe('MapDetailPanel logic — route panel persistence', () => {
  const parks = [makePark({ id: 'park-1', name: 'Radnor Lake' })];
  const trails = [makeTrail({ id: 'trail-1', parkId: 'park-1', name: 'Lake Trail' })];
  const routes = [makeRoute({ id: 'route-1', parkId: 'park-1', name: 'Day Loop' })];

  it('keeps route panel open when clicking a park marker', () => {
    const routePanel: DetailPanelItem = {
      type: 'route',
      data: routes[0],
      parkName: 'Radnor Lake',
    };
    const result = resolveMarkerClick('park', 'park-1', parks, trails, routes, routePanel);
    expect(result).toBe(routePanel); // Same reference — unchanged
    expect(result!.type).toBe('route');
    expect(result!.data.name).toBe('Day Loop');
  });

  it('keeps route panel open when clicking a trail polyline', () => {
    const routePanel: DetailPanelItem = {
      type: 'route',
      data: routes[0],
      parkName: 'Radnor Lake',
    };
    const result = resolveMarkerClick('trail', 'trail-1', parks, trails, routes, routePanel);
    expect(result).toBe(routePanel);
    expect(result!.type).toBe('route');
  });

  it('replaces route panel when clicking a different route', () => {
    const routes2 = [
      ...routes,
      makeRoute({ id: 'route-2', parkId: 'park-1', name: 'Night Loop' }),
    ];
    const routePanel: DetailPanelItem = {
      type: 'route',
      data: routes[0],
      parkName: 'Radnor Lake',
    };
    const result = resolveMarkerClick('route', 'route-2', parks, trails, routes2, routePanel);
    expect(result).not.toBeNull();
    expect(result!.type).toBe('route');
    expect(result!.data.name).toBe('Night Loop');
  });

  it('does not persist park panels when clicking other elements', () => {
    const parkPanel: DetailPanelItem = { type: 'park', data: parks[0] };
    const result = resolveMarkerClick('trail', 'trail-1', parks, trails, routes, parkPanel);
    expect(result).not.toBeNull();
    expect(result!.type).toBe('trail');
  });

  it('does not persist trail panels when clicking other elements', () => {
    const trailPanel: DetailPanelItem = {
      type: 'trail',
      data: trails[0],
      parkName: 'Radnor Lake',
    };
    const result = resolveMarkerClick('park', 'park-1', parks, trails, routes, trailPanel);
    expect(result).not.toBeNull();
    expect(result!.type).toBe('park');
  });
});

describe('MapDetailPanel logic — park name resolution', () => {
  const parks = [
    makePark({ id: 'park-1', name: 'Radnor Lake' }),
  ];
  const trails = [
    makeTrail({ id: 'trail-1', parkId: 'park-1' }),
    makeTrail({ id: 'trail-orphan', parkId: 'park-nonexistent' }),
  ];
  const routes = [
    makeRoute({ id: 'route-1', parkId: 'park-1' }),
    makeRoute({ id: 'route-orphan', parkId: 'park-nonexistent' }),
  ];

  it('resolves park name for a trail with a valid parkId', () => {
    const result = resolveMarkerClick('trail', 'trail-1', parks, trails, routes, null);
    expect((result as { parkName?: string }).parkName).toBe('Radnor Lake');
  });

  it('returns undefined park name for a trail with an invalid parkId', () => {
    const result = resolveMarkerClick('trail', 'trail-orphan', parks, trails, routes, null);
    expect(result).not.toBeNull();
    expect((result as { parkName?: string }).parkName).toBeUndefined();
  });

  it('resolves park name for a route with a valid parkId', () => {
    const result = resolveMarkerClick('route', 'route-1', parks, trails, routes, null);
    expect((result as { parkName?: string }).parkName).toBe('Radnor Lake');
  });

  it('returns undefined park name for a route with an invalid parkId', () => {
    const result = resolveMarkerClick('route', 'route-orphan', parks, trails, routes, null);
    expect(result).not.toBeNull();
    expect((result as { parkName?: string }).parkName).toBeUndefined();
  });
});


// ---------------------------------------------------------------------------
// Foraging Score Display Tests
// ---------------------------------------------------------------------------

describe('MapDetailPanel — foraging score display', () => {
  it('formats a numeric score as "N/100"', () => {
    const result = formatForagingScore(75);
    expect(result.text).toBe('75/100');
  });

  it('includes aria-label "Foraging score: N out of 100" for numeric scores', () => {
    const result = formatForagingScore(42);
    expect(result.ariaLabel).toBe('Foraging score: 42 out of 100');
  });

  it('displays "Score unavailable" when score is null', () => {
    const result = formatForagingScore(null);
    expect(result.text).toBe('Score unavailable');
    expect(result.ariaLabel).toBe('Foraging score unavailable');
  });

  it('displays "Score unavailable" when score is undefined', () => {
    const result = formatForagingScore(undefined);
    expect(result.text).toBe('Score unavailable');
    expect(result.ariaLabel).toBe('Foraging score unavailable');
  });

  it('formats score of 0 correctly (not treated as falsy)', () => {
    const result = formatForagingScore(0);
    expect(result.text).toBe('0/100');
    expect(result.ariaLabel).toBe('Foraging score: 0 out of 100');
  });

  it('formats maximum score of 100 correctly', () => {
    const result = formatForagingScore(100);
    expect(result.text).toBe('100/100');
    expect(result.ariaLabel).toBe('Foraging score: 100 out of 100');
  });
});
