"use client";

/**
 * ForageWise — Regional Filter Component
 *
 * Filter chips for Tennessee geographic regions: All Regions, East TN,
 * Middle TN, West TN. Styled consistently with the existing category
 * filter chips on the Field Guide page.
 */

import type { TnRegion } from "@/types";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const REGION_FILTERS: { label: string; value: TnRegion | "all" }[] = [
  { label: "All Regions", value: "all" },
  { label: "East TN", value: "East TN" },
  { label: "Middle TN", value: "Middle TN" },
  { label: "West TN", value: "West TN" },
];

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface RegionalFilterProps {
  selectedRegion: TnRegion | "all";
  onRegionChange: (region: TnRegion | "all") => void;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function RegionalFilter({
  selectedRegion,
  onRegionChange,
}: RegionalFilterProps) {
  return (
    <div
      className="flex gap-2 mb-4 overflow-x-auto pb-1"
      role="group"
      aria-label="Region filters"
    >
      {REGION_FILTERS.map((filter) => {
        const isActive = selectedRegion === filter.value;
        return (
          <button
            key={filter.value}
            type="button"
            aria-pressed={isActive}
            onClick={() => onRegionChange(filter.value)}
            className={`shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-teal ${
              isActive
                ? "bg-brand-teal text-white border-brand-teal"
                : "bg-white/60 dark:bg-dark-surface/60 text-brand-charcoal dark:text-dark-text border-brand-teal/20 hover:bg-brand-teal/10"
            }`}
          >
            {filter.label}
          </button>
        );
      })}
    </div>
  );
}
