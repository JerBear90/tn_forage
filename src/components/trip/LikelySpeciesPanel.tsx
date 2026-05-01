"use client";

/**
 * ForageFlow — LikelySpeciesPanel Component
 *
 * Species recommendations based on trail/park data during trip planning.
 * Resolves species from the trail `likelySpecies` array, displays each
 * species with common name, image, edibility label, and an "in season"
 * badge when the species' season matches the current month. Tapping a
 * species navigates to its field guide detail page. An "Add to trip"
 * button per species calls the `onAddToTrip` callback.
 *
 * Loads all data from IndexedDB and functions fully offline.
 *
 * Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6
 */

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { getDB, batchGetRecords } from "@/offline/db";
import type { Species, Trail, EdibilityLabel } from "@/types";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/**
 * Maps season names to the months (0-indexed) they cover.
 * Exported for use in property tests (Property 9).
 */
export const SEASON_MONTHS: Record<string, number[]> = {
  Spring: [2, 3, 4], // Mar, Apr, May
  Summer: [5, 6, 7], // Jun, Jul, Aug
  Fall: [8, 9, 10], // Sep, Oct, Nov
  Winter: [11, 0, 1], // Dec, Jan, Feb
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Determine whether a species is "in season" for a given month.
 *
 * Returns `true` if the month falls within at least one of the species'
 * seasons according to the SEASON_MONTHS mapping.
 *
 * Exported so it can be tested in Property 9.
 *
 * @param seasons - Array of season names (e.g. ["Spring", "Summer"])
 * @param month   - Current month, 0-indexed (0 = January, 11 = December)
 */
export function isInSeason(seasons: string[], month: number): boolean {
  return seasons.some((season) => {
    const months = SEASON_MONTHS[season];
    return months != null && months.includes(month);
  });
}

/** Edibility badge color classes matching the field guide pattern. */
function edibilityBadgeClasses(label: EdibilityLabel): string {
  switch (label) {
    case "commonly-considered-edible-with-expert-confirmation":
      return "bg-brand-moss/15 text-brand-moss border-brand-moss/30";
    case "toxic":
      return "bg-red-100 text-red-700 border-red-300 dark:bg-red-900/30 dark:text-red-400 dark:border-red-700";
    case "inedible":
      return "bg-gray-100 text-gray-600 border-gray-300 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-600";
    case "unknown":
    default:
      return "bg-amber-100 text-amber-700 border-amber-300 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-700";
  }
}

/** Short display text for edibility labels. */
function edibilityDisplayLabel(label: EdibilityLabel): string {
  switch (label) {
    case "commonly-considered-edible-with-expert-confirmation":
      return "Expert confirmation needed";
    case "toxic":
      return "Toxic";
    case "inedible":
      return "Inedible";
    case "unknown":
    default:
      return "Unknown";
  }
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface LikelySpeciesPanelProps {
  parkId: string;
  trailId?: string;
  currentMonth: number; // 0-11
  onAddToTrip: (speciesId: string) => void;
}

// ---------------------------------------------------------------------------
// Data loading helpers
// ---------------------------------------------------------------------------

/**
 * Collect all unique likely species IDs from trails in a park.
 * If a specific trailId is provided, only that trail's species are used.
 */
async function collectSpeciesIds(
  parkId: string,
  trailId?: string,
): Promise<string[]> {
  const db = await getDB();

  let trails: Trail[];
  if (trailId) {
    const trail = await db.get("trails", trailId);
    trails = trail ? [trail] : [];
  } else {
    trails = await db.getAllFromIndex("trails", "by-parkId", parkId);
  }

  const ids = new Set<string>();
  for (const trail of trails) {
    for (const speciesId of trail.likelySpecies) {
      ids.add(speciesId);
    }
  }
  return Array.from(ids);
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function LikelySpeciesPanel({
  parkId,
  trailId,
  currentMonth,
  onAddToTrip,
}: LikelySpeciesPanelProps) {
  const [species, setSpecies] = useState<Species[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadSpecies() {
      setLoading(true);
      setError(null);

      try {
        // 1. Collect species IDs from trail data
        const speciesIds = await collectSpeciesIds(parkId, trailId);

        if (speciesIds.length === 0) {
          if (!cancelled) {
            setSpecies([]);
            setLoading(false);
          }
          return;
        }

        // 2. Batch-load species records from IndexedDB
        const records = await batchGetRecords("species", speciesIds);

        if (!cancelled) {
          // Sort alphabetically by common name for consistent display
          setSpecies(
            records.sort((a, b) => a.commonName.localeCompare(b.commonName)),
          );
          setLoading(false);
        }
      } catch {
        if (!cancelled) {
          setError("Unable to load species recommendations.");
          setLoading(false);
        }
      }
    }

    loadSpecies();
    return () => {
      cancelled = true;
    };
  }, [parkId, trailId]);

  // ---- Loading state ----
  if (loading) {
    return (
      <section aria-label="Likely species" className="space-y-4">
        <h2 className="font-heading font-semibold text-lg text-brand-forest dark:text-brand-moss">
          Likely Species
        </h2>
        <div
          className="flex gap-3 overflow-x-auto pb-2"
          aria-busy="true"
          aria-live="polite"
        >
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="shrink-0 w-44 h-56 rounded-xl bg-brand-charcoal/5 dark:bg-brand-sand/5 animate-pulse"
            />
          ))}
        </div>
      </section>
    );
  }

  // ---- Error state ----
  if (error) {
    return (
      <section aria-label="Likely species" className="space-y-4">
        <h2 className="font-heading font-semibold text-lg text-brand-forest dark:text-brand-moss">
          Likely Species
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
  if (species.length === 0) {
    return (
      <section aria-label="Likely species" className="space-y-4">
        <h2 className="font-heading font-semibold text-lg text-brand-forest dark:text-brand-moss">
          Likely Species
        </h2>
        <div className="rounded-lg border border-brand-charcoal/10 dark:border-dark-border bg-white/60 dark:bg-dark-surface/60 p-6 text-center">
          <p className="text-sm text-brand-charcoal/60 dark:text-dark-text-muted">
            No species data available for this location.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section aria-label="Likely species" className="space-y-4">
      <h2 className="font-heading font-semibold text-lg text-brand-forest dark:text-brand-moss">
        Likely Species
      </h2>

      {/* Horizontal scrollable species cards */}
      <div
        className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1"
        role="list"
        aria-label="Species likely found at this location"
      >
        {species.map((sp) => {
          const inSeason = isInSeason(sp.season, currentMonth);
          const imageUrl =
            sp.images.length > 0 &&
            (sp.images[0].startsWith("/") || sp.images[0].startsWith("http"))
              ? sp.images[0]
              : null;

          return (
            <div
              key={sp.id}
              role="listitem"
              className="shrink-0 w-44 rounded-xl border border-brand-charcoal/10 dark:border-dark-border bg-white dark:bg-dark-surface overflow-hidden flex flex-col"
            >
              {/* Species image — tapping navigates to detail */}
              <Link
                href={`/field-guide/${sp.id}`}
                className="block relative w-full h-28 bg-brand-sand/60 dark:bg-dark-surface/80 overflow-hidden"
              >
                {imageUrl ? (
                  <Image
                    src={imageUrl}
                    alt={sp.commonName}
                    width={400}
                    height={224}
                    sizes="176px"
                    quality={65}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                ) : (
                  <div className="flex items-center justify-center w-full h-full">
                    <SpeciesPlaceholderIcon />
                  </div>
                )}

                {/* "In season" badge overlay */}
                {inSeason && (
                  <span className="absolute top-1.5 right-1.5 inline-flex items-center gap-0.5 rounded-full bg-brand-moss/90 text-white text-[10px] font-semibold px-1.5 py-0.5 shadow-sm">
                    <svg
                      aria-hidden="true"
                      className="w-2.5 h-2.5"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M10 2a.75.75 0 01.75.75v1.5a.75.75 0 01-1.5 0v-1.5A.75.75 0 0110 2zm0 13a.75.75 0 01.75.75v1.5a.75.75 0 01-1.5 0v-1.5A.75.75 0 0110 15zm8-5a.75.75 0 01-.75.75h-1.5a.75.75 0 010-1.5h1.5A.75.75 0 0118 10zM5 10a.75.75 0 01-.75.75h-1.5a.75.75 0 010-1.5h1.5A.75.75 0 015 10zm11.95-4.95a.75.75 0 010 1.06l-1.06 1.06a.75.75 0 01-1.06-1.06l1.06-1.06a.75.75 0 011.06 0zm-12.73 9.9a.75.75 0 010 1.06l-1.06 1.06a.75.75 0 01-1.06-1.06l1.06-1.06a.75.75 0 011.06 0zm12.73 0a.75.75 0 01-1.06 1.06l-1.06-1.06a.75.75 0 011.06-1.06l1.06 1.06zm-9.9-12.73a.75.75 0 01-1.06 1.06L3.1 4.22a.75.75 0 011.06-1.06l1.06 1.06z" />
                    </svg>
                    In season
                  </span>
                )}
              </Link>

              {/* Species info */}
              <div className="flex-1 flex flex-col p-2.5">
                <Link
                  href={`/field-guide/${sp.id}`}
                  className="font-semibold text-sm text-brand-charcoal dark:text-dark-text truncate leading-snug hover:text-brand-teal transition-colors"
                >
                  {sp.commonName}
                </Link>

                {/* Edibility badge */}
                <span
                  className={`inline-block mt-1.5 text-[10px] font-medium rounded-full border px-2 py-0.5 w-fit ${edibilityBadgeClasses(sp.edibilityLabel)}`}
                >
                  {edibilityDisplayLabel(sp.edibilityLabel)}
                </span>

                {/* Spacer to push button to bottom */}
                <div className="flex-1" />

                {/* Add to trip button */}
                <button
                  type="button"
                  onClick={() => onAddToTrip(sp.id)}
                  className="mt-2 w-full rounded-lg bg-brand-teal/10 text-brand-teal text-xs font-medium py-1.5 transition-colors hover:bg-brand-teal/20 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-teal active:scale-[0.98]"
                >
                  + Add to trip
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Placeholder icon (used when no species image is available)
// ---------------------------------------------------------------------------

function SpeciesPlaceholderIcon() {
  return (
    <svg
      aria-hidden="true"
      className="w-8 h-8 text-brand-charcoal/20 dark:text-brand-sand/20"
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
