"use client";

/**
 * ForageWise — CommunityFeedPreview Component
 *
 * Displays the 3 most recent public community sightings on the home page.
 * Each sighting shows species guess, notes preview, and timestamp.
 * Tapping the section navigates to `/community`.
 *
 * Requirements: 11.2, 11.8
 */

import Link from "next/link";
import { useCommunityPreview } from "@/hooks/useCommunityPreview";

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

export default function CommunityFeedPreview() {
  const { previews, loading, error } = useCommunityPreview();

  if (loading) {
    return (
      <section aria-label="Community feed preview" className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-heading font-semibold text-lg text-brand-forest dark:text-brand-moss">
            Community Sightings
          </h2>
        </div>
        <div className="space-y-2" aria-busy="true" aria-live="polite">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-16 rounded-lg bg-brand-charcoal/5 dark:bg-brand-sand/5 animate-pulse"
            />
          ))}
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section aria-label="Community feed preview" className="space-y-3">
        <h2 className="font-heading font-semibold text-lg text-brand-forest dark:text-brand-moss">
          Community Sightings
        </h2>
        <div
          role="alert"
          className="rounded-lg border border-brand-earth/20 bg-brand-earth/10 p-4 text-center"
        >
          <p className="text-sm text-brand-earth dark:text-brand-earth-200">
            Unable to load community sightings.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section aria-label="Community feed preview" className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="font-heading font-semibold text-lg text-brand-forest dark:text-brand-moss">
          Community Sightings
        </h2>
        <Link
          href="/community"
          className="text-sm font-medium text-brand-teal hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-teal"
        >
          View all →
        </Link>
      </div>

      {previews.length === 0 ? (
        <div className="rounded-lg border border-brand-charcoal/10 dark:border-dark-border bg-white/60 dark:bg-dark-surface/60 p-6 text-center">
          <p className="text-sm text-brand-charcoal/60 dark:text-dark-text-muted">
            No public sightings yet. Be the first to share!
          </p>
          <Link
            href="/community"
            className="inline-block mt-2 text-sm font-medium text-brand-teal hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-teal"
          >
            Go to Community →
          </Link>
        </div>
      ) : (
        <Link
          href="/community"
          className="block rounded-xl border border-brand-teal/10 bg-white/80 dark:bg-dark-surface/80 overflow-hidden transition-colors hover:bg-brand-teal/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-teal"
          aria-label="View all community sightings"
        >
          <ul className="divide-y divide-brand-teal/10">
            {previews.map((sighting) => (
              <li key={sighting.id} className="px-4 py-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-sm text-brand-charcoal dark:text-dark-text truncate">
                      {sighting.speciesGuess || "Unknown species"}
                    </p>
                    {sighting.notes && (
                      <p className="text-xs text-brand-charcoal/60 dark:text-dark-text-muted mt-0.5 line-clamp-1">
                        {sighting.notes}
                      </p>
                    )}
                  </div>
                  <span className="flex-shrink-0 text-xs text-brand-charcoal/50 dark:text-dark-text-muted">
                    {formatDate(sighting.createdAt)}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </Link>
      )}
    </section>
  );
}
