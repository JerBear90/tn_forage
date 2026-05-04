"use client";

/**
 * ForageFlow — ParkPicker Component
 *
 * Visual card grid for selecting a park during trip creation.
 * Displays all Tennessee state parks with images, names, and region
 * badges. Includes region filter chips (All Regions, East TN, Middle TN,
 * West TN) for narrowing the list. Loads park data from IndexedDB
 * via `getAllRecords('parks')` and functions fully offline.
 *
 * Requirements: 4.1, 4.2, 4.3, 4.4, 4.5
 */

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { getAllRecords } from "@/offline/db";
import type { Park, TnRegion } from "@/types";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const REGION_FILTERS: { label: string; value: TnRegion | "all" }[] = [
  { label: "All Regions", value: "all" },
  { label: "East TN", value: "East TN" },
  { label: "Middle TN", value: "Middle TN" },
  { label: "West TN", value: "West TN" },
];

/** Region badge colors keyed by TnRegion value. */
const regionStyles: Record<TnRegion, { bg: string; text: string }> = {
  "East TN": {
    bg: "bg-brand-teal-100 dark:bg-brand-teal-800",
    text: "text-brand-teal-700 dark:text-brand-teal-200",
  },
  "Middle TN": {
    bg: "bg-brand-moss-100 dark:bg-brand-moss-800",
    text: "text-brand-moss-700 dark:text-brand-moss-200",
  },
  "West TN": {
    bg: "bg-brand-earth-100 dark:bg-brand-earth-800",
    text: "text-brand-earth-700 dark:text-brand-earth-200",
  },
};

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface ParkPickerProps {
  selectedParkId: string | null;
  onSelectPark: (parkId: string) => void;
}

// ---------------------------------------------------------------------------
// Helper: filter parks by region
// ---------------------------------------------------------------------------

export function filterParksByRegion(
  parks: Park[],
  region: TnRegion | "all",
): Park[] {
  if (region === "all") return parks;
  return parks.filter((p) => p.region === region);
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function ParkPicker({
  selectedParkId,
  onSelectPark,
}: ParkPickerProps) {
  const [parks, setParks] = useState<Park[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedRegion, setSelectedRegion] = useState<TnRegion | "all">("all");
  const selectedRef = useRef<HTMLButtonElement>(null);

  // Load parks from IndexedDB on mount
  useEffect(() => {
    let cancelled = false;

    async function loadParks() {
      try {
        const records = await getAllRecords("parks");
        if (!cancelled) {
          // Sort alphabetically by name for consistent display
          setParks(records.sort((a, b) => a.name.localeCompare(b.name)));
          setLoading(false);
        }
      } catch (err) {
        if (!cancelled) {
          setError("Unable to load parks. Please try again.");
          setLoading(false);
        }
      }
    }

    loadParks();
    return () => {
      cancelled = true;
    };
  }, []);

  // Auto-scroll to the pre-selected park card after parks load
  useEffect(() => {
    if (!loading && selectedParkId && selectedRef.current) {
      // Small delay to let the grid render
      requestAnimationFrame(() => {
        selectedRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      });
    }
  }, [loading, selectedParkId]);

  const filteredParks = filterParksByRegion(parks, selectedRegion);

  // ---- Loading state ----
  if (loading) {
    return (
      <section aria-label="Park picker" className="space-y-4">
        <h2 className="font-heading font-semibold text-lg text-brand-forest dark:text-brand-moss">
          Select a Park
        </h2>
        <div
          className="grid grid-cols-2 sm:grid-cols-3 gap-3"
          aria-busy="true"
          aria-live="polite"
        >
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="rounded-xl bg-brand-charcoal/5 dark:bg-brand-sand/5 animate-pulse h-48"
            />
          ))}
        </div>
      </section>
    );
  }

  // ---- Error state ----
  if (error) {
    return (
      <section aria-label="Park picker" className="space-y-4">
        <h2 className="font-heading font-semibold text-lg text-brand-forest dark:text-brand-moss">
          Select a Park
        </h2>
        <div
          role="alert"
          className="rounded-lg border border-brand-earth/20 bg-brand-earth/10 p-4 text-center"
        >
          <p className="text-sm text-brand-earth dark:text-brand-earth-200">
            {error}
          </p>
        </div>
      </section>
    );
  }

  // ---- Empty state ----
  if (parks.length === 0) {
    return (
      <section aria-label="Park picker" className="space-y-4">
        <h2 className="font-heading font-semibold text-lg text-brand-forest dark:text-brand-moss">
          Select a Park
        </h2>
        <div className="rounded-lg border border-brand-charcoal/10 dark:border-dark-border bg-white/60 dark:bg-dark-surface/60 p-6 text-center">
          <p className="text-sm text-brand-charcoal/60 dark:text-dark-text-muted">
            No parks available. Try refreshing the app.
          </p>
        </div>
      </section>
    );
  }

  const selectedPark = selectedParkId ? parks.find((p) => p.id === selectedParkId) : null;

  return (
    <section aria-label="Park picker" className="space-y-4">
      <h2 className="font-heading font-semibold text-lg text-brand-forest dark:text-brand-moss">
        Select a Park
      </h2>

      {/* Selected park confirmation */}
      {selectedPark && (
        <div className="flex items-center gap-3 rounded-lg border border-brand-teal/30 bg-brand-teal/5 dark:bg-brand-teal/10 px-3 py-2.5">
          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-brand-teal text-white shrink-0">
            <svg aria-hidden="true" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
            </svg>
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-brand-teal truncate">{selectedPark.name}</p>
            <p className="text-xs text-brand-charcoal/60 dark:text-dark-text-muted">{selectedPark.region}</p>
          </div>
          <button
            type="button"
            onClick={() => onSelectPark('')}
            className="text-xs text-brand-teal/60 hover:text-brand-teal underline"
            aria-label="Change park selection"
          >
            Change
          </button>
        </div>
      )}

      {/* Region filter chips */}
      <div
        className="flex gap-2 overflow-x-auto pb-1"
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
              onClick={() => setSelectedRegion(filter.value)}
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

      {/* Park cards grid */}
      {filteredParks.length === 0 ? (
        <div className="rounded-lg border border-brand-charcoal/10 dark:border-dark-border bg-white/60 dark:bg-dark-surface/60 p-6 text-center">
          <p className="text-sm text-brand-charcoal/60 dark:text-dark-text-muted">
            No parks found in {selectedRegion}.
          </p>
        </div>
      ) : (
        <div
          className="grid grid-cols-2 sm:grid-cols-3 gap-3"
          role="listbox"
          aria-label="Parks"
        >
          {filteredParks.map((park) => {
            const isSelected = selectedParkId === park.id;
            const style = regionStyles[park.region as TnRegion] ?? {
              bg: "bg-brand-charcoal/10",
              text: "text-brand-charcoal/70",
            };

            return (
              <button
                key={park.id}
                ref={isSelected ? selectedRef : undefined}
                type="button"
                role="option"
                aria-selected={isSelected}
                onClick={() => onSelectPark(park.id)}
                className={`group relative rounded-xl border overflow-hidden text-left transition-all focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-teal active:scale-[0.98] ${
                  isSelected
                    ? "border-brand-teal ring-2 ring-brand-teal/30 bg-white dark:bg-dark-surface"
                    : "border-brand-charcoal/10 dark:border-dark-border bg-white/80 dark:bg-dark-surface/80 hover:border-brand-teal/30 hover:bg-brand-teal/5"
                }`}
              >
                {/* Park image */}
                <div className="relative w-full h-28 bg-brand-sand/60 dark:bg-dark-surface/80 overflow-hidden">
                  {park.image ? (
                    <Image
                      src={park.image}
                      alt={park.name}
                      width={400}
                      height={224}
                      sizes="(max-width: 640px) 50vw, 200px"
                      quality={70}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <div className="flex items-center justify-center w-full h-full">
                      <ParkPlaceholderIcon />
                    </div>
                  )}

                  {/* Selected checkmark overlay */}
                  {isSelected && (
                    <div className="absolute top-2 right-2 flex items-center justify-center w-6 h-6 rounded-full bg-brand-teal text-white shadow-sm">
                      <svg
                        aria-hidden="true"
                        className="w-4 h-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={3}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M4.5 12.75l6 6 9-13.5"
                        />
                      </svg>
                    </div>
                  )}
                </div>

                {/* Park info */}
                <div className="p-2.5">
                  <p className="font-semibold text-sm text-brand-charcoal dark:text-dark-text truncate leading-snug">
                    {park.name}
                  </p>
                  <span
                    className={`inline-block mt-1.5 text-xs font-medium rounded-full px-2 py-0.5 ${style.bg} ${style.text}`}
                  >
                    {park.region}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </section>
  );
}

// ---------------------------------------------------------------------------
// Placeholder icon (used when no park image is available)
// ---------------------------------------------------------------------------

function ParkPlaceholderIcon() {
  return (
    <svg
      aria-hidden="true"
      className="w-10 h-10 text-brand-charcoal/20 dark:text-brand-sand/20"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.5}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z"
      />
    </svg>
  );
}
