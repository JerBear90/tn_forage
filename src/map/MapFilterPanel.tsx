'use client';

/**
 * ForageWise — MapFilterPanel Component
 *
 * Displays categorized inline filter buttons for the map view.
 * Replaces the hidden LayersControl dropdown with visible, labeled,
 * tappable buttons organized into "Location Types" and "Foraging Conditions".
 *
 * Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 9.1, 9.2, 9.3
 */

import {
  type MapFilterState,
  type MapFilterPanelProps,
  LOCATION_TYPE_BUTTONS,
  CONDITION_BUTTONS,
  toggleLocationTypeFilter,
  toggleConditionFilter,
} from './mapFilterTypes';

// Re-export types and constants for convenience
export type { MapFilterState, MapFilterPanelProps } from './mapFilterTypes';
export { DEFAULT_MAP_FILTER_STATE } from './mapFilterTypes';

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function MapFilterPanel({
  activeFilters,
  onFilterChange,
}: MapFilterPanelProps) {
  const handleLocationTypeToggle = (key: string) => {
    const newFilters = toggleLocationTypeFilter(
      activeFilters,
      key as keyof MapFilterState['locationTypes']
    );
    onFilterChange(newFilters);
  };

  const handleConditionToggle = (key: string) => {
    const newFilters = toggleConditionFilter(
      activeFilters,
      key as keyof MapFilterState['conditions']
    );
    onFilterChange(newFilters);
  };

  return (
    <div className="flex flex-col gap-3 px-4 py-2">
      {/* Location Types category */}
      <div
        role="group"
        aria-label="Location Types filters"
      >
        <span className="block text-xs font-medium text-brand-charcoal dark:text-dark-text-muted mb-1.5">
          Location Types
        </span>
        <div className="flex flex-wrap gap-2">
          {LOCATION_TYPE_BUTTONS.map((btn) => {
            const isActive = activeFilters.locationTypes[btn.key as keyof MapFilterState['locationTypes']];
            return (
              <button
                key={btn.key}
                type="button"
                aria-label={btn.ariaLabel}
                aria-pressed={isActive}
                onClick={() => handleLocationTypeToggle(btn.key)}
                className={`
                  min-w-[44px] min-h-[44px] px-3 py-2
                  rounded-lg border text-xs font-medium
                  transition-colors
                  focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-teal
                  ${
                    isActive
                      ? 'bg-brand-teal text-white border-brand-teal dark:bg-brand-teal-600 dark:border-brand-teal-600'
                      : 'bg-white/60 dark:bg-dark-surface/60 text-brand-charcoal dark:text-dark-text border-brand-teal/20 hover:bg-brand-teal/10'
                  }
                `}
              >
                {btn.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Foraging Conditions category */}
      <div
        role="group"
        aria-label="Foraging Conditions filters"
      >
        <span className="block text-xs font-medium text-brand-charcoal dark:text-dark-text-muted mb-1.5">
          Foraging Conditions
        </span>
        <div className="flex flex-wrap gap-2">
          {CONDITION_BUTTONS.map((btn) => {
            const isActive = activeFilters.conditions[btn.key as keyof MapFilterState['conditions']];
            return (
              <button
                key={btn.key}
                type="button"
                aria-label={btn.ariaLabel}
                aria-pressed={isActive}
                onClick={() => handleConditionToggle(btn.key)}
                className={`
                  min-w-[44px] min-h-[44px] px-3 py-2
                  rounded-lg border text-xs font-medium
                  transition-colors
                  focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-teal
                  ${
                    isActive
                      ? 'bg-brand-teal text-white border-brand-teal dark:bg-brand-teal-600 dark:border-brand-teal-600'
                      : 'bg-white/60 dark:bg-dark-surface/60 text-brand-charcoal dark:text-dark-text border-brand-teal/20 hover:bg-brand-teal/10'
                  }
                `}
              >
                {btn.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
