"use client";

/**
 * ForageWise — Species Comparison Page
 *
 * Allows users to select 2-4 species and view them side-by-side.
 * Reads all data from IndexedDB (works offline).
 *
 * Flow:
 * 1. User arrives at /field-guide/compare (optionally with ?ids=...)
 * 2. Species picker lets them search/filter and select 2-4 species
 * 3. Once ≥2 are selected, a side-by-side comparison grid appears
 *
 * SAFETY RULES:
 * - Toxic species are visually highlighted
 * - Toxic lookalikes appear prominently
 * - No forbidden safety language
 *
 * ACCESSIBILITY:
 * - Proper table semantics with row/column headers
 * - Aria labels on interactive elements
 * - Keyboard navigable
 */

import { useState, useMemo, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSpecies, type FieldGuideItem } from "@/hooks/useSpecies";
import { useCompare, MIN_COMPARE, MAX_COMPARE } from "@/hooks/useCompare";
import { findRecordById, type SpeciesDetailRecord } from "@/hooks/useSpeciesDetail";
import SpeciesImage, { pickImageUrl } from "@/components/SpeciesImage";
import DismissibleDisclaimer from "@/components/DismissibleDisclaimer";
import type { Species, Plant, EdibilityLabel, SpeciesCategory } from "@/types";

// ---------------------------------------------------------------------------
// Edibility helpers (reused from field guide patterns)
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

function categoryDisplayLabel(category: SpeciesCategory): string {
  return category.charAt(0).toUpperCase() + category.slice(1);
}

// ---------------------------------------------------------------------------
// Detail data type for comparison (species/plant have full fields, tree is simpler)
// ---------------------------------------------------------------------------

interface ComparisonData {
  id: string;
  commonName: string;
  scientificName: string;
  category: SpeciesCategory;
  images: string[];
  habitat: string;
  treeAssociations: string[];
  season: string[];
  edibilityLabel: EdibilityLabel;
  safetyNotes: string;
  identificationSteps: string[];
  isToxic: boolean;
}

function recordToComparisonData(record: SpeciesDetailRecord): ComparisonData {
  if (record.kind === "tree") {
    return {
      id: record.data.id,
      commonName: record.data.commonName,
      scientificName: record.data.scientificName,
      category: "tree",
      images: record.data.images,
      habitat: record.data.habitat,
      treeAssociations: record.data.associatedSpecies,
      season: [],
      edibilityLabel: "unknown",
      safetyNotes: "",
      identificationSteps: [],
      isToxic: false,
    };
  }
  const d = record.data as Species | Plant;
  return {
    id: d.id,
    commonName: d.commonName,
    scientificName: d.scientificName,
    category: d.category,
    images: d.images,
    habitat: d.habitat,
    treeAssociations: d.treeAssociations,
    season: d.season,
    edibilityLabel: d.edibilityLabel,
    safetyNotes: d.safetyNotes,
    identificationSteps: d.identificationSteps,
    isToxic: d.edibilityLabel === "toxic",
  };
}

// ---------------------------------------------------------------------------
// Species Picker
// ---------------------------------------------------------------------------

function SpeciesPicker({
  items,
  isSelected,
  toggle,
  isFull,
}: {
  items: FieldGuideItem[];
  isSelected: (id: string) => boolean;
  toggle: (id: string) => void;
  isFull: boolean;
}) {
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return items;
    return items.filter(
      (item) =>
        item.commonName.toLowerCase().includes(q) ||
        item.scientificName.toLowerCase().includes(q)
    );
  }, [items, search]);

  return (
    <div className="mb-6">
      <label htmlFor="compare-search" className="sr-only">
        Search species to compare
      </label>
      <input
        id="compare-search"
        type="search"
        placeholder="Search species to add…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full rounded-lg border border-brand-teal/20 bg-white/80 dark:bg-brand-charcoal/60 px-4 py-3 text-sm text-brand-charcoal dark:text-brand-sand placeholder:text-brand-charcoal/40 dark:placeholder:text-brand-sand/40 focus:outline-none focus:ring-2 focus:ring-brand-teal/40 mb-3"
      />

      <div
        className="grid grid-cols-2 gap-3 max-h-[70vh] overflow-y-auto pb-24"
        role="listbox"
        aria-label="Species list for comparison"
        aria-multiselectable="true"
      >
        {filtered.length === 0 ? (
          <p className="col-span-2 p-4 text-sm text-brand-charcoal/50 dark:text-brand-sand/50 text-center">
            No species match your search.
          </p>
        ) : (
          filtered.map((item) => {
            const selected = isSelected(item.id);
            const disabled = !selected && isFull;
            return (
              <button
                key={item.id}
                type="button"
                role="option"
                aria-selected={selected}
                disabled={disabled}
                onClick={() => toggle(item.id)}
                className={`relative flex flex-col rounded-xl border overflow-hidden text-left transition-all focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-teal ${
                  selected
                    ? "border-brand-teal ring-2 ring-brand-teal/30 shadow-md"
                    : disabled
                      ? "opacity-50 cursor-not-allowed border-brand-charcoal/10 dark:border-brand-sand/10"
                      : "border-brand-charcoal/10 dark:border-brand-sand/10 hover:shadow-md hover:border-brand-teal/30 active:scale-[0.98]"
                } bg-white/80 dark:bg-dark-surface/80`}
              >
                {/* Selection check overlay */}
                {selected && (
                  <div className="absolute top-2 right-2 z-10 w-6 h-6 rounded-full bg-brand-teal text-white flex items-center justify-center shadow-sm">
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                )}

                {/* Image */}
                <SpeciesImage
                  src={pickImageUrl(item.images)}
                  alt={item.commonName}
                  variant="card"
                  className="w-full aspect-[4/3]"
                />

                {/* Card body */}
                <div className="p-2.5">
                  <p className="font-semibold text-xs text-brand-charcoal dark:text-dark-text leading-tight truncate">
                    {item.commonName}
                  </p>
                  <p className="text-xs text-brand-charcoal/60 dark:text-dark-text-muted italic truncate mt-0.5">
                    {item.scientificName}
                  </p>
                  <div className="mt-1.5">
                    <span
                      className={`inline-block rounded-full border px-2 py-0.5 text-xs font-medium ${edibilityBadgeClasses(item.edibilityLabel)}`}
                    >
                      {edibilityDisplayLabel(item.edibilityLabel)}
                    </span>
                  </div>
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Selected Species Chips
// ---------------------------------------------------------------------------

function SelectedChips({
  selectedIds,
  items,
  remove,
  clearAll,
}: {
  selectedIds: string[];
  items: FieldGuideItem[];
  remove: (id: string) => void;
  clearAll: () => void;
}) {
  if (selectedIds.length === 0) return null;

  const itemMap = new Map(items.map((i) => [i.id, i]));

  return (
    <div className="mb-4">
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs font-medium text-brand-charcoal/70 dark:text-brand-sand/70">
          Selected ({selectedIds.length}/{MAX_COMPARE})
        </p>
        <button
          type="button"
          onClick={clearAll}
          className="text-xs text-brand-teal hover:text-brand-teal-600 dark:hover:text-brand-teal-300 underline underline-offset-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-teal"
        >
          Clear all
        </button>
      </div>
      <div className="flex flex-wrap gap-2" role="list" aria-label="Selected species for comparison">
        {selectedIds.map((id) => {
          const item = itemMap.get(id);
          const name = item?.commonName ?? id;
          const isToxic = item?.edibilityLabel === "toxic";
          return (
            <span
              key={id}
              role="listitem"
              className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium ${
                isToxic
                  ? "bg-red-100 text-red-700 border-red-300 dark:bg-red-900/30 dark:text-red-400 dark:border-red-700"
                  : "bg-brand-teal/10 text-brand-teal border-brand-teal/30 dark:text-brand-teal-300"
              }`}
            >
              {isToxic && <span aria-hidden="true">⚠</span>}
              {name}
              <button
                type="button"
                onClick={() => remove(id)}
                aria-label={`Remove ${name} from comparison`}
                className="ml-0.5 hover:text-red-600 dark:hover:text-red-400 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-brand-teal"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </span>
          );
        })}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Comparison Card
// ---------------------------------------------------------------------------

function ComparisonCard({ d, remove }: { d: ComparisonData; remove: (id: string) => void }) {
  return (
    <article
      className={`rounded-xl border overflow-hidden ${
        d.isToxic
          ? "border-red-300 dark:border-red-700 bg-red-50/30 dark:bg-red-950/20"
          : "border-brand-charcoal/10 dark:border-dark-border bg-white/80 dark:bg-dark-surface/80"
      }`}
    >
      {/* Image */}
      <SpeciesImage
        src={pickImageUrl(d.images)}
        alt={d.commonName}
        variant="card"
        className="w-full aspect-[4/3]"
      />

      {/* Card body */}
      <div className="p-4 space-y-3">
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <Link
              href={`/field-guide/${d.id}`}
              className="font-heading font-semibold text-base text-brand-forest dark:text-brand-moss hover:underline leading-tight block"
            >
              {d.isToxic && <span aria-hidden="true" className="mr-1">⚠</span>}
              {d.commonName}
            </Link>
            <p className="text-xs italic text-brand-charcoal/60 dark:text-brand-sand/60 mt-0.5">
              {d.scientificName}
            </p>
          </div>
          <button
            type="button"
            onClick={() => remove(d.id)}
            aria-label={`Remove ${d.commonName}`}
            className="shrink-0 p-1.5 rounded-lg text-brand-charcoal/40 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-teal"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Badges */}
        <div className="flex flex-wrap gap-1.5">
          <span className="inline-block rounded-full border border-brand-charcoal/15 bg-brand-charcoal/5 px-2 py-0.5 text-xs font-medium text-brand-charcoal/70 dark:text-brand-sand/70 dark:border-brand-sand/15 dark:bg-brand-sand/5">
            {categoryDisplayLabel(d.category)}
          </span>
          <span
            className={`inline-block rounded-full border px-2 py-0.5 text-xs font-medium ${edibilityBadgeClasses(d.edibilityLabel)}`}
          >
            {edibilityDisplayLabel(d.edibilityLabel)}
          </span>
        </div>

        {/* Safety Notes — always shown first for toxic species */}
        {d.safetyNotes && (
          <div
            className={`rounded-lg p-2.5 text-xs leading-relaxed ${
              d.isToxic
                ? "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300 border border-red-200 dark:border-red-800"
                : "bg-amber-50 text-amber-800 dark:bg-amber-900/20 dark:text-amber-300 border border-amber-200 dark:border-amber-800"
            }`}
          >
            {d.safetyNotes}
          </div>
        )}

        {/* Habitat */}
        <div>
          <h3 className="text-xs font-semibold text-brand-charcoal/50 dark:text-brand-sand/50 uppercase tracking-wide mb-1">
            Habitat
          </h3>
          <p className="text-sm text-brand-charcoal/80 dark:text-brand-sand/80 leading-relaxed">
            {d.habitat}
          </p>
        </div>

        {/* Season */}
        {d.season.length > 0 && (
          <div>
            <h3 className="text-xs font-semibold text-brand-charcoal/50 dark:text-brand-sand/50 uppercase tracking-wide mb-1">
              Season
            </h3>
            <div className="flex flex-wrap gap-1">
              {d.season.map((s) => (
                <span
                  key={s}
                  className="inline-block rounded-full border border-brand-forest/20 bg-brand-forest/5 px-2 py-0.5 text-xs text-brand-forest dark:text-brand-forest-300"
                >
                  {s}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Tree Associations */}
        {d.treeAssociations.length > 0 && (
          <div>
            <h3 className="text-xs font-semibold text-brand-charcoal/50 dark:text-brand-sand/50 uppercase tracking-wide mb-1">
              Tree Associations
            </h3>
            <div className="flex flex-wrap gap-1">
              {d.treeAssociations.map((t) => (
                <span
                  key={t}
                  className="inline-block rounded-full border border-brand-teal/20 bg-brand-teal/5 px-2 py-0.5 text-xs text-brand-teal dark:text-brand-teal-300"
                >
                  {t}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Key ID Steps */}
        {d.identificationSteps.length > 0 && (
          <div>
            <h3 className="text-xs font-semibold text-brand-charcoal/50 dark:text-brand-sand/50 uppercase tracking-wide mb-1">
              Key ID Steps
            </h3>
            <ul className="list-disc list-inside space-y-0.5">
              {d.identificationSteps.slice(0, 4).map((step, i) => (
                <li key={i} className="text-sm text-brand-charcoal/80 dark:text-brand-sand/80 leading-relaxed">
                  {step}
                </li>
              ))}
              {d.identificationSteps.length > 4 && (
                <li className="text-sm text-brand-teal dark:text-brand-teal-300 list-none mt-1">
                  <Link href={`/field-guide/${d.id}`} className="hover:underline">
                    +{d.identificationSteps.length - 4} more →
                  </Link>
                </li>
              )}
            </ul>
          </div>
        )}

        {/* View full details link */}
        <Link
          href={`/field-guide/${d.id}`}
          className="inline-flex items-center gap-1 text-xs font-medium text-brand-teal hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-teal pt-1"
        >
          View full details
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
          </svg>
        </Link>
      </div>
    </article>
  );
}

// ---------------------------------------------------------------------------
// Comparison Modal
// ---------------------------------------------------------------------------

function ComparisonModal({
  data,
  remove,
  onClose,
}: {
  data: ComparisonData[];
  remove: (id: string) => void;
  onClose: () => void;
}) {
  // Sort: toxic species first for safety
  const sorted = useMemo(() => {
    return [...data].sort((a, b) => {
      if (a.isToxic && !b.isToxic) return -1;
      if (!a.isToxic && b.isToxic) return 1;
      return 0;
    });
  }, [data]);

  // Lock body scroll when modal is open
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col bg-brand-sand dark:bg-dark-bg"
      role="dialog"
      aria-modal="true"
      aria-label="Species comparison"
    >
      {/* Modal header */}
      <div className="sticky top-0 z-10 bg-brand-sand/95 dark:bg-dark-bg/95 backdrop-blur-sm border-b border-brand-charcoal/10 dark:border-brand-sand/10 px-4 py-3 flex items-center justify-between">
        <h2 className="text-lg font-heading font-bold text-brand-forest dark:text-brand-moss">
          Comparing {sorted.length} Species
        </h2>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close comparison"
          className="p-2 rounded-lg text-brand-charcoal/60 hover:text-brand-charcoal hover:bg-brand-charcoal/10 dark:text-brand-sand/60 dark:hover:text-brand-sand dark:hover:bg-brand-sand/10 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-teal"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto px-4 py-4 pb-24">
        {/* Safety disclaimer (dismissible) */}
        <DismissibleDisclaimer storageKey="foragewise-compare-disclaimer-ack">
          <p className="font-medium">
            ⚠ Verify with a qualified expert before consuming any wild species. This comparison is for identification assistance only.
          </p>
        </DismissibleDisclaimer>

        {/* Comparison cards */}
        <div className="grid grid-cols-1 gap-4" role="list" aria-label="Species comparison cards">
          {sorted.map((d) => (
            <div key={d.id} role="listitem">
              <ComparisonCard d={d} remove={remove} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Page Content (needs Suspense boundary for useSearchParams)
// ---------------------------------------------------------------------------

function ComparePageContent() {
  const { items, loading: speciesLoading } = useSpecies();
  const { selectedIds, isSelected, toggle, remove, clearAll, canCompare, isFull, count } = useCompare();
  const [comparisonData, setComparisonData] = useState<ComparisonData[]>([]);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);

  // Load full detail records when selection changes
  useEffect(() => {
    if (selectedIds.length < MIN_COMPARE) {
      setComparisonData([]);
      return;
    }

    let cancelled = false;
    setLoadingDetails(true);

    async function loadDetails() {
      const results = await Promise.all(
        selectedIds.map((id) => findRecordById(id))
      );

      if (cancelled) return;

      const data: ComparisonData[] = [];
      for (const r of results) {
        if (r) data.push(recordToComparisonData(r));
      }
      setComparisonData(data);
      setLoadingDetails(false);
    }

    loadDetails();

    return () => {
      cancelled = true;
    };
  }, [selectedIds]);

  // Close modal if selection drops below minimum
  useEffect(() => {
    if (!canCompare) setModalOpen(false);
  }, [canCompare]);

  return (
    <main className="flex min-h-screen flex-col px-4 py-6 pb-32 max-w-5xl mx-auto">
      {/* Back navigation */}
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
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
          Field Guide
        </Link>
      </nav>

      {/* Header */}
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-brand-forest dark:text-brand-moss font-heading">
          Compare Species
        </h1>
        <p className="text-sm text-brand-charcoal/70 dark:text-brand-sand/70 mt-1">
          Tap {MIN_COMPARE}–{MAX_COMPARE} species to compare them.
        </p>
      </header>

      {/* Selected chips */}
      <SelectedChips selectedIds={selectedIds} items={items} remove={remove} clearAll={clearAll} />

      {/* Species picker (always visible — this is the main view) */}
      {speciesLoading ? (
        <div className="animate-pulse grid grid-cols-2 gap-3 mb-6" role="status">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="aspect-[3/4] bg-brand-charcoal/10 dark:bg-brand-sand/10 rounded-xl" />
          ))}
          <span className="sr-only">Loading species…</span>
        </div>
      ) : (
        <SpeciesPicker items={items} isSelected={isSelected} toggle={toggle} isFull={isFull} />
      )}

      {/* Empty state */}
      {count === 0 && !speciesLoading && (
        <div className="text-center py-8">
          <p className="text-sm text-brand-charcoal/50 dark:text-brand-sand/50">
            Tap species cards above to select them for comparison.
          </p>
        </div>
      )}

      {/* Sticky "Compare" button — appears when ≥2 selected */}
      {canCompare && (
        <div className="fixed bottom-20 left-0 right-0 z-40 px-4 pb-2">
          <div className="max-w-5xl mx-auto">
            <button
              type="button"
              onClick={() => setModalOpen(true)}
              disabled={loadingDetails}
              className="w-full flex items-center justify-center gap-2 px-6 py-4 rounded-2xl text-base font-semibold bg-brand-teal text-white shadow-lg shadow-brand-teal/25 hover:bg-brand-teal/90 active:scale-[0.98] transition-all focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-teal disabled:opacity-60 min-h-[56px]"
            >
              {loadingDetails ? (
                <>
                  <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Loading…
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15" />
                  </svg>
                  Compare {count} Species
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Comparison modal */}
      {modalOpen && comparisonData.length >= MIN_COMPARE && (
        <ComparisonModal
          data={comparisonData}
          remove={remove}
          onClose={() => setModalOpen(false)}
        />
      )}
    </main>
  );
}

// ---------------------------------------------------------------------------
// Page wrapper with Suspense (required for useSearchParams)
// ---------------------------------------------------------------------------

export default function ComparePage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen flex-col px-4 py-6 pb-24 max-w-5xl mx-auto">
          <div className="animate-pulse space-y-4" role="status">
            <div className="h-8 bg-brand-charcoal/10 dark:bg-brand-sand/10 rounded w-48" />
            <div className="h-4 bg-brand-charcoal/10 dark:bg-brand-sand/10 rounded w-64" />
            <div className="h-12 bg-brand-charcoal/10 dark:bg-brand-sand/10 rounded-lg" />
            <span className="sr-only">Loading comparison page…</span>
          </div>
        </main>
      }
    >
      <ComparePageContent />
    </Suspense>
  );
}
