"use client";

/**
 * ForageFlow — Species Detail Page
 *
 * Dynamic route that displays the full detail for a species, plant, or tree.
 * Reads from IndexedDB via the useSpeciesDetail hook.
 *
 * SAFETY RULES:
 * - Toxic lookalikes ALWAYS appear BEFORE edibility/safety notes
 * - NEVER display "safe to eat", "confirmed edible", or "definitely edible"
 * - Safety notes are displayed prominently with warning styling
 */

import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useState } from "react";
import OnlineHint from "@/components/OnlineHint";
import {
  useSpeciesDetail,
  type SpeciesDetailRecord,
} from "@/hooks/useSpeciesDetail";
import ImageLightbox from "@/components/ImageLightbox";
import SpeciesImage from "@/components/SpeciesImage";
import SkeletonDetail from "@/components/skeletons/SkeletonDetail";
import AssociatedSpeciesLink from "@/components/AssociatedSpeciesLink";
import SeasonChart from "@/components/SeasonChart";
import ForagingTipSection from "@/components/ForagingTipSection";
import VoicePronunciationButton from "@/components/VoicePronunciationButton";
import BreadcrumbNavigator from "@/components/BreadcrumbNavigator";
import { writeReferrer } from "@/utils/breadcrumbReferrer";
import { useAssociatedSpeciesLookup } from "@/hooks/useAssociatedSpeciesLookup";
import type {
  Species,
  Plant,
  Tree,
  Lookalike,
  EdibilityLabel,
  SpeciesCategory,
} from "@/types";

// ---------------------------------------------------------------------------
// Edibility helpers
// ---------------------------------------------------------------------------

function edibilityColor(label: EdibilityLabel): string {
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

function edibilityDisplayText(label: EdibilityLabel): string {
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
// Sub-components
// ---------------------------------------------------------------------------

/** Section wrapper with consistent spacing and heading */
function Section({
  title,
  children,
  id,
}: {
  title: string;
  children: React.ReactNode;
  id?: string;
}) {
  return (
    <section className="mt-6" aria-labelledby={id}>
      <h2
        id={id}
        className="text-lg font-heading font-semibold text-brand-charcoal dark:text-dark-text mb-2"
      >
        {title}
      </h2>
      {children}
    </section>
  );
}

/** Image gallery with tap-to-enlarge lightbox */
function ImageGallery({ images }: { images: string[] }) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  if (images.length === 0) return null;

  /** Check if a src looks like a usable image (local path or remote URL) */
  const isUsableImage = (src: string) =>
    src.startsWith("/") || src.startsWith("http") || src.startsWith("data:") || src.startsWith("blob:");

  const realImages = images.filter(isUsableImage);
  if (realImages.length === 0) return null;

  const lightboxOpen = lightboxIndex !== null;
  const lightboxSrc =
    lightboxIndex !== null ? realImages[lightboxIndex] : null;

  return (
    <div className="mt-4">
      {/* First image — full width hero */}
      <SpeciesImage
        src={realImages[0]}
        alt="Species image 1"
        variant="detail"
        className="w-full aspect-[4/3] rounded-xl cursor-pointer hover:ring-2 hover:ring-brand-teal/40 transition-shadow"
        onClick={() => setLightboxIndex(0)}
      />

      {/* Additional images — horizontal scroll row */}
      {realImages.length > 1 && (
        <div className="flex gap-3 overflow-x-auto pb-2 mt-3" role="list" aria-label="Additional species images">
          {realImages.slice(1).map((src, i) => (
            <SpeciesImage
              key={i + 1}
              src={src}
              alt={`Species image ${i + 2}`}
              variant="detail"
              className="shrink-0 w-32 h-24 rounded-lg border border-brand-charcoal/10 dark:border-dark-border cursor-pointer hover:ring-2 hover:ring-brand-teal/40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-teal transition-shadow"
              onClick={() => setLightboxIndex(i + 1)}
            />
          ))}
        </div>
      )}

      <ImageLightbox
        isOpen={lightboxOpen}
        onClose={() => setLightboxIndex(null)}
        imageSrc={lightboxSrc}
        imageAlt={
          lightboxIndex !== null
            ? `Species image ${lightboxIndex + 1} of ${realImages.length}`
            : "Species image"
        }
      />
    </div>
  );
}

/** Lookalike card with image and link to detail page */
function LookalikeCard({
  lookalike,
  isToxicSection,
}: {
  lookalike: Lookalike;
  isToxicSection: boolean;
}) {
  return (
    <Link
      href={`/field-guide/${lookalike.speciesId}`}
      aria-label={`View details for ${lookalike.commonName}${isToxicSection ? ' (toxic)' : ''}`}
      className={`block rounded-lg border p-3 transition-shadow hover:ring-2 hover:ring-brand-teal/40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-teal ${
        isToxicSection
          ? "border-red-300 bg-red-50 dark:bg-red-900/20 dark:border-red-700"
          : "border-brand-charcoal/10 bg-white/60 dark:bg-dark-surface/60 dark:border-dark-border"
      }`}
    >
      <div className="flex gap-3">
        {/* Lookalike image */}
        <div className="shrink-0 w-16 h-16 rounded-md overflow-hidden bg-brand-charcoal/5 dark:bg-brand-charcoal/20">
          <SpeciesImage
            src={`/images/species/${lookalike.speciesId}.jpg`}
            alt={`${lookalike.commonName} photo`}
            variant="card"
            className="w-full h-full object-cover"
          />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            {isToxicSection && (
              <span
                className="inline-block rounded-full bg-red-600 text-white text-xs font-bold px-2 py-0.5"
                aria-label="Toxic"
              >
                ⚠ TOXIC
              </span>
            )}
            <span className="font-semibold text-sm text-brand-charcoal dark:text-dark-text">
              {lookalike.commonName}
            </span>
          </div>
          <p className="text-xs text-brand-charcoal/70 dark:text-dark-text-muted leading-relaxed line-clamp-2">
            {lookalike.differentiatingFeatures}
          </p>
        </div>
      </div>
    </Link>
  );
}

/** Tag list (for seasons, tree associations, etc.) */
function TagList({ items, label }: { items: string[]; label: string }) {
  if (items.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-1.5" role="list" aria-label={label}>
      {items.map((item) => (
        <span
          key={item}
          role="listitem"
          className="inline-block rounded-full border border-brand-teal/20 bg-brand-teal/5 px-2.5 py-0.5 text-xs text-brand-teal dark:text-brand-teal-300"
        >
          {item}
        </span>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Detail renderers by type
// ---------------------------------------------------------------------------

function SpeciesOrPlantDetail({
  record,
  onDetailNavigation,
}: {
  record: { kind: "species" | "plant"; data: Species | Plant };
  onDetailNavigation: () => void;
}) {
  const d = record.data;
  const isSpecies = record.kind === "species";
  const speciesData = isSpecies ? (d as Species) : null;

  // Resolve tree association names to IDs for linking
  const treeAssociationMap = useAssociatedSpeciesLookup(d.treeAssociations);

  return (
    <>
      {/* Header */}
      <header>
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold font-heading text-brand-forest dark:text-brand-moss leading-tight">
            {d.commonName}
          </h1>
          <VoicePronunciationButton
            commonName={d.commonName}
            scientificName={d.scientificName}
          />
        </div>
        <p className="text-sm italic text-brand-charcoal/60 dark:text-brand-sand/60 mt-0.5">
          {d.scientificName}
        </p>
        <div className="flex flex-wrap gap-2 mt-3">
          <span
            className={`inline-block rounded-full border px-2.5 py-0.5 text-xs font-medium ${categoryBadgeClasses(d.category)}`}
          >
            {categoryDisplayLabel(d.category)}
          </span>
          <span
            className={`inline-block rounded-full border px-2.5 py-0.5 text-xs font-medium ${edibilityColor(d.edibilityLabel)}`}
          >
            {edibilityDisplayText(d.edibilityLabel)}
          </span>
        </div>
      </header>

      {/* Season Chart */}
      <Section title="Season Chart" id="section-season-chart">
        <SeasonChart seasons={d.season} />
      </Section>

      {/* Foraging Tip */}
      <ForagingTipSection
        speciesId={d.id}
        seasons={d.season}
        commonName={d.commonName}
      />

      {/* Image gallery */}
      <ImageGallery images={d.images} />

      {/* Habitat */}
      <Section title="Habitat" id="section-habitat">
        <p className="text-sm text-brand-charcoal/80 dark:text-brand-sand/80 leading-relaxed">
          {d.habitat}
        </p>
      </Section>

      {/* Tree Associations — linked to field guide entries */}
      {d.treeAssociations.length > 0 && (
        <Section title="Tree Associations" id="section-trees">
          {/* eslint-disable-next-line jsx-a11y/no-static-element-interactions, jsx-a11y/click-events-have-key-events */}
          <div className="flex flex-wrap gap-1.5" role="list" aria-label="Associated trees" onClick={onDetailNavigation}>
            {d.treeAssociations.map((name) => (
              <AssociatedSpeciesLink
                key={name}
                speciesName={name}
                speciesId={treeAssociationMap[name] ?? null}
              />
            ))}
          </div>
        </Section>
      )}



      {/* Region */}
      <Section title="Region" id="section-region">
        <p className="text-sm text-brand-charcoal/80 dark:text-brand-sand/80">
          {d.region}
        </p>
      </Section>

      {/* Identification Steps */}
      {d.identificationSteps.length > 0 && (
        <Section title="Identification Steps" id="section-id-steps">
          <ol className="list-decimal list-inside space-y-1.5">
            {d.identificationSteps.map((step, i) => (
              <li
                key={i}
                className="text-sm text-brand-charcoal/80 dark:text-brand-sand/80 leading-relaxed"
              >
                {step}
              </li>
            ))}
          </ol>
        </Section>
      )}

      {/* ============================================================
          CRITICAL ORDERING: Toxic lookalikes BEFORE edibility/safety
          ============================================================ */}

      {/* Toxic Lookalikes — MUST appear before edibility/safety notes */}
      {d.toxicLookalikes.length > 0 && (
        <Section title="⚠ Toxic Lookalikes" id="section-toxic-lookalikes">
          <div
            className="rounded-lg border-2 border-red-400 bg-red-50/50 dark:bg-red-900/10 dark:border-red-600 p-3 mb-2"
            role="alert"
          >
            <p className="text-xs font-semibold text-red-700 dark:text-red-400 mb-2">
              Review these toxic lookalikes carefully before considering
              edibility.
            </p>
          </div>
          <div className="space-y-2">
            {d.toxicLookalikes.map((la) => (
              <LookalikeCard
                key={la.speciesId}
                lookalike={la}
                isToxicSection={true}
              />
            ))}
          </div>
        </Section>
      )}

      {/* Non-toxic Lookalikes */}
      {d.lookalikes.filter((la) => !la.isToxic).length > 0 && (
        <Section title="Other Lookalikes" id="section-lookalikes">
          <div className="space-y-2">
            {d.lookalikes
              .filter((la) => !la.isToxic)
              .map((la) => (
                <LookalikeCard
                  key={la.speciesId}
                  lookalike={la}
                  isToxicSection={false}
                />
              ))}
          </div>
        </Section>
      )}



      {/* Spore Print (mushrooms only) */}
      {speciesData?.sporePrint && (
        <Section title="Spore Print" id="section-spore-print">
          <p className="text-sm text-brand-charcoal/80 dark:text-brand-sand/80">
            {speciesData.sporePrint}
          </p>
          <Link
            href="/field-guide/spore-print"
            className="inline-flex items-center gap-1.5 mt-2 text-xs font-medium text-brand-teal hover:text-brand-teal-600 dark:text-brand-teal-300 dark:hover:text-brand-teal-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-teal transition-colors"
          >
            <svg
              aria-hidden="true"
              className="w-3.5 h-3.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25"
              />
            </svg>
            How to take a spore print
          </Link>
        </Section>
      )}

      {/* Bruising Notes (mushrooms only) */}
      {speciesData?.bruisingNotes && (
        <Section title="Bruising Notes" id="section-bruising">
          <p className="text-sm text-brand-charcoal/80 dark:text-brand-sand/80">
            {speciesData.bruisingNotes}
          </p>
        </Section>
      )}

      {/* Sources */}
      {d.sources.length > 0 && (
        <Section title="Sources" id="section-sources">
          <ul className="list-disc list-inside space-y-1">
            {d.sources.map((source, i) => (
              <li
                key={i}
                className="text-xs text-brand-charcoal/60 dark:text-brand-sand/60 leading-relaxed"
              >
                {source}
              </li>
            ))}
          </ul>
        </Section>
      )}

    </>
  );
}

function TreeDetail({ data, onDetailNavigation }: { data: Tree; onDetailNavigation: () => void }) {
  const associatedSpeciesMap = useAssociatedSpeciesLookup(data.associatedSpecies);

  return (
    <>
      {/* Header */}
      <header>
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold font-heading text-brand-forest dark:text-brand-moss leading-tight">
            {data.commonName}
          </h1>
          <VoicePronunciationButton
            commonName={data.commonName}
            scientificName={data.scientificName}
          />
        </div>
        <p className="text-sm italic text-brand-charcoal/60 dark:text-brand-sand/60 mt-0.5">
          {data.scientificName}
        </p>
        <div className="flex flex-wrap gap-2 mt-3">
          <span
            className={`inline-block rounded-full border px-2.5 py-0.5 text-xs font-medium ${categoryBadgeClasses("tree")}`}
          >
            Tree
          </span>
        </div>
      </header>

      {/* Image gallery */}
      <ImageGallery images={data.images} />

      {/* Habitat */}
      <Section title="Habitat" id="section-habitat">
        <p className="text-sm text-brand-charcoal/80 dark:text-brand-sand/80 leading-relaxed">
          {data.habitat}
        </p>
      </Section>

      {/* Bark Description */}
      <Section title="Bark" id="section-bark">
        <p className="text-sm text-brand-charcoal/80 dark:text-brand-sand/80 leading-relaxed">
          {data.barkDescription}
        </p>
      </Section>

      {/* Leaf Description */}
      <Section title="Leaves" id="section-leaves">
        <p className="text-sm text-brand-charcoal/80 dark:text-brand-sand/80 leading-relaxed">
          {data.leafDescription}
        </p>
      </Section>

      {/* Bark & Leaves Close-Up Gallery */}
      <Section title="Bark & Leaves" id="section-bark-leaves-gallery">
        {(data.barkCloseUpImages && data.barkCloseUpImages.length > 0) ||
        (data.leafCloseUpImages && data.leafCloseUpImages.length > 0) ? (
          <div className="flex flex-wrap gap-3" role="list" aria-label="Bark and leaf close-up images">
            {data.barkCloseUpImages?.map((src, i) => (
              <SpeciesImage
                key={`bark-${i}`}
                src={src}
                alt={`${data.commonName} bark close-up`}
                variant="detail"
                className="min-w-[120px] min-h-[120px] w-32 h-32 rounded-lg border border-brand-charcoal/10 dark:border-dark-border"
              />
            ))}
            {data.leafCloseUpImages?.map((src, i) => (
              <SpeciesImage
                key={`leaf-${i}`}
                src={src}
                alt={`${data.commonName} leaf close-up`}
                variant="detail"
                className="min-w-[120px] min-h-[120px] w-32 h-32 rounded-lg border border-brand-charcoal/10 dark:border-dark-border"
              />
            ))}
          </div>
        ) : (
          <p className="text-sm text-brand-charcoal/60 dark:text-brand-sand/60 italic">
            Close-up photos coming soon
          </p>
        )}
      </Section>

      {/* Looks Similar To — only rendered when similarTrees is defined and non-empty */}
      {data.similarTrees && data.similarTrees.length > 0 && (
        <Section title="Looks Similar To" id="section-similar-trees">
          <div className="space-y-3" role="list" aria-label="Similar tree species">
            {data.similarTrees.map((similar) => (
              <Link
                key={similar.treeId}
                href={`/field-guide/${similar.treeId}`}
                onClick={onDetailNavigation}
                aria-label={`View ${similar.commonName}`}
                className="flex items-center gap-3 p-2 rounded-lg border border-brand-charcoal/10 dark:border-dark-border bg-white/60 dark:bg-dark-surface/60 hover:ring-2 hover:ring-brand-teal/40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-teal transition-shadow min-h-[44px]"
                role="listitem"
              >
                <SpeciesImage
                  src={similar.thumbnailImage ?? null}
                  alt={`${similar.commonName} thumbnail`}
                  variant="card"
                  className="shrink-0 w-11 h-11 rounded-md border border-brand-charcoal/10 dark:border-dark-border"
                />
                <div className="flex-1 min-w-0">
                  <span className="block text-sm font-semibold text-brand-charcoal dark:text-dark-text">
                    {similar.commonName}
                  </span>
                  <span className="block text-xs text-brand-charcoal/70 dark:text-dark-text-muted leading-relaxed line-clamp-2">
                    {similar.differentiatingFeatures}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </Section>
      )}

      {/* Shape Description */}
      <Section title="Shape" id="section-shape">
        <p className="text-sm text-brand-charcoal/80 dark:text-brand-sand/80 leading-relaxed">
          {data.shapeDescription}
        </p>
      </Section>

      {/* Associated Species — rendered as links when resolved */}
      {data.associatedSpecies.length > 0 && (
        <Section title="Associated Species" id="section-associated">
          {/* eslint-disable-next-line jsx-a11y/no-static-element-interactions, jsx-a11y/click-events-have-key-events */}
          <div className="flex flex-wrap gap-1.5" role="list" aria-label="Associated mushroom and plant species" onClick={onDetailNavigation}>
            {data.associatedSpecies.map((name) => (
              <AssociatedSpeciesLink
                key={name}
                speciesName={name}
                speciesId={associatedSpeciesMap[name] ?? null}
              />
            ))}
          </div>
        </Section>
      )}

      {/* Region */}
      <Section title="Region" id="section-region">
        <p className="text-sm text-brand-charcoal/80 dark:text-brand-sand/80">
          {data.region}
        </p>
      </Section>

    </>
  );
}

// ---------------------------------------------------------------------------
// Loading Skeleton — uses shared SkeletonDetail component
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Main Page Component
// ---------------------------------------------------------------------------

export default function SpeciesDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = params.id ?? "";
  const { record, loading, error } = useSpeciesDetail(id);

  // Derive current page title and category for breadcrumb referrer
  const currentTitle = record
    ? record.data.commonName
    : "";
  const currentCategory = record
    ? record.kind === "tree"
      ? "tree"
      : (record.data as Species | Plant).category
    : "";

  /**
   * Writes the current page info to sessionStorage before navigating
   * to another detail page (e.g., associated species/tree links).
   */
  const handleDetailNavigation = () => {
    if (currentTitle && currentCategory) {
      writeReferrer({
        href: `/field-guide/${id}`,
        title: currentTitle,
        category: currentCategory,
      });
    }
  };

  return (
    <main className="flex min-h-screen flex-col px-4 py-6 pb-24 max-w-2xl mx-auto">
      {/* Breadcrumb navigation */}
      <BreadcrumbNavigator
        currentTitle={currentTitle}
        currentCategory={currentCategory}
      />

      <OnlineHint message="You're viewing cached data. Go online to check for updated species info, new images, and community sightings." />

      {/* Error state */}
      {error && (
        <div
          className="rounded-lg border border-red-300 bg-red-50 dark:bg-red-900/20 dark:border-red-700 p-4 mb-6 text-sm text-red-700 dark:text-red-400"
          role="alert"
        >
          <p>{error}</p>
          <button
            type="button"
            onClick={() => router.push("/field-guide")}
            className="mt-3 text-xs font-medium text-brand-teal underline hover:text-brand-teal-600"
          >
            Return to Field Guide
          </button>
        </div>
      )}

      {/* Loading state */}
      {loading && <SkeletonDetail />}

      {/* Content */}
      {!loading && !error && record && (
        <article>
          {record.kind === "tree" ? (
            <TreeDetail data={record.data} onDetailNavigation={handleDetailNavigation} />
          ) : (
            <SpeciesOrPlantDetail record={record as { kind: "species" | "plant"; data: Species | Plant }} onDetailNavigation={handleDetailNavigation} />
          )}
        </article>
      )}
    </main>
  );
}
