import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Trips — ForageFlow",
  description:
    "View, search, and manage your saved foraging trips. Works offline.",
};

const tripStatuses = [
  { label: "Planned", color: "bg-brand-teal/10 text-brand-teal" },
  { label: "In Progress", color: "bg-brand-moss/10 text-brand-moss" },
  { label: "Completed", color: "bg-brand-forest/10 text-brand-forest" },
];

export default function TripsPage() {
  return (
    <main className="flex min-h-screen flex-col px-4 py-6 max-w-lg mx-auto">
      <header className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-brand-forest dark:text-brand-moss font-heading">
            My Trips
          </h1>
          <p className="text-sm text-brand-charcoal/70 dark:text-brand-sand/70 mt-1">
            Plan outings, track progress, and review past trips.
          </p>
        </div>
        <Link
          href="/trips/new"
          className="shrink-0 rounded-lg bg-brand-teal text-white font-semibold text-sm px-4 py-2.5 hover:bg-brand-teal/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-teal transition-colors active:scale-[0.98]"
        >
          + New Trip
        </Link>
      </header>

      {/* Search */}
      <div className="mb-4">
        <label htmlFor="trips-search" className="sr-only">
          Search trips
        </label>
        <input
          id="trips-search"
          type="search"
          placeholder="Search trips by name, park, or date…"
          className="w-full rounded-lg border border-brand-teal/20 bg-white/80 dark:bg-brand-charcoal/60 px-4 py-3 text-sm text-brand-charcoal dark:text-brand-sand placeholder:text-brand-charcoal/40 dark:placeholder:text-brand-sand/40 focus:outline-none focus:ring-2 focus:ring-brand-teal/40"
        />
      </div>

      {/* Status filter chips */}
      <div className="flex gap-2 mb-6" role="group" aria-label="Trip status filters">
        <button
          type="button"
          className="rounded-full border border-brand-teal/20 bg-brand-teal/10 px-3 py-1.5 text-xs font-medium text-brand-teal"
        >
          All
        </button>
        {tripStatuses.map((status) => (
          <button
            key={status.label}
            type="button"
            className={`rounded-full border border-brand-teal/10 px-3 py-1.5 text-xs font-medium ${status.color} hover:opacity-80 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-teal transition-colors`}
          >
            {status.label}
          </button>
        ))}
      </div>

      {/* Empty state */}
      <section className="flex flex-col items-center justify-center py-16 text-center">
        <svg
          aria-hidden="true"
          className="w-16 h-16 text-brand-teal/20 mb-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9 6.75V15m6-6v8.25m.503-12.713l5.248-2.187A.75.75 0 0121.75 3v14.25a.75.75 0 01-.497.702l-5.253 2.188a.75.75 0 01-.503 0L9.75 17.953a.75.75 0 00-.503 0l-5.248 2.187A.75.75 0 013 19.39V5.14a.75.75 0 01.497-.702l5.253-2.188a.75.75 0 01.503 0L15 5.327"
          />
        </svg>
        <h2 className="font-heading font-semibold text-base text-brand-charcoal dark:text-brand-sand mb-1">
          No trips yet
        </h2>
        <p className="text-sm text-brand-charcoal/60 dark:text-brand-sand/60 mb-4 max-w-xs">
          Create your first trip to start planning a foraging outing at a
          Tennessee park or trail.
        </p>
        <Link
          href="/trips/new"
          className="rounded-lg bg-brand-teal text-white font-semibold text-sm px-6 py-3 hover:bg-brand-teal/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-teal transition-colors active:scale-[0.98]"
        >
          Create Your First Trip
        </Link>
      </section>

      {/* Offline note */}
      <p className="text-xs text-center text-brand-charcoal/50 dark:text-brand-sand/50 mt-auto">
        Trips are saved locally and sync when you&apos;re back online.
      </p>
    </main>
  );
}
