"use client";

/**
 * ForageFlow — TrailPicker Component
 *
 * List of trails for the selected park during trip creation.
 * Displays each trail with name, distance (in miles), and difficulty
 * badge. Includes loading, error, and empty states. Loads trail data
 * from IndexedDB using the `by-parkId` index and functions fully offline.
 *
 * Requirements: 5.1, 5.2, 5.3, 5.4, 5.5
 */

import { useEffect, useState } from "react";
import { getDB } from "@/offline/db";
import type { Trail, TrailDifficulty } from "@/types";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Difficulty badge colors keyed by TrailDifficulty value. */
const difficultyStyles: Record<TrailDifficulty, { bg: string; text: string }> = {
  easy: {
    bg: "bg-brand-moss-100 dark:bg-brand-moss-800",
    text: "text-brand-moss-700 dark:text-brand-moss-200",
  },
  moderate: {
    bg: "bg-brand-earth-100 dark:bg-brand-earth-800",
    text: "text-brand-earth-700 dark:text-brand-earth-200",
  },
  hard: {
    bg: "bg-orange-100 dark:bg-orange-900",
    text: "text-orange-700 dark:text-orange-200",
  },
  expert: {
    bg: "bg-red-100 dark:bg-red-900",
    text: "text-red-700 dark:text-red-200",
  },
};

/** Human-readable difficulty labels. */
const difficultyLabels: Record<TrailDifficulty, string> = {
  easy: "Easy",
  moderate: "Moderate",
  hard: "Hard",
  expert: "Expert",
};

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface TrailPickerProps {
  parkId: string;
  selectedTrailId: string | null;
  onSelectTrail: (trailId: string) => void;
}

// ---------------------------------------------------------------------------
// Helper: load trails by parkId using IndexedDB index
// ---------------------------------------------------------------------------

export async function getTrailsByParkId(parkId: string): Promise<Trail[]> {
  const db = await getDB();
  return db.getAllFromIndex("trails", "by-parkId", parkId);
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function TrailPicker({
  parkId,
  selectedTrailId,
  onSelectTrail,
}: TrailPickerProps) {
  const [trails, setTrails] = useState<Trail[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load trails from IndexedDB when parkId changes
  useEffect(() => {
    let cancelled = false;

    async function loadTrails() {
      setLoading(true);
      setError(null);

      try {
        const records = await getTrailsByParkId(parkId);
        if (!cancelled) {
          // Sort alphabetically by name for consistent display
          setTrails(records.sort((a, b) => a.name.localeCompare(b.name)));
          setLoading(false);
        }
      } catch (err) {
        if (!cancelled) {
          setError("Unable to load trails. Please try again.");
          setLoading(false);
        }
      }
    }

    loadTrails();
    return () => {
      cancelled = true;
    };
  }, [parkId]);

  // ---- Loading state ----
  if (loading) {
    return (
      <section aria-label="Trail picker" className="space-y-4">
        <h2 className="font-heading font-semibold text-lg text-brand-forest dark:text-brand-moss">
          Select a Trail
        </h2>
        <div
          className="space-y-2"
          aria-busy="true"
          aria-live="polite"
        >
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="rounded-xl bg-brand-charcoal/5 dark:bg-brand-sand/5 animate-pulse h-16"
            />
          ))}
        </div>
      </section>
    );
  }

  // ---- Error state ----
  if (error) {
    return (
      <section aria-label="Trail picker" className="space-y-4">
        <h2 className="font-heading font-semibold text-lg text-brand-forest dark:text-brand-moss">
          Select a Trail
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
  if (trails.length === 0) {
    return (
      <section aria-label="Trail picker" className="space-y-4">
        <h2 className="font-heading font-semibold text-lg text-brand-forest dark:text-brand-moss">
          Select a Trail
        </h2>
        <div className="rounded-lg border border-brand-charcoal/10 dark:border-dark-border bg-white/60 dark:bg-dark-surface/60 p-6 text-center">
          <p className="text-sm text-brand-charcoal/60 dark:text-dark-text-muted">
            No trails available for this park.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section aria-label="Trail picker" className="space-y-4">
      <h2 className="font-heading font-semibold text-lg text-brand-forest dark:text-brand-moss">
        Select a Trail
      </h2>

      {/* Trail list */}
      <div
        className="space-y-2"
        role="listbox"
        aria-label="Trails"
      >
        {trails.map((trail) => {
          const isSelected = selectedTrailId === trail.id;
          const style = difficultyStyles[trail.difficulty] ?? {
            bg: "bg-brand-charcoal/10",
            text: "text-brand-charcoal/70",
          };

          return (
            <button
              key={trail.id}
              type="button"
              role="option"
              aria-selected={isSelected}
              onClick={() => onSelectTrail(trail.id)}
              className={`w-full rounded-xl border p-3 text-left transition-all focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-teal active:scale-[0.98] ${
                isSelected
                  ? "border-brand-teal ring-2 ring-brand-teal/30 bg-white dark:bg-dark-surface"
                  : "border-brand-charcoal/10 dark:border-dark-border bg-white/80 dark:bg-dark-surface/80 hover:border-brand-teal/30 hover:bg-brand-teal/5"
              }`}
            >
              <div className="flex items-center justify-between gap-3">
                {/* Trail info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-sm text-brand-charcoal dark:text-dark-text truncate leading-snug">
                      {trail.name}
                    </p>
                    {/* Selected checkmark */}
                    {isSelected && (
                      <div className="flex-shrink-0 flex items-center justify-center w-5 h-5 rounded-full bg-brand-teal text-white">
                        <svg
                          aria-hidden="true"
                          className="w-3 h-3"
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
                  <p className="text-xs text-brand-charcoal/60 dark:text-dark-text-muted mt-0.5">
                    {trail.distance} {trail.distance === 1 ? "mile" : "miles"}
                  </p>
                </div>

                {/* Difficulty badge */}
                <span
                  className={`flex-shrink-0 inline-block text-xs font-medium rounded-full px-2 py-0.5 ${style.bg} ${style.text}`}
                >
                  {difficultyLabels[trail.difficulty] ?? trail.difficulty}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}
