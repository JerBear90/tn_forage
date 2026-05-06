/**
 * Unit tests for MapFilterPanel component logic
 *
 * Tests the filter state management, category independence, and
 * button configuration for the map filter panel.
 *
 * Since we don't have @testing-library/react, we test the pure logic
 * and data structures that drive the component behavior.
 *
 * Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 9.1, 9.2, 9.3, 9.4
 */

import { describe, it, expect } from 'vitest';
import type { MapFilterState } from '@/map/mapFilterTypes';
import {
  DEFAULT_MAP_FILTER_STATE,
  LOCATION_TYPE_BUTTONS,
  CONDITION_BUTTONS,
  toggleLocationTypeFilter,
  toggleConditionFilter,
} from '@/map/mapFilterTypes';

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('MapFilterPanel — Default State', () => {
  it('should have parks, trails, and routes enabled by default', () => {
    expect(DEFAULT_MAP_FILTER_STATE.locationTypes.parks).toBe(true);
    expect(DEFAULT_MAP_FILTER_STATE.locationTypes.trails).toBe(true);
    expect(DEFAULT_MAP_FILTER_STATE.locationTypes.routes).toBe(true);
  });

  it('should have mushroom spots and foraging conditions disabled by default', () => {
    expect(DEFAULT_MAP_FILTER_STATE.conditions.mushroomSpots).toBe(false);
    expect(DEFAULT_MAP_FILTER_STATE.conditions.foragingConditions).toBe(false);
  });
});

describe('MapFilterPanel — Category Independence (Req 9.4)', () => {
  it('toggling a location type filter should not affect conditions', () => {
    const initial: MapFilterState = {
      locationTypes: { parks: true, trails: true, routes: true },
      conditions: { mushroomSpots: true, foragingConditions: false },
    };

    const result = toggleLocationTypeFilter(initial, 'parks');

    // Parks toggled off
    expect(result.locationTypes.parks).toBe(false);
    // Conditions unchanged
    expect(result.conditions.mushroomSpots).toBe(true);
    expect(result.conditions.foragingConditions).toBe(false);
  });

  it('toggling a condition filter should not affect location types', () => {
    const initial: MapFilterState = {
      locationTypes: { parks: false, trails: true, routes: false },
      conditions: { mushroomSpots: false, foragingConditions: false },
    };

    const result = toggleConditionFilter(initial, 'mushroomSpots');

    // Mushroom spots toggled on
    expect(result.conditions.mushroomSpots).toBe(true);
    // Location types unchanged
    expect(result.locationTypes.parks).toBe(false);
    expect(result.locationTypes.trails).toBe(true);
    expect(result.locationTypes.routes).toBe(false);
  });

  it('multiple toggles in one category should not affect the other', () => {
    let state = DEFAULT_MAP_FILTER_STATE;

    // Toggle all location types off
    state = toggleLocationTypeFilter(state, 'parks');
    state = toggleLocationTypeFilter(state, 'trails');
    state = toggleLocationTypeFilter(state, 'routes');

    // Conditions should remain at defaults
    expect(state.conditions.mushroomSpots).toBe(false);
    expect(state.conditions.foragingConditions).toBe(false);

    // Location types should all be off
    expect(state.locationTypes.parks).toBe(false);
    expect(state.locationTypes.trails).toBe(false);
    expect(state.locationTypes.routes).toBe(false);
  });
});

describe('MapFilterPanel — Toggle Behavior', () => {
  it('toggling an active filter should deactivate it', () => {
    const state: MapFilterState = {
      locationTypes: { parks: true, trails: true, routes: true },
      conditions: { mushroomSpots: false, foragingConditions: false },
    };

    const result = toggleLocationTypeFilter(state, 'trails');
    expect(result.locationTypes.trails).toBe(false);
  });

  it('toggling an inactive filter should activate it', () => {
    const state: MapFilterState = {
      locationTypes: { parks: true, trails: true, routes: true },
      conditions: { mushroomSpots: false, foragingConditions: false },
    };

    const result = toggleConditionFilter(state, 'foragingConditions');
    expect(result.conditions.foragingConditions).toBe(true);
  });

  it('double-toggling should return to original state', () => {
    const initial = DEFAULT_MAP_FILTER_STATE;
    const toggled = toggleLocationTypeFilter(initial, 'parks');
    const restored = toggleLocationTypeFilter(toggled, 'parks');

    expect(restored.locationTypes.parks).toBe(initial.locationTypes.parks);
  });
});

describe('MapFilterPanel — Filter Categories Structure', () => {
  it('should have exactly 3 location type filters', () => {
    const keys = Object.keys(DEFAULT_MAP_FILTER_STATE.locationTypes);
    expect(keys).toHaveLength(3);
    expect(keys).toContain('parks');
    expect(keys).toContain('trails');
    expect(keys).toContain('routes');
  });

  it('should have exactly 2 condition filters', () => {
    const keys = Object.keys(DEFAULT_MAP_FILTER_STATE.conditions);
    expect(keys).toHaveLength(2);
    expect(keys).toContain('mushroomSpots');
    expect(keys).toContain('foragingConditions');
  });

  it('should have 3 location type button definitions with aria-labels', () => {
    expect(LOCATION_TYPE_BUTTONS).toHaveLength(3);
    for (const btn of LOCATION_TYPE_BUTTONS) {
      expect(btn.ariaLabel).toBeTruthy();
      expect(btn.label).toBeTruthy();
      expect(btn.key).toBeTruthy();
    }
  });

  it('should have 2 condition button definitions with aria-labels', () => {
    expect(CONDITION_BUTTONS).toHaveLength(2);
    for (const btn of CONDITION_BUTTONS) {
      expect(btn.ariaLabel).toBeTruthy();
      expect(btn.label).toBeTruthy();
      expect(btn.key).toBeTruthy();
    }
  });

  it('button keys should match the filter state keys', () => {
    const locationKeys = LOCATION_TYPE_BUTTONS.map((b) => b.key);
    const conditionKeys = CONDITION_BUTTONS.map((b) => b.key);

    expect(locationKeys).toEqual(Object.keys(DEFAULT_MAP_FILTER_STATE.locationTypes));
    expect(conditionKeys).toEqual(Object.keys(DEFAULT_MAP_FILTER_STATE.conditions));
  });
});
