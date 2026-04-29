"use client";

/**
 * ForageFlow — Species Comparison Page
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
        className="max-h-60 overflow-y-auto rounded-lg border border-brand-charcoal/10 dark:border-brand-sand/10 bg-white/60 dark:bg-brand-charcoal/40"
        role="listbox"
        aria-label="Species list for comparison"
        aria-multiselectable="true"
      >
        {filtered.length === 0 ? (
          <p className="p-4 text-sm text-brand-charcoal/50 dark:text-brand-sand/50 text-center">
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
                className={`w-full flex items-center gap-3 px-4 py-3 text-left border-b border-brand-charcoal/5 dark:border-brand-sand/5 last:border-b-0 transition-colors focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-brand-teal ${
                  selected
                    ? "bg-brand-teal/10 dark:bg-brand-teal/20"
                    : disabled
                      ? "opacity-50 cursor-not-allowed"
                      : "hover:bg-brand-sand/40 dark:hover:bg-brand-charcoal/60"
                }`}
              >
                {/* Checkbox indicator */}
                <span
                  className={`shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                    selected
                      ? "bg-brand-teal border-brand-teal text-white"
                      : "border-brand-charcoal/30 dark:border-brand-sand/30"
                  }`}
                  aria-hidden="true"
                >
                  {selected && (
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </span>

                {/* Species info */}
                <div className="min-w-0 flex-1">
                  <span className="block text-sm font-medium text-brand-charcoal dark:text-brand-sand truncate">
                    {item.commonName}
                  </span>
                  <span className="block text-xs text-brand-charcoal/60 dark:text-brand-sand/60 italic truncate">
                    {item.scientificName}
                  </span>
                </div>

                {/* Edibility badge */}
                <span
                  className={`shrink-0 inline-block rounded-full border px-2 py-0.5 text-[10px] font-medium ${edibilityBadgeClasses(item.edibilityLabel)}`}
                >
                  {edibilityDisplayLabel(item.edibilityLabel)}
                </span>
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
// Comparison Table
// ---------------------------------------------------------------------------

function ComparisonTable({ data }: { data: ComparisonData[] }) {
  // Sort: toxic species first for safety
  const sorted = useMemo(() => {
    return [...data].sort((a, b) => {
      if (a.isToxic && !b.isToxic) return -1;
      if (!a.isToxic && b.isToxic) return 1;
      return 0;
    });
  }, [data]);

  const rows: { label: string; key: string; render: (d: ComparisonData) => React.ReactNode }[] = [
    {
      label: "Image",
      key: "image",
      render: () => (
        <div className="w-full h-24 rounded-lg bg-brand-sand/60 dark:bg-brand-charcoal/80 flex items-center justify-center">
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
        </div>
      ),
    },
    {
      label: "Common Name",
      key: "commonName",
      render: (d) => (
        <Link
          href={`/field-guide/${d.id}`}
          className="font-semibold text-sm text-brand-forest dark:text-brand-moss hover:underline"
        >
          {d.commonName}
        </Link>
      ),
    },
    {
      label: "Scientific Name",
      key: "scientificName",
      render: (d) => (
        <span className="text-xs italic text-brand-charcoal/70 dark:text-brand-sand/70">
          {d.scientificName}
        </span>
      ),
    },
    {
      label: "Category",
      key: "category",
      render: (d) => (
        <span className="text-xs text-brand-charcoal/80 dark:text-brand-sand/80">
          {categoryDisplayLabel(d.category)}
        </span>
      ),
    },
    {
      label: "Habitat",
      key: "habitat",
      render: (d) => (
        <p className="text-xs text-brand-charcoal/80 dark:text-brand-sand/80 leading-relaxed">
          {d.habitat}
        </p>
      ),
    },
    {
      label: "Tree Associations",
      key: "treeAssociations",
      render: (d) =>
        d.treeAssociations.length > 0 ? (
          <div className="flex flex-wrap gap-1">
            {d.treeAssociations.map((t) => (
              <span
                key={t}
                className="inline-block rounded-full border border-brand-teal/20 bg-brand-teal/5 px-2 py-0.5 text-[10px] text-brand-teal dark:text-brand-teal-300"
              >
                {t}
              </span>
            ))}
          </div>
        ) : (
          <span className="text-xs text-brand-charcoal/40 dark:text-brand-sand/40">—</span>
        ),
    },
    {
      label: "Season",
      key: "season",
      render: (d) =>
        d.season.length > 0 ? (
          <div className="flex flex-wrap gap-1">
            {d.season.map((s) => (
              <span
                key={s}
                className="inline-block rounded-full border border-brand-forest/20 bg-brand-forest/5 px-2 py-0.5 text-[10px] text-brand-forest dark:text-brand-forest-300"
              >
                {s}
              </span>
            ))}
          </div>
        ) : (
          <span className="text-xs text-brand-charcoal/40 dark:text-brand-sand/40">—</span>
        ),
    },
    {
      label: "Edibility",
      key: "edibility",
      render: (d) => (
        <span
          className={`inline-block rounded-full border px-2 py-0.5 text-[10px] font-medium ${edibilityBadgeClasses(d.edibilityLabel)}`}
        >
          {edibilityDisplayLabel(d.edibilityLabel)}
        </span>
      ),
    },
    {
      label: "Safety Notes",
      key: "safetyNotes",
      render: (d) =>
        d.safetyNotes ? (
          <div
            className={`rounded-md p-2 text-xs leading-relaxed ${
              d.isToxic
                ? "bg-red-50 text-red-800 dark:bg-red-900/20 dark:text-red-300 border border-red-200 dark:border-red-800"
                : "bg-amber-50 text-amber-800 dark:bg-amber-900/20 dark:text-amber-300 border border-amber-200 dark:border-amber-800"
            }`}
          >
            {d.safetyNotes}
          </div>
        ) : (
          <span className="text-xs text-brand-charcoal/40 dark:text-brand-sand/40">—</span>
        ),
    },
    {
      label: "Key ID Steps",
      key: "identificationSteps",
      render: (d) =>
        d.identificationSteps.length > 0 ? (
          <ul className="list-disc list-inside space-y-0.5">
            {d.identificationSteps.slice(0, 4).map((step, i) => (
              <li key={i} className="text-[11px] text-brand-charcoal/80 dark:text-brand-sand/80 leading-relaxed">
                {step}
              </li>
            ))}
            {d.identificationSteps.length > 4 && (
              <li className="text-[11px] text-brand-teal dark:text-brand-teal-300">
                <Link href={`/field-guide/${d.id}`} className="hover:underline">
                  +{d.identificationSteps.length - 4} more…
                </Link>
              </li>
            )}
          </ul>
        ) : (
          <span className="text-xs text-brand-charcoal/40 dark:text-brand-sand/40">—</span>
        ),
    },
  ];

  return (
    <div className="overflow-x-auto -mx-4 px-4" role="region" aria-label="Species comparison table" tabIndex={0}>
      <table className="w-full min-w-[600px] border-collapse" aria-label="Side-by-side species comparison">
        <thead>
          <tr>
            <th
              scope="col"
              className="sticky left-0 z-10 bg-brand-sand/90 dark:bg-brand-charcoal/90 backdrop-blur-sm text-left text-xs font-semibold text-brand-charcoal/60 dark:text-brand-sand/60 p-3 w-28 min-w-[7rem] border-b border-brand-charcoal/10 dark:border-brand-sand/10"
            >
              Attribute
            </th>
            {sorted.map((d) => (
              <th
                key={d.id}
                scope="col"
                className={`text-left text-sm font-semibold p-3 border-b min-w-[10rem] ${
                  d.isToxic
                    ? "text-red-700 dark:text-red-400 border-red-200 dark:border-red-800 bg-red-50/50 dark:bg-red-900/10"
                    : "text-brand-charcoal dark:text-brand-sand border-brand-charcoal/10 dark:border-brand-sand/10"
                }`}
              >
                <div className="flex items-center gap-1.5">
                  {d.isToxic && <span aria-hidden="true">⚠</span>}
                  {d.commonName}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.key} className="border-b border-brand-charcoal/5 dark:border-brand-sand/5">
              <th
                scope="row"
                className="sticky left-0 z-10 bg-brand-sand/90 dark:bg-brand-charcoal/90 backdrop-blur-sm text-left text-xs font-medium text-brand-charcoal/70 dark:text-brand-sand/70 p-3 align-top"
              >
                {row.label}
              </th>
              {sorted.map((d) => (
                <td
                  key={d.id}
                  className={`p-3 align-top ${
                    d.isToxic ? "bg-red-50/30 dark:bg-red-900/5" : ""
                  }`}
                >
                  {row.render(d)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
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

  return (
    <main className="flex min-h-screen flex-col px-4 py-6 pb-24 max-w-5xl mx-auto">
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
          Select {MIN_COMPARE}–{MAX_COMPARE} species for a side-by-side comparison.
        </p>
      </header>

      {/* Selected chips */}
      <SelectedChips selectedIds={selectedIds} items={items} remove={remove} clearAll={clearAll} />

      {/* Species picker */}
      {speciesLoading ? (
        <div className="animate-pulse space-y-2 mb-6" role="status">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-12 bg-brand-charcoal/10 dark:bg-brand-sand/10 rounded-lg" />
          ))}
          <span className="sr-only">Loading species…</span>
        </div>
      ) : (
        <SpeciesPicker items={items} isSelected={isSelected} toggle={toggle} isFull={isFull} />
      )}

      {/* Status message when not enough selected */}
      {!canCompare && count > 0 && (
        <p className="text-sm text-brand-charcoal/60 dark:text-brand-sand/60 text-center py-4">
          Select at least {MIN_COMPARE - count} more {MIN_COMPARE - count === 1 ? "species" : "species"} to compare.
        </p>
      )}

      {/* Comparison table */}
      {canCompare && (
        <>
          {loadingDetails ? (
            <div className="animate-pulse py-8" role="status">
              <div className="h-64 bg-brand-charcoal/10 dark:bg-brand-sand/10 rounded-lg" />
              <span className="sr-only">Loading comparison data…</span>
            </div>
          ) : comparisonData.length >= MIN_COMPARE ? (
            <>
              {/* Safety disclaimer */}
              <div
                className="rounded-lg border-2 border-amber-400 bg-amber-50 dark:bg-amber-900/20 dark:border-amber-600 p-3 mb-4"
                role="alert"
              >
                <p className="text-xs font-medium text-amber-900 dark:text-amber-200">
                  ⚠ Verify with a qualified expert before consuming any wild species. This comparison is for identification assistance only.
                </p>
              </div>
              <ComparisonTable data={comparisonData} />
            </>
          ) : null}
        </>
      )}

      {/* Empty state */}
      {count === 0 && !speciesLoading && (
        <div className="text-center py-12">
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
              d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15"
            />
          </svg>
          <p className="text-sm text-brand-charcoal/60 dark:text-brand-sand/60">
            Search and select species above to start comparing.
          </p>
        </div>
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
