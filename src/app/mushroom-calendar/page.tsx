'use client';

/**
 * ForageWise — Mushroom Calendar Page
 *
 * Displays all 12 months of the year with mushroom species in season,
 * image thumbnails, monthly foraging tips, and a safety disclaimer.
 * Current month is highlighted with a visual indicator.
 *
 * When a month is selected, displays an expanded vertically scrolling list
 * with thumbnails, common names, and one-sentence summaries.
 *
 * Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 10.1, 10.3
 */

import { useState } from 'react';
import Link from 'next/link';
import { useMushroomCalendar } from '@/hooks/useMushroomCalendar';
import DismissibleDisclaimer from '@/components/DismissibleDisclaimer';
import SpeciesImage, { pickImageUrl } from '@/components/SpeciesImage';

/**
 * Truncate a string to a maximum length, appending ellipsis if truncated.
 */
function truncateSummary(text: string, maxLength = 120): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).trimEnd() + '…';
}

export default function MushroomCalendarPage() {
  const { months, currentMonth, loading, error } = useMushroomCalendar();
  const [selectedMonth, setSelectedMonth] = useState<number | null>(null);

  const selectedMonthData = selectedMonth !== null
    ? months.find((m) => m.month === selectedMonth)
    : null;

  return (
    <main className="flex min-h-screen flex-col px-4 py-6 pb-24 max-w-2xl mx-auto">
      {/* Breadcrumb navigation */}
      <nav aria-label="Breadcrumb" className="mb-4">
        <Link
          href="/field-guide"
          className="inline-flex items-center gap-1.5 text-sm text-brand-teal hover:text-brand-teal-600 dark:text-brand-teal-300 dark:hover:text-brand-teal-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-teal transition-colors"
          aria-label="Back to Field Guide"
        >
          <svg
            aria-hidden="true"
            className="w-4 h-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15.75 19.5L8.25 12l7.5-7.5"
            />
          </svg>
          Field Guide
        </Link>
      </nav>

      {/* Header */}
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-brand-forest dark:text-brand-moss font-heading">
          Mushroom Calendar
        </h1>
        <p className="text-sm text-brand-charcoal/70 dark:text-dark-text-muted mt-1">
          See which mushrooms are in season each month in Tennessee.
        </p>
      </header>

      {/* Safety disclaimer — Requirement 10.3 (dismissible) */}
      <DismissibleDisclaimer storageKey="forageflow-calendar-disclaimer-ack">
        <p>
          All identifications shown are possible matches only. Always verify
          with a qualified expert before consuming any foraged species.
        </p>
      </DismissibleDisclaimer>

      {/* Error state */}
      {error && (
        <div
          className="rounded-lg border border-red-300 bg-red-50 dark:bg-red-900/20 dark:border-red-700 p-4 mb-6 text-sm text-red-700 dark:text-red-400"
          role="alert"
        >
          {error}
        </div>
      )}

      {/* Loading skeleton */}
      {loading && (
        <div role="status" aria-label="Loading mushroom calendar">
          <div className="space-y-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="rounded-xl border border-brand-charcoal/10 dark:border-dark-border p-4 animate-pulse"
              >
                <div className="h-6 w-32 bg-brand-charcoal/10 dark:bg-dark-border rounded mb-3" />
                <div className="flex gap-3 overflow-hidden">
                  {Array.from({ length: 3 }).map((_, j) => (
                    <div key={j} className="shrink-0 w-24">
                      <div className="w-24 h-20 bg-brand-charcoal/10 dark:bg-dark-border rounded-lg mb-2" />
                      <div className="h-3 w-20 bg-brand-charcoal/10 dark:bg-dark-border rounded" />
                    </div>
                  ))}
                </div>
                <div className="h-4 w-full bg-brand-charcoal/10 dark:bg-dark-border rounded mt-3" />
              </div>
            ))}
          </div>
          <span className="sr-only">Loading mushroom calendar…</span>
        </div>
      )}

      {/* Expanded monthly view — Requirement 8.1, 8.2, 8.3, 8.4, 8.5, 8.6 */}
      {!loading && !error && selectedMonthData && (
        <div className="mb-6">
          {/* Back to all months */}
          <button
            onClick={() => setSelectedMonth(null)}
            className="inline-flex items-center gap-1.5 text-sm text-brand-teal hover:text-brand-teal-600 dark:text-brand-teal-300 dark:hover:text-brand-teal-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-teal transition-colors mb-4 min-h-[44px] min-w-[44px]"
            aria-label="Back to all months"
          >
            <svg
              aria-hidden="true"
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15.75 19.5L8.25 12l7.5-7.5"
              />
            </svg>
            All Months
          </button>

          <h2 className="text-xl font-heading font-semibold text-brand-charcoal dark:text-dark-text mb-4">
            {selectedMonthData.label}
          </h2>

          {/* Species list — vertically scrolling */}
          {selectedMonthData.species.length > 0 ? (
            <div className="space-y-3">
              {selectedMonthData.species.map((species) => (
                <Link
                  key={species.id}
                  href={`/field-guide/${species.id}`}
                  className="flex items-center gap-3 p-3 rounded-lg border border-brand-charcoal/10 dark:border-dark-border bg-white/80 dark:bg-dark-surface/80 hover:border-brand-teal/40 hover:bg-brand-teal/5 dark:hover:bg-brand-teal/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-teal transition-colors min-h-[44px]"
                  aria-label={`View details for ${species.commonName}`}
                >
                  {/* Thumbnail */}
                  <div className="shrink-0 w-14 h-14 rounded-lg overflow-hidden">
                    <SpeciesImage
                      src={pickImageUrl(species.image ? [species.image] : [])}
                      alt={species.commonName}
                      variant="seasonal"
                      className="w-14 h-14 rounded-lg"
                    />
                  </div>

                  {/* Name and summary */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-brand-charcoal dark:text-dark-text leading-tight">
                      {species.commonName}
                    </p>
                    {species.summary && (
                      <p className="text-xs text-brand-charcoal/60 dark:text-dark-text-muted mt-0.5 leading-snug">
                        {truncateSummary(species.summary)}
                      </p>
                    )}
                  </div>

                  {/* Chevron */}
                  <svg
                    aria-hidden="true"
                    className="shrink-0 w-4 h-4 text-brand-charcoal/30 dark:text-dark-text-muted"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M8.25 4.5l7.5 7.5-7.5 7.5"
                    />
                  </svg>
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-sm text-brand-charcoal/50 dark:text-dark-text-muted italic py-4">
              No species typically found this month.
            </p>
          )}

          {/* Monthly foraging tip */}
          {selectedMonthData.foragingTip && (
            <div className="mt-4 pt-3 border-t border-brand-charcoal/10 dark:border-dark-border">
              <p className="text-xs text-brand-charcoal/70 dark:text-dark-text-muted leading-relaxed">
                <span className="font-semibold text-brand-earth dark:text-brand-earth">
                  Foraging tip:
                </span>{' '}
                {selectedMonthData.foragingTip}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Month sections — overview grid */}
      {!loading && !error && !selectedMonthData && (
        <div className="space-y-6">
          {months.map((monthData) => {
            const isCurrent = monthData.month === currentMonth;

            return (
              <section
                key={monthData.month}
                aria-label={`${monthData.label}${isCurrent ? ' (current month)' : ''}`}
                className={`rounded-xl border p-4 transition-colors ${
                  isCurrent
                    ? 'ring-2 ring-brand-moss border-brand-moss/40 bg-brand-moss/5 dark:bg-brand-moss/10'
                    : 'border-brand-charcoal/10 dark:border-dark-border bg-white/80 dark:bg-dark-surface/80'
                }`}
              >
                {/* Month heading — clickable to expand */}
                <button
                  onClick={() => setSelectedMonth(monthData.month)}
                  className="flex items-center gap-2 mb-3 w-full text-left min-h-[44px] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-teal rounded-md"
                  aria-label={`View all species for ${monthData.label}`}
                >
                  <h2 className="text-lg font-heading font-semibold text-brand-charcoal dark:text-dark-text">
                    {monthData.label}
                  </h2>
                  {isCurrent && (
                    <span className="inline-flex items-center rounded-full bg-brand-moss/20 text-brand-moss px-2 py-0.5 text-xs font-medium">
                      Current
                    </span>
                  )}
                  <span className="ml-auto text-xs text-brand-charcoal/50 dark:text-dark-text-muted">
                    {monthData.species.length} species
                  </span>
                </button>

                {/* Species grid */}
                {monthData.species.length > 0 ? (
                  <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1">
                    {monthData.species.map((species) => (
                      <Link
                        key={species.id}
                        href={`/field-guide/${species.id}`}
                        className="shrink-0 w-28 group focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-teal rounded-lg min-h-[44px]"
                        aria-label={`View details for ${species.commonName}`}
                      >
                        <SpeciesImage
                          src={pickImageUrl(species.image ? [species.image] : [])}
                          alt={species.commonName}
                          variant="seasonal"
                          className="w-28 h-20 rounded-lg"
                        />
                        <p className="mt-1.5 text-xs font-medium text-brand-charcoal dark:text-dark-text leading-tight group-hover:text-brand-teal transition-colors line-clamp-2">
                          {species.commonName}
                        </p>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-brand-charcoal/50 dark:text-dark-text-muted italic">
                    No species typically found this month.
                  </p>
                )}

                {/* Monthly foraging tip — Requirements 8.1, 8.2, 8.3, 8.4 */}
                {monthData.foragingTip && (
                  <div className="mt-3 pt-3 border-t border-brand-charcoal/10 dark:border-dark-border">
                    <p className="text-xs text-brand-charcoal/70 dark:text-dark-text-muted leading-relaxed">
                      <span className="font-semibold text-brand-earth dark:text-brand-earth">
                        Foraging tip:
                      </span>{' '}
                      {monthData.foragingTip}
                    </p>
                  </div>
                )}
              </section>
            );
          })}
        </div>
      )}
    </main>
  );
}
