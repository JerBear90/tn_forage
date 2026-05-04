"use client";

/**
 * ForageFlow — Spore Print Guide
 *
 * Step-by-step spore print instructions, color reference with visual swatches,
 * species-linked expectations from IndexedDB, and safety warning.
 *
 * SAFETY: A spore print is one identification tool among many.
 * It is NOT sufficient on its own to determine if a mushroom is edible.
 */

import { useState, useEffect } from "react";
import Link from "next/link";
import { getAllRecords } from "@/offline/db";
import { seedDatabase } from "@/data/seedDatabase";
import SpeciesImage, { pickImageUrl } from "@/components/SpeciesImage";
import DismissibleDisclaimer from "@/components/DismissibleDisclaimer";
import type { Species } from "@/types";

// ---------------------------------------------------------------------------
// Spore print instruction steps
// ---------------------------------------------------------------------------

const SPORE_PRINT_STEPS = [
  {
    step: 1,
    title: "Find a mature mushroom",
    description:
      "Select a mushroom with a fully open cap. Immature caps with closed veils may not release spores.",
  },
  {
    step: 2,
    title: "Remove the stem",
    description:
      "Carefully cut or twist the stem off at the base of the cap so the cap can sit flat.",
  },
  {
    step: 3,
    title: "Place cap gill-side down on paper",
    description:
      "Use a sheet that is half white and half dark paper (or place two sheets side by side). This ensures you can see both light and dark spore prints.",
  },
  {
    step: 4,
    title: "Cover with a bowl or glass",
    description:
      "Place a bowl, glass, or container over the cap to prevent air currents from disturbing the spores.",
  },
  {
    step: 5,
    title: "Wait 2–12 hours",
    description:
      "Leave the setup undisturbed. Most spore prints are visible within a few hours, but some species need longer.",
  },
  {
    step: 6,
    title: "Carefully lift the cap",
    description:
      "Remove the cover first, then gently lift the mushroom cap straight up to avoid smearing the print.",
  },
  {
    step: 7,
    title: "Observe the spore color",
    description:
      "Examine the spore deposit on both the white and dark paper. Note the color — this is the spore print color used in identification.",
  },
];

// ---------------------------------------------------------------------------
// Color reference swatches
// ---------------------------------------------------------------------------

interface SporePrintColor {
  name: string;
  /** Tailwind-compatible bg class or hex for the swatch */
  hex: string;
  textDark: boolean;
}

const SPORE_PRINT_COLORS: SporePrintColor[] = [
  { name: "White", hex: "#FFFFFF", textDark: true },
  { name: "Cream", hex: "#FFFDD0", textDark: true },
  { name: "Yellow", hex: "#F5D547", textDark: true },
  { name: "Pink", hex: "#F4A7BB", textDark: true },
  { name: "Brown", hex: "#8B5E3C", textDark: false },
  { name: "Purple-brown", hex: "#5D3A5E", textDark: false },
  { name: "Black", hex: "#1A1A1A", textDark: false },
  { name: "Rusty-brown", hex: "#B7592A", textDark: false },
];

// ---------------------------------------------------------------------------
// Hook: load mushroom species with spore print data
// ---------------------------------------------------------------------------

function useMushroomSpecies() {
  const [species, setSpecies] = useState<Species[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        await seedDatabase();
        const records = await getAllRecords("species");
        if (cancelled) return;

        // Filter to mushrooms with spore print data
        const mushrooms = (records as Species[]).filter(
          (s) => s.category === "mushroom" && s.sporePrint
        );

        // Sort alphabetically
        mushrooms.sort((a, b) => a.commonName.localeCompare(b.commonName));
        setSpecies(mushrooms);
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : "Failed to load species data"
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  return { species, loading, error };
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function StepCard({
  step,
  title,
  description,
}: {
  step: number;
  title: string;
  description: string;
}) {
  return (
    <li className="flex gap-3">
      <div
        className="shrink-0 flex items-center justify-center w-8 h-8 rounded-full bg-brand-teal text-white text-sm font-bold"
        aria-hidden="true"
      >
        {step}
      </div>
      <div className="pt-0.5">
        <h3 className="text-sm font-semibold text-brand-charcoal dark:text-brand-sand">
          {title}
        </h3>
        <p className="text-sm text-brand-charcoal/70 dark:text-brand-sand/70 leading-relaxed mt-0.5">
          {description}
        </p>
      </div>
    </li>
  );
}

function ColorSwatch({ color }: { color: SporePrintColor }) {
  return (
    <div className="flex items-center gap-3">
      <div
        className="shrink-0 w-10 h-10 rounded-lg border border-brand-charcoal/20 dark:border-brand-sand/20 shadow-sm"
        style={{ backgroundColor: color.hex }}
        role="img"
        aria-label={`${color.name} color swatch`}
      />
      <span
        className="text-sm font-medium text-brand-charcoal dark:text-brand-sand"
      >
        {color.name}
      </span>
    </div>
  );
}

function SpeciesExpectationCard({ species }: { species: Species }) {
  return (
    <Link
      href={`/field-guide/${species.id}`}
      className="flex flex-col rounded-xl border border-brand-charcoal/10 dark:border-brand-sand/10 bg-white/80 dark:bg-dark-surface/80 overflow-hidden hover:shadow-md hover:border-brand-teal/30 transition-all focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-teal"
    >
      {/* Species image */}
      <SpeciesImage
        src={pickImageUrl(species.images)}
        alt={species.commonName}
        variant="card"
        className="w-full aspect-[4/3]"
      />

      {/* Card body */}
      <div className="p-3">
        <p className="text-sm font-semibold text-brand-charcoal dark:text-brand-sand truncate">
          {species.commonName}
        </p>
        <p className="text-xs italic text-brand-charcoal/60 dark:text-brand-sand/60 truncate mt-0.5">
          {species.scientificName}
        </p>
        <div className="mt-2">
          <span className="inline-block rounded-full border border-brand-earth/30 bg-brand-earth/10 px-2.5 py-0.5 text-xs font-medium text-brand-earth dark:text-brand-earth-300">
            Spore print: {species.sporePrint}
          </span>
        </div>
      </div>
    </Link>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-3 animate-pulse" role="status">
      {Array.from({ length: 4 }).map((_, i) => (
        <div
          key={i}
          className="h-14 rounded-lg bg-brand-charcoal/10 dark:bg-brand-sand/10"
        />
      ))}
      <span className="sr-only">Loading species data…</span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Page Component
// ---------------------------------------------------------------------------

export default function SporePrintGuidePage() {
  const { species, loading, error } = useMushroomSpecies();

  return (
    <main className="flex min-h-screen flex-col px-4 py-6 pb-24 max-w-2xl mx-auto">
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
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15.75 19.5L8.25 12l7.5-7.5"
            />
          </svg>
          Field Guide
        </Link>
      </nav>

      {/* Page header */}
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-brand-forest dark:text-brand-moss font-heading">
          Spore Print Guide
        </h1>
        <p className="text-sm text-brand-charcoal/70 dark:text-brand-sand/70 mt-1">
          Learn how to take a spore print and use it as one tool in mushroom
          identification.
        </p>
      </header>

      {/* Safety warning — dismissible */}
      <DismissibleDisclaimer storageKey="forageflow-sporeprint-disclaimer-ack">
        <p className="font-semibold">Important Safety Notice</p>
        <p className="leading-relaxed mt-1">
          A spore print is one identification tool among many. It is NOT
          sufficient on its own to determine if a mushroom is edible. Always
          use multiple identification methods and verify with a qualified
          expert before consuming any wild mushroom.
        </p>
      </DismissibleDisclaimer>

      {/* Step-by-step instructions */}
      <section aria-labelledby="steps-heading" className="mb-8">
        <h2
          id="steps-heading"
          className="text-lg font-heading font-semibold text-brand-charcoal dark:text-brand-sand mb-4"
        >
          How to Take a Spore Print
        </h2>
        <ol className="space-y-4" aria-label="Spore print steps">
          {SPORE_PRINT_STEPS.map((s) => (
            <StepCard
              key={s.step}
              step={s.step}
              title={s.title}
              description={s.description}
            />
          ))}
        </ol>
      </section>

      {/* Color reference guide */}
      <section aria-labelledby="colors-heading" className="mb-8">
        <h2
          id="colors-heading"
          className="text-lg font-heading font-semibold text-brand-charcoal dark:text-brand-sand mb-4"
        >
          Spore Print Color Reference
        </h2>
        <p className="text-sm text-brand-charcoal/70 dark:text-brand-sand/70 mb-4">
          Common spore print colors. Actual colors may vary depending on
          species, maturity, and conditions.
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {SPORE_PRINT_COLORS.map((color) => (
            <ColorSwatch key={color.name} color={color} />
          ))}
        </div>
      </section>

      {/* Species-linked expectations */}
      <section aria-labelledby="species-heading" className="mb-8">
        <h2
          id="species-heading"
          className="text-lg font-heading font-semibold text-brand-charcoal dark:text-brand-sand mb-4"
        >
          Expected Spore Print by Species
        </h2>
        <p className="text-sm text-brand-charcoal/70 dark:text-brand-sand/70 mb-4">
          Tap a species to view its full detail page.
        </p>

        {error && (
          <div
            className="rounded-lg border border-red-300 bg-red-50 dark:bg-red-900/20 dark:border-red-700 p-4 mb-4 text-sm text-red-700 dark:text-red-400"
            role="alert"
          >
            {error}
          </div>
        )}

        {loading ? (
          <LoadingSkeleton />
        ) : species.length === 0 ? (
          <p className="text-sm text-brand-charcoal/50 dark:text-brand-sand/50">
            No mushroom species with spore print data found.
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {species.map((s) => (
              <SpeciesExpectationCard key={s.id} species={s} />
            ))}
          </div>
        )}
      </section>

      {/* Repeated safety reminder at bottom (dismissible) */}
      <DismissibleDisclaimer storageKey="forageflow-sporeprint-disclaimer-ack">
        <p className="text-xs font-medium leading-relaxed">
          Remember: A spore print is one identification tool among many. It is
          NOT sufficient on its own to determine if a mushroom is edible. Verify
          with a qualified expert before consuming any wild species.
        </p>
      </DismissibleDisclaimer>
    </main>
  );
}
