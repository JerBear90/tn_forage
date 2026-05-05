/**
 * ForageFlow — Map Filter Types and Constants
 *
 * Shared types and default state for the MapFilterPanel component.
 * Extracted to a .ts file so tests can import without JSX parsing issues.
 *
 * Requirements: 3.1, 3.2, 9.1, 9.2, 9.3
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface MapFilterState {
  locationTypes: {
    parks: boolean;
    trails: boolean;
    routes: boolean;
  };
  conditions: {
    mushroomSpots: boolean;
    foragingConditions: boolean;
  };
}

export interface MapFilterPanelProps {
  activeFilters: MapFilterState;
  onFilterChange: (filters: MapFilterState) => void;
}

// ---------------------------------------------------------------------------
// Default State
// ---------------------------------------------------------------------------

/** Default filter state — location types enabled, conditions disabled */
export const DEFAULT_MAP_FILTER_STATE: MapFilterState = {
  locationTypes: {
    parks: true,
    trails: true,
    routes: true,
  },
  conditions: {
    mushroomSpots: false,
    foragingConditions: false,
  },
};

// ---------------------------------------------------------------------------
// Filter button definitions
// ---------------------------------------------------------------------------

export interface FilterButtonDef {
  key: string;
  label: string;
  ariaLabel: string;
}

export const LOCATION_TYPE_BUTTONS: FilterButtonDef[] = [
  { key: 'parks', label: 'Parks', ariaLabel: 'Toggle parks filter' },
  { key: 'trails', label: 'Trails', ariaLabel: 'Toggle trails filter' },
  { key: 'routes', label: 'Routes', ariaLabel: 'Toggle routes filter' },
];

export const CONDITION_BUTTONS: FilterButtonDef[] = [
  { key: 'mushroomSpots', label: 'Mushroom Spots', ariaLabel: 'Toggle mushroom spots filter' },
  { key: 'foragingConditions', label: 'Foraging Conditions', ariaLabel: 'Toggle foraging conditions filter' },
];

// ---------------------------------------------------------------------------
// Pure logic helpers (testable without JSX)
// ---------------------------------------------------------------------------

/** Toggle a location type filter, preserving category independence */
export function toggleLocationTypeFilter(
  state: MapFilterState,
  key: keyof MapFilterState['locationTypes']
): MapFilterState {
  return {
    ...state,
    locationTypes: {
      ...state.locationTypes,
      [key]: !state.locationTypes[key],
    },
  };
}

/** Toggle a condition filter, preserving category independence */
export function toggleConditionFilter(
  state: MapFilterState,
  key: keyof MapFilterState['conditions']
): MapFilterState {
  return {
    ...state,
    conditions: {
      ...state.conditions,
      [key]: !state.conditions[key],
    },
  };
}
