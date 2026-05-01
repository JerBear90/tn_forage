"use client";

/**
 * ForageFlow — Field Guide List Page
 *
 * Searchable, filterable species list that reads entirely from IndexedDB.
 * Works offline. Mobile-first layout with single column on mobile,
 * 2 columns on tablet+.
 */

import { useState, useMemo, useCallback } from "react";
import Link from "next/link";
import { useSpecies, type FieldGuideItem } from "@/hooks/useSpecies";
import { usePreloadSpecies } from "@/hooks/usePreloadSpecies";
import RegionalFilter from "@/components/RegionalFilter";
import SkeletonCard from "@/components/skeletons/SkeletonCard";
import SpeciesImage, { pickImageUrl } from "@/components/SpeciesImage";
import VirtualScroller from "@/components/VirtualScroller";
import type { SpeciesCategory, EdibilityLabel, TnRegion } from "@/types";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const CATEGORY_FILTERS: { label: string; value: SpeciesCategory | "all" }[] = [
  { label: "All", value: "all" },
  { label: "Mushroom", value: "mushroom" },
  { label: "Plant", value: "plant" },
  { label: "Tree", value: "tree" },
];

/** Item count threshold above which virtual scrolling is used. */
const VIRTUAL_SCROLL_THRESHOLD = 20;

/** Estimated height (px) for a species card in the grid. */
const ESTIMATED_CARD_HEIGHT = 280;

const SEASON_OPTIONS = ["Spring", "Summer", "Fall", "Winter"] as const;
type Season = (typeof SEASON_OPTIONS)[number];

const EDIBILITY_OPTIONS: { label: string; value: EdibilityLabel }[] = [
  { label: "Expert confirmation needed", value: "commonly-considered-edible-with-expert-confirmation" },
  { label: "Toxic", value: "toxic" },
  { label: "Inedible", value: "inedible" },
  { label: "Unknown", value: "unknown" },
];

// ---------------------------------------------------------------------------
// Edibility badge helpers
// ---------------------------------------------------------------------------

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
// Category badge helper
// ---------------------------------------------------------------------------

function categoryBadgeClasses(category: SpeciesCategory): string {
  switch (category) {
    case "mushroom":
      return "bg-brand-earth/15 text-brand-earth border-brand-earth/30";
    case "plant":
      return "bg-brand-moss/15 text-brand-moss border-brand-moss/30";
    case "tree":
      return "bg-brand-forest/15 text-brand-forest border-brand-forest/30";
    default:
      return "bg-gray-100 text-gray-600 border-gray-300";
  }
}

function categoryDisplayLabel(category: SpeciesCategory): string {
  return category.charAt(0).toUpperCase() + category.slice(1);
}

// ---------------------------------------------------------------------------
// Multi-select chip helper
// ---------------------------------------------------------------------------

function toggleSetValue<T>(set: Set<T>, value: T): Set<T> {
  const next = new Set(set);
  if (next.has(value)) {
    next.delete(value);
  } else {
    next.add(value);
  }
  return next;
}

// ---------------------------------------------------------------------------
// Filter Panel (collapsible)
// ---------------------------------------------------------------------------

function FilterPanel({
  selectedSeasons,
  onToggleSeason,
  selectedEdibility,
  onToggleEdibility,
  activeFilterCount,
  onClearAll,
}: {
  selectedSeasons: Set<Season>;
  onToggleSeason: (s: Season) => void;
  selectedEdibility: Set<EdibilityLabel>;
  onToggleEdibility: (e: EdibilityLabel) => void;
  activeFilterCount: number;
  onClearAll: () => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="mb-4">
      {/* Toggle button */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setOpen((prev) => !prev)}
          aria-expanded={open}
          aria-controls="field-guide-filters"
          className="flex items-center gap-1.5 rounded-lg border border-brand-teal/20 bg-white/60 dark:bg-dark-surface/60 px-3 py-2 text-xs font-medium text-brand-charcoal dark:text-dark-text hover:bg-brand-teal/10 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-teal"
        >
          {/* Filter icon */}
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
              d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
            />
          </svg>
          Filters
          {activeFilterCount > 0 && (
            <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-brand-teal text-white text-xs font-bold">
              {activeFilterCount}
            </span>
          )}
          {/* Chevron */}
          <svg
            aria-hidden="true"
            className={`w-3.5 h-3.5 transition-transform ${open ? "rotate-180" : ""}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {activeFilterCount > 0 && (
          <button
            type="button"
            onClick={onClearAll}
            className="text-xs text-brand-teal hover:text-brand-teal-700 dark:hover:text-brand-teal-300 underline underline-offset-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-teal"
          >
            Clear all filters
          </button>
        )}
      </div>

      {/* Collapsible panel */}
      {open && (
        <div
          id="field-guide-filters"
          className="mt-3 rounded-lg border border-brand-teal/10 bg-white/60 dark:bg-dark-surface/60 p-4 space-y-4"
        >
          {/* Season filter */}
          <fieldset>
            <legend className="text-xs font-semibold text-brand-charcoal dark:text-dark-text mb-2">
              Season
            </legend>
            <div className="flex flex-wrap gap-2" role="group" aria-label="Season filters">
              {SEASON_OPTIONS.map((season) => {
                const isActive = selectedSeasons.has(season);
                return (
                  <button
                    key={season}
                    type="button"
                    aria-pressed={isActive}
                    onClick={() => onToggleSeason(season)}
                    className={`shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-teal ${
                      isActive
                        ? "bg-brand-forest text-white border-brand-forest"
                        : "bg-white/60 dark:bg-dark-surface/80 text-brand-charcoal dark:text-dark-text border-brand-forest/20 hover:bg-brand-forest/10"
                    }`}
                  >
                    {season}
                  </button>
                );
              })}
            </div>
          </fieldset>

          {/* Edibility label filter */}
          <fieldset>
            <legend className="text-xs font-semibold text-brand-charcoal dark:text-dark-text mb-2">
              Edibility
            </legend>
            <div className="flex flex-wrap gap-2" role="group" aria-label="Edibility filters">
              {EDIBILITY_OPTIONS.map((opt) => {
                const isActive = selectedEdibility.has(opt.value);
                return (
                  <button
                    key={opt.value}
                    type="button"
                    aria-pressed={isActive}
                    onClick={() => onToggleEdibility(opt.value)}
                    className={`shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-teal ${
                      isActive
                        ? "bg-brand-earth text-white border-brand-earth"
                        : "bg-white/60 dark:bg-dark-surface/80 text-brand-charcoal dark:text-dark-text border-brand-earth/20 hover:bg-brand-earth/10"
                    }`}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </fieldset>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Species Card
// ---------------------------------------------------------------------------

function SpeciesCard({ item, onPreload }: { item: FieldGuideItem; onPreload: (id: string) => void }) {
  const imageUrl = pickImageUrl(item.images);

  const handlePreload = useCallback(() => {
    onPreload(item.id);
  }, [item.id, onPreload]);

  return (
    <Link
      href={`/field-guide/${item.id}`}
      className="block rounded-xl border border-brand-charcoal/10 dark:border-dark-border bg-white/80 dark:bg-dark-surface/80 overflow-hidden hover:shadow-md transition-shadow focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-teal"
      onMouseEnter={handlePreload}
      onFocus={handlePreload}
    >
      {/* Species image */}
      <SpeciesImage
        src={imageUrl}
        alt={item.commonName}
        variant="card"
        className="aspect-[4/3]"
      />

      {/* Card body */}
      <div className="p-3">
        <h3 className="font-heading font-semibold text-sm text-brand-charcoal dark:text-dark-text leading-tight">
          {item.commonName}
        </h3>
        <p className="text-xs text-brand-charcoal/60 dark:text-dark-text-muted italic mt-0.5">
          {item.scientificName}
        </p>

        {/* Badges */}
        <div className="flex flex-wrap gap-1.5 mt-2">
          <span
            className={`inline-block rounded-full border px-2 py-0.5 text-xs font-medium ${categoryBadgeClasses(item.category)}`}
          >
            {categoryDisplayLabel(item.category)}
          </span>
          <span
            className={`inline-block rounded-full border px-2 py-0.5 text-xs font-medium ${edibilityBadgeClasses(item.edibilityLabel)}`}
          >
            {edibilityDisplayLabel(item.edibilityLabel)}
          </span>
        </div>
      </div>
    </Link>
  );
}

// ---------------------------------------------------------------------------
// Loading Skeleton
// ---------------------------------------------------------------------------

function LoadingSkeleton() {
  return (
    <div
      className="grid grid-cols-1 sm:grid-cols-2 gap-4"
      aria-label="Loading species data"
      role="status"
    >
      {Array.from({ length: 6 }).map((_, i) => (
        <SkeletonCard key={i} variant="species" />
      ))}
      <span className="sr-only">Loading species data…</span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Empty State
// ---------------------------------------------------------------------------

function EmptyState({ hasFilters }: { hasFilters: boolean }) {
  return (
    <div className="text-center py-12" role="status">
      <svg
        aria-hidden="true"
        className="w-16 h-16 mx-auto text-brand-charcoal/20 dark:text-brand-sand/20 mb-4"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M21 21l-4.35-4.35M11 19a8 8 0 100-16 8 8 0 000 16z"
        />
      </svg>
      <p className="text-sm text-brand-charcoal/60 dark:text-brand-sand/60">
        {hasFilters
          ? "No species match your search or filters."
          : "No species data available. Try reloading the app."}
      </p>
      {hasFilters && (
        <p className="text-xs text-brand-charcoal/40 dark:text-brand-sand/40 mt-1">
          Try adjusting your search or clearing filters.
        </p>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Page Component
// ---------------------------------------------------------------------------

export default function FieldGuidePage() {
  const { items, loading, error } = useSpecies();
  const { preload } = usePreloadSpecies();
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<SpeciesCategory | "all">("all");
  const [selectedRegion, setSelectedRegion] = useState<TnRegion | "all">("all");
  const [selectedSeasons, setSelectedSeasons] = useState<Set<Season>>(new Set());
  const [selectedEdibility, setSelectedEdibility] = useState<Set<EdibilityLabel>>(new Set());

  // Count of active advanced filters (season + edibility selections)
  const activeFilterCount = selectedSeasons.size + selectedEdibility.size;

  // Filter and search logic — AND across all filter dimensions
  const filtered = useMemo(() => {
    let result = items;

    // Category filter
    if (activeCategory !== "all") {
      result = result.filter((item) => item.category === activeCategory);
    }

    // Region filter — item matches if its regions array includes the selected region
    if (selectedRegion !== "all") {
      result = result.filter((item) => item.regions.includes(selectedRegion));
    }

    // Season filter — item matches if ANY of its seasons match ANY selected season
    if (selectedSeasons.size > 0) {
      result = result.filter((item) =>
        item.season.some((s) => selectedSeasons.has(s as Season))
      );
    }

    // Edibility filter — item matches if its label is in the selected set
    if (selectedEdibility.size > 0) {
      result = result.filter((item) => selectedEdibility.has(item.edibilityLabel));
    }

    // Search filter (commonName and scientificName)
    const query = search.trim().toLowerCase();
    if (query) {
      result = result.filter(
        (item) =>
          item.commonName.toLowerCase().includes(query) ||
          item.scientificName.toLowerCase().includes(query)
      );
    }

    return result;
  }, [items, activeCategory, selectedRegion, selectedSeasons, selectedEdibility, search]);

  const hasFilters =
    search.trim() !== "" ||
    activeCategory !== "all" ||
    selectedRegion !== "all" ||
    selectedSeasons.size > 0 ||
    selectedEdibility.size > 0;

  function handleClearAllFilters() {
    setActiveCategory("all");
    setSelectedRegion("all");
    setSelectedSeasons(new Set());
    setSelectedEdibility(new Set());
    setSearch("");
  }

  return (
    <main className="flex min-h-screen flex-col px-4 py-6 pb-24 max-w-2xl mx-auto">
      {/* Header */}
      <header className="mb-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-brand-forest dark:text-brand-moss font-heading">
            Field Guide
          </h1>
        </div>
        <p className="text-sm text-brand-charcoal/70 dark:text-dark-text-muted mt-1">
          Offline species reference for Tennessee mushrooms, plants, and trees.
        </p>

        {/* Spore Print & Compare — above search */}
        <div className="flex items-center gap-2 mt-3">
          <Link
            href="/field-guide/spore-print"
            className="inline-flex items-center gap-1.5 rounded-lg border border-brand-earth/30 bg-brand-earth/10 dark:bg-brand-earth/20 px-3 py-2 text-xs font-medium text-brand-earth dark:text-brand-earth-300 hover:bg-brand-earth/20 dark:hover:bg-brand-earth/30 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-teal"
            aria-label="Spore Print Guide"
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
                d="M7.5 14.25v2.25m3-4.5v4.5m3-6.75v6.75m3-9v9M6 20.25h12A2.25 2.25 0 0020.25 18V6A2.25 2.25 0 0018 3.75H6A2.25 2.25 0 003.75 6v12A2.25 2.25 0 006 20.25z"
              />
            </svg>
            Spore Print
          </Link>
          <Link
            href="/field-guide/compare"
            className="inline-flex items-center gap-1.5 rounded-lg border border-brand-teal/30 bg-brand-teal/10 dark:bg-brand-teal/20 px-3 py-2 text-xs font-medium text-brand-teal dark:text-brand-teal-300 hover:bg-brand-teal/20 dark:hover:bg-brand-teal/30 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-teal"
            aria-label="Compare species side by side"
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
                d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15"
              />
            </svg>
            Compare
          </Link>
        </div>
      </header>

      {/* Search bar */}
      <div className="mb-4">
        <label htmlFor="field-guide-search" className="sr-only">
          Search species by common or scientific name
        </label>
        <input
          id="field-guide-search"
          type="search"
          placeholder="Search by common or scientific name…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-lg border border-brand-teal/20 bg-white/80 dark:bg-dark-surface/60 px-4 py-3 text-sm text-brand-charcoal dark:text-dark-text placeholder:text-brand-charcoal/40 dark:placeholder:text-dark-text-muted focus:outline-none focus:ring-2 focus:ring-brand-teal/40"
        />
      </div>

      {/* Category filter chips */}
      <div
        className="flex gap-2 mb-4 overflow-x-auto pb-1"
        role="group"
        aria-label="Category filters"
      >
        {CATEGORY_FILTERS.map((filter) => {
          const isActive = activeCategory === filter.value;
          return (
            <button
              key={filter.value}
              type="button"
              aria-pressed={isActive}
              onClick={() => setActiveCategory(filter.value)}
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

      {/* Regional filter chips */}
      <RegionalFilter
        selectedRegion={selectedRegion}
        onRegionChange={setSelectedRegion}
      />

      {/* Advanced filters — collapsible panel */}
      <FilterPanel
        selectedSeasons={selectedSeasons}
        onToggleSeason={(s) => setSelectedSeasons((prev) => toggleSetValue(prev, s))}
        selectedEdibility={selectedEdibility}
        onToggleEdibility={(e) => setSelectedEdibility((prev) => toggleSetValue(prev, e))}
        activeFilterCount={activeFilterCount}
        onClearAll={handleClearAllFilters}
      />

      {/* Error state */}
      {error && (
        <div
          className="rounded-lg border border-red-300 bg-red-50 dark:bg-red-900/20 dark:border-red-700 p-4 mb-6 text-sm text-red-700 dark:text-red-400"
          role="alert"
        >
          {error}
        </div>
      )}

      {/* Content */}
      {loading ? (
        <LoadingSkeleton />
      ) : filtered.length === 0 ? (
        <EmptyState hasFilters={hasFilters} />
      ) : (
        <>
          {/* Results count */}
          <p className="text-xs text-brand-charcoal/50 dark:text-dark-text-muted mb-3">
            {filtered.length} {filtered.length === 1 ? "species" : "species"} found
          </p>

          {/* Species grid — virtual scroll for large lists, standard grid otherwise */}
          {filtered.length > VIRTUAL_SCROLL_THRESHOLD ? (
            <VirtualScroller
              items={filtered}
              estimateSize={() => ESTIMATED_CARD_HEIGHT}
              overscan={5}
              className="flex-1"
              style={{ height: "calc(100vh - 320px)", minHeight: 400 }}
              renderItem={(item) => (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-4">
                  <SpeciesCard item={item} onPreload={preload} />
                </div>
              )}
            />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {filtered.map((item) => (
                <SpeciesCard key={item.id} item={item} onPreload={preload} />
              ))}
            </div>
          )}
        </>
      )}
    </main>
  );
}
