"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  useIdentifyWizard,
  WIZARD_STEP_LABELS,
} from "@/hooks/useIdentifyWizard";
import {
  scoreSpecies,
  type IdentificationResult,
} from "@/services/identifyScoring";
import { getAllRecords } from "@/offline/db";
import { seedDatabase } from "@/data/seedDatabase";
import type {
  UndersideType,
  GrowthLocation,
  NearbyTree,
  CapColor,
  CapShape,
  StemFeature,
  BruisingReaction,
  Season,
  Moisture,
  Species,
} from "@/types";
import LookalikeVerificationChecklist from "@/components/LookalikeVerificationChecklist";
import { requiresVerificationChecklist } from "@/services/verificationChecklist";
import SpeciesImage, { pickImageUrl } from "@/components/SpeciesImage";
import DismissibleDisclaimer from "@/components/DismissibleDisclaimer";
import WizardExampleHint from "@/components/WizardExampleHint";
import {
  UNDERSIDE_EXAMPLES,
  GROWTH_EXAMPLES,
  NEARBY_TREE_EXAMPLES,
  CAP_SHAPE_EXAMPLES,
  STEM_EXAMPLES,
  BRUISING_EXAMPLES,
} from "@/data/wizardExamples";

// ---------------------------------------------------------------------------
// Option data for each step
// ---------------------------------------------------------------------------

const UNDERSIDE_OPTIONS: UndersideType[] = [
  "Gills",
  "Pores",
  "Teeth",
  "Smooth",
  "Unknown",
];

const GROWTH_OPTIONS: GrowthLocation[] = [
  "Soil",
  "Dead wood",
  "Living tree",
  "Leaf litter",
  "Moss",
  "Unknown",
];

const TREE_OPTIONS: NearbyTree[] = [
  "Oak",
  "Hickory",
  "Elm",
  "Maple",
  "Pine",
  "Poplar",
  "Unknown",
];

const CAP_COLOR_OPTIONS: CapColor[] = [
  "White",
  "Brown",
  "Yellow",
  "Orange",
  "Red",
  "Gray",
  "Other",
];

const CAP_SHAPE_OPTIONS: CapShape[] = [
  "Convex",
  "Flat",
  "Funnel",
  "Conical",
  "Bell",
  "Irregular",
  "Unknown",
];

const STEM_OPTIONS: StemFeature[] = [
  "Thick",
  "Thin",
  "Ring present",
  "Volva present",
  "Hollow",
  "Solid",
  "Unknown",
];

const BRUISING_OPTIONS: BruisingReaction[] = [
  "None",
  "Blue",
  "Brown",
  "Yellow",
  "Red",
  "Black",
  "Unknown",
];

const SEASON_OPTIONS: Season[] = ["Spring", "Summer", "Fall", "Winter"];

const MOISTURE_OPTIONS: Moisture[] = ["Dry", "Moist", "Wet", "Unknown"];

// ---------------------------------------------------------------------------
// Color chip visual mapping
// ---------------------------------------------------------------------------

const COLOR_CHIP_MAP: Record<CapColor, string> = {
  White: "bg-white border border-brand-charcoal/20",
  Brown: "bg-amber-800",
  Yellow: "bg-yellow-400",
  Orange: "bg-orange-500",
  Red: "bg-red-600",
  Gray: "bg-gray-400",
  Other: "bg-gradient-to-br from-purple-400 via-pink-400 to-teal-400",
};

// ---------------------------------------------------------------------------
// Reusable chip button
// ---------------------------------------------------------------------------

function OptionChip({
  label,
  selected,
  onSelect,
  colorDot,
}: {
  label: string;
  selected: boolean;
  onSelect: () => void;
  colorDot?: string;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={onSelect}
      className={`
        flex items-center gap-2 px-5 py-3.5 rounded-xl text-sm font-medium
        min-h-[48px] min-w-[48px]
        transition-all duration-150 select-none
        focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-teal
        ${
          selected
            ? "bg-brand-teal text-white shadow-md ring-2 ring-brand-teal/30"
            : "bg-white/80 dark:bg-brand-charcoal-700/60 text-brand-charcoal dark:text-brand-sand border border-brand-charcoal/10 dark:border-brand-sand/10 hover:border-brand-teal/40 active:scale-[0.97]"
        }
      `}
    >
      {colorDot && (
        <span
          className={`w-5 h-5 rounded-full shrink-0 ${colorDot} ${
            selected ? "ring-2 ring-white/60" : ""
          }`}
          aria-hidden="true"
        />
      )}
      {label}
    </button>
  );
}

function MultiChip({
  label,
  selected,
  onToggle,
}: {
  label: string;
  selected: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={selected}
      onClick={onToggle}
      className={`
        flex items-center gap-2 px-5 py-3.5 rounded-xl text-sm font-medium
        min-h-[48px] min-w-[48px]
        transition-all duration-150 select-none
        focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-teal
        ${
          selected
            ? "bg-brand-teal text-white shadow-md ring-2 ring-brand-teal/30"
            : "bg-white/80 dark:bg-brand-charcoal-700/60 text-brand-charcoal dark:text-brand-sand border border-brand-charcoal/10 dark:border-brand-sand/10 hover:border-brand-teal/40 active:scale-[0.97]"
        }
      `}
    >
      <span
        className={`w-4 h-4 rounded border-2 shrink-0 flex items-center justify-center ${
          selected
            ? "border-white bg-white/20"
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
      {label}
    </button>
  );
}

// ---------------------------------------------------------------------------
// Progress bar
// ---------------------------------------------------------------------------

function ProgressBar({
  current,
  total,
}: {
  current: number;
  total: number;
}) {
  const pct = ((current + 1) / total) * 100;
  return (
    <div className="w-full" role="progressbar" aria-valuenow={current + 1} aria-valuemin={1} aria-valuemax={total} aria-label={`Step ${current + 1} of ${total}`}>
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-xs font-medium text-brand-charcoal/60 dark:text-brand-sand/60">
          Step {current + 1} of {total}
        </span>
        <span className="text-xs font-medium text-brand-teal">
          {WIZARD_STEP_LABELS[current]}
        </span>
      </div>
      <div className="h-1.5 w-full rounded-full bg-brand-charcoal/10 dark:bg-brand-sand/10 overflow-hidden">
        <div
          className="h-full rounded-full bg-brand-teal transition-all duration-300 ease-out"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// GPS step
// ---------------------------------------------------------------------------

function GpsStep({
  coords,
  onSetGps,
}: {
  coords: { lat: number; lng: number } | null;
  onSetGps: (c: { lat: number; lng: number } | null) => void;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const requestGps = useCallback(() => {
    if (!("geolocation" in navigator)) {
      setError("GPS is not available on this device.");
      return;
    }
    setLoading(true);
    setError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        onSetGps({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLoading(false);
      },
      (err) => {
        setError(
          err.code === 1
            ? "Location permission denied. You can skip this step."
            : "Unable to get location. You can skip this step."
        );
        setLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  }, [onSetGps]);

  return (
    <div className="flex flex-col items-center gap-4 py-4">
      <p className="text-sm text-brand-charcoal/70 dark:text-brand-sand/70 text-center">
        Optionally share your location to improve matching accuracy.
      </p>

      {coords ? (
        <div className="rounded-xl bg-brand-teal/10 border border-brand-teal/20 p-4 text-center w-full">
          <p className="text-sm font-medium text-brand-teal mb-1">Location captured</p>
          <p className="text-xs text-brand-charcoal/60 dark:text-brand-sand/60">
            {coords.lat.toFixed(5)}, {coords.lng.toFixed(5)}
          </p>
          <button
            type="button"
            onClick={() => onSetGps(null)}
            className="mt-2 text-xs text-brand-earth underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-teal"
          >
            Clear location
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={requestGps}
          disabled={loading}
          className="flex items-center gap-2 px-6 py-4 rounded-xl bg-brand-teal text-white font-semibold text-sm min-h-[48px] hover:bg-brand-teal/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-teal transition-colors active:scale-[0.98] disabled:opacity-60"
        >
          {loading ? (
            <>
              <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Getting location…
            </>
          ) : (
            <>
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
              </svg>
              Get My Location
            </>
          )}
        </button>
      )}

      {error && (
        <p className="text-xs text-brand-earth text-center" role="alert">
          {error}
        </p>
      )}

      <p className="text-xs text-brand-charcoal/50 dark:text-brand-sand/50 text-center">
        This step is optional. Tap Next or Skip to continue without GPS.
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Summary step
// ---------------------------------------------------------------------------

function SummaryStep({
  answers,
  onEdit,
}: {
  answers: ReturnType<typeof useIdentifyWizard>["answers"];
  onEdit: (step: number) => void;
}) {
  const rows: { label: string; value: string; step: number }[] = [
    { label: "Underside Type", value: answers.undersideType ?? "—", step: 0 },
    { label: "Growth Location", value: answers.growthLocation ?? "—", step: 1 },
    { label: "Nearby Tree", value: answers.nearbyTree ?? "—", step: 2 },
    {
      label: "Cap Color",
      value:
        answers.capColor === "Other" && answers.capColorCustom
          ? `Other: ${answers.capColorCustom}`
          : answers.capColor ?? "—",
      step: 3,
    },
    { label: "Cap Shape", value: answers.capShape ?? "—", step: 4 },
    {
      label: "Stem Features",
      value: answers.stemFeatures.length > 0 ? answers.stemFeatures.join(", ") : "—",
      step: 5,
    },
    { label: "Bruising / Cut", value: answers.bruisingReaction ?? "—", step: 6 },
    { label: "Season", value: answers.season ?? "—", step: 7 },
    { label: "Moisture", value: answers.moisture ?? "—", step: 8 },
    {
      label: "GPS",
      value: answers.gpsCoordinates
        ? `${answers.gpsCoordinates.lat.toFixed(4)}, ${answers.gpsCoordinates.lng.toFixed(4)}`
        : "Skipped",
      step: 9,
    },
  ];

  return (
    <div className="space-y-3">
      <p className="text-sm text-brand-charcoal/70 dark:text-brand-sand/70 mb-2">
        Review your answers before finding matches.
      </p>
      <dl className="divide-y divide-brand-charcoal/10 dark:divide-brand-sand/10">
        {rows.map((r) => (
          <div key={r.label} className="flex items-center justify-between py-3 gap-2">
            <div className="min-w-0">
              <dt className="text-xs font-medium text-brand-charcoal/50 dark:text-brand-sand/50">
                {r.label}
              </dt>
              <dd className="text-sm font-medium text-brand-charcoal dark:text-brand-sand truncate">
                {r.value}
              </dd>
            </div>
            <button
              type="button"
              onClick={() => onEdit(r.step)}
              className="shrink-0 text-xs text-brand-teal font-medium hover:underline min-h-[44px] min-w-[44px] flex items-center justify-center focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-teal"
              aria-label={`Edit ${r.label}`}
            >
              Edit
            </button>
          </div>
        ))}
      </dl>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Confidence badge colors
// ---------------------------------------------------------------------------

const CONFIDENCE_STYLES: Record<
  IdentificationResult["confidence"],
  { bg: string; text: string; border: string }
> = {
  "Strong possible match": {
    bg: "bg-emerald-100 dark:bg-emerald-900/40",
    text: "text-emerald-800 dark:text-emerald-300",
    border: "border-emerald-300 dark:border-emerald-700",
  },
  "Possible match": {
    bg: "bg-amber-100 dark:bg-amber-900/40",
    text: "text-amber-800 dark:text-amber-300",
    border: "border-amber-300 dark:border-amber-700",
  },
  "Low confidence": {
    bg: "bg-gray-100 dark:bg-gray-800/40",
    text: "text-gray-600 dark:text-gray-400",
    border: "border-gray-300 dark:border-gray-600",
  },
  "Insufficient information": {
    bg: "bg-red-100 dark:bg-red-900/40",
    text: "text-red-700 dark:text-red-400",
    border: "border-red-300 dark:border-red-700",
  },
};

const EDIBILITY_LABELS: Record<string, string> = {
  "commonly-considered-edible-with-expert-confirmation":
    "Commonly considered edible — expert confirmation required",
  toxic: "Toxic",
  inedible: "Inedible",
  unknown: "Unknown edibility",
};

// ---------------------------------------------------------------------------
// Results display
// ---------------------------------------------------------------------------

function ConfidenceBadge({
  confidence,
}: {
  confidence: IdentificationResult["confidence"];
}) {
  const style = CONFIDENCE_STYLES[confidence];
  return (
    <span
      className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold border ${style.bg} ${style.text} ${style.border}`}
    >
      {confidence}
    </span>
  );
}

function ResultCard({ result }: { result: IdentificationResult }) {
  const router = useRouter();
  const isToxic = result.edibilityLabel === "toxic";
  const needsChecklist = requiresVerificationChecklist(result);
  const [showChecklist, setShowChecklist] = useState(false);

  /** Find the first http(s) image URL from the images array */
  const imageUrl = pickImageUrl(result.images ?? []);

  const handleViewDetails = useCallback(
    (e: React.MouseEvent) => {
      if (needsChecklist) {
        e.preventDefault();
        setShowChecklist(true);
      }
      // If no checklist needed, the Link navigates normally
    },
    [needsChecklist]
  );

  const handleChecklistProceed = useCallback(() => {
    // Navigate programmatically after checklist is completed
    router.push(`/field-guide/${result.speciesId}`);
  }, [result.speciesId, router]);

  const handleChecklistDismiss = useCallback(() => {
    setShowChecklist(false);
  }, []);

  return (
    <div
      className={`rounded-xl border p-4 ${
        isToxic
          ? "border-red-300 dark:border-red-700 bg-red-50/50 dark:bg-red-950/20"
          : "border-brand-charcoal/10 dark:border-brand-sand/10 bg-white/90 dark:bg-brand-charcoal/70"
      }`}
    >
      {/* Species image */}
      {imageUrl && (
        <SpeciesImage
          src={imageUrl}
          alt={result.commonName}
          variant="result"
          className="w-full h-32 -mx-4 -mt-4 mb-3 rounded-t-xl"
          // Override width to fill the card padding
        />
      )}

      {/* Header row */}
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="min-w-0">
          <h3 className="text-base font-semibold text-brand-charcoal dark:text-brand-sand truncate">
            {result.commonName}
          </h3>
          <p className="text-xs italic text-brand-charcoal/60 dark:text-brand-sand/60 truncate">
            {result.scientificName}
          </p>
        </div>
        <ConfidenceBadge confidence={result.confidence} />
      </div>

      {/* Score bar */}
      <div className="mb-3">
        <div className="flex items-center justify-between text-xs text-brand-charcoal/60 dark:text-brand-sand/60 mb-1">
          <span>
            Score: {result.score}/{result.maxScore}
          </span>
          <span>{result.percentage}%</span>
        </div>
        <div className="h-1.5 w-full rounded-full bg-brand-charcoal/10 dark:bg-brand-sand/10 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-300 ${
              result.percentage >= 70
                ? "bg-emerald-500"
                : result.percentage >= 40
                ? "bg-amber-500"
                : result.percentage >= 20
                ? "bg-gray-400"
                : "bg-red-400"
            }`}
            style={{ width: `${Math.max(result.percentage, 2)}%` }}
          />
        </div>
      </div>

      {/* Toxic lookalike warning */}
      {result.hasToxicLookalikes && (
        <div
          className="flex items-center gap-2 rounded-lg bg-red-100 dark:bg-red-900/40 border border-red-300 dark:border-red-700 px-3 py-2 mb-3"
          role="alert"
        >
          <svg
            className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"
            />
          </svg>
          <span className="text-xs font-medium text-red-700 dark:text-red-300">
            Has toxic lookalikes — review carefully before any field decision
          </span>
        </div>
      )}

      {/* Edibility label */}
      <p
        className={`text-xs font-medium mb-2 ${
          isToxic
            ? "text-red-700 dark:text-red-400"
            : "text-brand-charcoal/70 dark:text-brand-sand/70"
        }`}
      >
        {EDIBILITY_LABELS[result.edibilityLabel] ?? result.edibilityLabel}
      </p>

      {/* Matched attributes */}
      {result.matchedAttributes.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-3">
          {result.matchedAttributes.map((attr) => (
            <span
              key={attr}
              className="inline-block px-2 py-0.5 rounded text-xs font-medium bg-brand-teal/10 text-brand-teal border border-brand-teal/20"
            >
              {attr}
            </span>
          ))}
        </div>
      )}

      {/* Link to species detail — gated by verification checklist when needed */}
      <Link
        href={`/field-guide/${result.speciesId}`}
        onClick={handleViewDetails}
        className="inline-flex items-center gap-1 text-sm text-brand-teal font-medium hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-teal"
      >
        View details
        <svg
          className="w-3.5 h-3.5"
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

      {/* Verification checklist overlay */}
      {showChecklist && (
        <LookalikeVerificationChecklist
          speciesName={result.commonName}
          onProceed={handleChecklistProceed}
          onDismiss={handleChecklistDismiss}
        />
      )}
    </div>
  );
}

function ResultsDisplay({
  results,
  onStartOver,
}: {
  results: IdentificationResult[];
  onStartOver: () => void;
}) {
  return (
    <div className="space-y-4">
      {/* Safety disclaimer — dismissible */}
      <DismissibleDisclaimer storageKey="foragewise-identify-disclaimer-ack" variant="earth">
        <p className="text-xs font-semibold">
          Important Safety Notice
        </p>
        <p className="text-xs leading-relaxed mt-0.5">
          These are <strong>possible matches only</strong>, not
          confirmations. Never consume a wild species based solely on app
          results. Always verify with a qualified expert before consuming.
        </p>
      </DismissibleDisclaimer>

      {/* Results count */}
      <p className="text-sm text-brand-charcoal/70 dark:text-brand-sand/70">
        {results.length} species scored.{" "}
        {results.filter((r) => r.confidence !== "Insufficient information")
          .length > 0
          ? "Review possible matches below."
          : "No strong matches found. Try adjusting your answers."}
      </p>

      {/* Result cards */}
      {results.map((result) => (
        <ResultCard key={result.speciesId} result={result} />
      ))}

      {/* Start over button */}
      <div className="pt-2 flex flex-col gap-3">
        <button
          type="button"
          onClick={onStartOver}
          className="w-full flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl text-sm font-semibold min-h-[48px] bg-brand-charcoal/5 dark:bg-brand-sand/10 text-brand-charcoal dark:text-brand-sand hover:bg-brand-charcoal/10 dark:hover:bg-brand-sand/20 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-teal active:scale-[0.97]"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182"
            />
          </svg>
          Start Over
        </button>

        {/* Compare with AI — pass wizard top match for mismatch detection */}
        {results.length > 0 &&
          results[0].confidence !== "Insufficient information" && (
            <Link
              href={`/identify/ai?wizardTopMatchId=${encodeURIComponent(results[0].speciesId)}&wizardTopMatchName=${encodeURIComponent(results[0].commonName)}`}
              className="w-full flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl text-sm font-semibold min-h-[48px] border-2 border-brand-teal text-brand-teal hover:bg-brand-teal/5 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-teal active:scale-[0.97]"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z"
                />
              </svg>
              Compare with AI Recognition
            </Link>
          )}

        <Link
          href="/field-guide"
          className="w-full flex items-center justify-center gap-1 text-sm text-brand-teal font-medium hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-teal min-h-[44px]"
        >
          Browse the Field Guide →
        </Link>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main wizard page
// ---------------------------------------------------------------------------

export default function IdentifyPage() {
  const router = useRouter();
  const wizard = useIdentifyWizard();
  const stepRef = useRef<HTMLDivElement>(null);
  const [results, setResults] = useState<IdentificationResult[] | null>(null);
  const [scoring, setScoring] = useState(false);
  const [scoringError, setScoringError] = useState<string | null>(null);

  /** Load species from IndexedDB, run scoring, and display results */
  const handleFindMatches = useCallback(async () => {
    setScoring(true);
    setScoringError(null);
    try {
      await seedDatabase();
      const speciesList: Species[] = await getAllRecords("species");
      const scored = scoreSpecies(wizard.answers, speciesList);
      setResults(scored);
    } catch (err) {
      setScoringError(
        err instanceof Error ? err.message : "Failed to score species"
      );
    } finally {
      setScoring(false);
    }
  }, [wizard.answers]);

  /** Reset wizard and clear results */
  const handleStartOver = useCallback(() => {
    setResults(null);
    setScoringError(null);
    wizard.reset();
  }, [wizard]);

  // Focus management: move focus to step heading on step change
  useEffect(() => {
    stepRef.current?.focus();
  }, [wizard.currentStep]);

  // Render the current step content
  const renderStep = () => {
    switch (wizard.currentStep) {
      case 0:
        return (
          <fieldset>
            <legend className="sr-only">Select underside type</legend>
            <div className="flex flex-wrap gap-3" role="radiogroup" aria-label="Underside type options">
              {UNDERSIDE_OPTIONS.map((opt) => (
                <OptionChip
                  key={opt}
                  label={opt}
                  selected={wizard.answers.undersideType === opt}
                  onSelect={() => wizard.setAnswer("undersideType", opt)}
                />
              ))}
            </div>
            <WizardExampleHint examples={UNDERSIDE_EXAMPLES} selectedOption={wizard.answers.undersideType} />
          </fieldset>
        );

      case 1:
        return (
          <fieldset>
            <legend className="sr-only">Select growth location</legend>
            <div className="flex flex-wrap gap-3" role="radiogroup" aria-label="Growth location options">
              {GROWTH_OPTIONS.map((opt) => (
                <OptionChip
                  key={opt}
                  label={opt}
                  selected={wizard.answers.growthLocation === opt}
                  onSelect={() => wizard.setAnswer("growthLocation", opt)}
                />
              ))}
            </div>
            <WizardExampleHint examples={GROWTH_EXAMPLES} selectedOption={wizard.answers.growthLocation} />
          </fieldset>
        );

      case 2:
        return (
          <fieldset>
            <legend className="sr-only">Select nearby tree</legend>
            <div className="flex flex-wrap gap-3" role="radiogroup" aria-label="Nearby tree options">
              {TREE_OPTIONS.map((opt) => (
                <OptionChip
                  key={opt}
                  label={opt}
                  selected={wizard.answers.nearbyTree === opt}
                  onSelect={() => wizard.setAnswer("nearbyTree", opt)}
                />
              ))}
            </div>
            <WizardExampleHint examples={NEARBY_TREE_EXAMPLES} selectedOption={wizard.answers.nearbyTree} />
          </fieldset>
        );

      case 3:
        return (
          <fieldset>
            <legend className="sr-only">Select cap color</legend>
            <div className="flex flex-wrap gap-3" role="radiogroup" aria-label="Cap color options">
              {CAP_COLOR_OPTIONS.map((opt) => (
                <OptionChip
                  key={opt}
                  label={opt}
                  selected={wizard.answers.capColor === opt}
                  onSelect={() => wizard.setAnswer("capColor", opt)}
                  colorDot={COLOR_CHIP_MAP[opt]}
                />
              ))}
            </div>
            {wizard.answers.capColor === "Other" && (
              <div className="mt-4">
                <label
                  htmlFor="cap-color-custom"
                  className="block text-xs font-medium text-brand-charcoal/60 dark:text-brand-sand/60 mb-1"
                >
                  Describe the color
                </label>
                <input
                  id="cap-color-custom"
                  type="text"
                  value={wizard.answers.capColorCustom}
                  onChange={(e) =>
                    wizard.setAnswer("capColorCustom", e.target.value)
                  }
                  placeholder="e.g. purple-brown, olive…"
                  className="w-full rounded-lg border border-brand-charcoal/20 dark:border-brand-sand/20 bg-white dark:bg-brand-charcoal-800 px-4 py-3 text-sm text-brand-charcoal dark:text-brand-sand placeholder:text-brand-charcoal/40 dark:placeholder:text-brand-sand/40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-teal"
                  maxLength={60}
                  autoComplete="off"
                />
              </div>
            )}
          </fieldset>
        );

      case 4:
        return (
          <fieldset>
            <legend className="sr-only">Select cap shape</legend>
            <div className="flex flex-wrap gap-3" role="radiogroup" aria-label="Cap shape options">
              {CAP_SHAPE_OPTIONS.map((opt) => (
                <OptionChip
                  key={opt}
                  label={opt}
                  selected={wizard.answers.capShape === opt}
                  onSelect={() => wizard.setAnswer("capShape", opt)}
                />
              ))}
            </div>
            <WizardExampleHint examples={CAP_SHAPE_EXAMPLES} selectedOption={wizard.answers.capShape} />
          </fieldset>
        );

      case 5:
        return (
          <fieldset>
            <legend className="sr-only">Select stem features (multiple allowed)</legend>
            <p className="text-xs text-brand-charcoal/50 dark:text-brand-sand/50 mb-3">
              Select all that apply.
            </p>
            <div className="flex flex-wrap gap-3" role="group" aria-label="Stem feature options">
              {STEM_OPTIONS.map((opt) => (
                <MultiChip
                  key={opt}
                  label={opt}
                  selected={wizard.answers.stemFeatures.includes(opt)}
                  onToggle={() => wizard.toggleStemFeature(opt)}
                />
              ))}
            </div>
            <WizardExampleHint examples={STEM_EXAMPLES} selectedOption={wizard.answers.stemFeatures[wizard.answers.stemFeatures.length - 1] ?? null} />
          </fieldset>
        );

      case 6:
        return (
          <fieldset>
            <legend className="sr-only">Select bruising or cut reaction</legend>
            <div className="flex flex-wrap gap-3" role="radiogroup" aria-label="Bruising reaction options">
              {BRUISING_OPTIONS.map((opt) => (
                <OptionChip
                  key={opt}
                  label={opt}
                  selected={wizard.answers.bruisingReaction === opt}
                  onSelect={() => wizard.setAnswer("bruisingReaction", opt)}
                />
              ))}
            </div>
            <WizardExampleHint examples={BRUISING_EXAMPLES} selectedOption={wizard.answers.bruisingReaction} />
          </fieldset>
        );

      case 7:
        return (
          <fieldset>
            <legend className="sr-only">Select season</legend>
            <div className="flex flex-wrap gap-3" role="radiogroup" aria-label="Season options">
              {SEASON_OPTIONS.map((opt) => (
                <OptionChip
                  key={opt}
                  label={opt}
                  selected={wizard.answers.season === opt}
                  onSelect={() => wizard.setAnswer("season", opt)}
                />
              ))}
            </div>
          </fieldset>
        );

      case 8:
        return (
          <fieldset>
            <legend className="sr-only">Select moisture level</legend>
            <div className="flex flex-wrap gap-3" role="radiogroup" aria-label="Moisture options">
              {MOISTURE_OPTIONS.map((opt) => (
                <OptionChip
                  key={opt}
                  label={opt}
                  selected={wizard.answers.moisture === opt}
                  onSelect={() => wizard.setAnswer("moisture", opt)}
                />
              ))}
            </div>
          </fieldset>
        );

      case 9:
        return (
          <GpsStep
            coords={wizard.answers.gpsCoordinates}
            onSetGps={wizard.setGps}
          />
        );

      case 10:
        return (
          <SummaryStep answers={wizard.answers} onEdit={wizard.goToStep} />
        );

      default:
        return null;
    }
  };

  // GPS step (index 9) is optional — show skip
  const isOptionalStep = wizard.currentStep === 9;

  // If results are available, show the results view
  if (results) {
    return (
      <main className="flex min-h-screen flex-col px-4 py-6 max-w-lg mx-auto pb-28">
        <header className="mb-4">
          <h1 className="text-2xl font-bold text-brand-teal font-heading">
            Identification Results
          </h1>
          <p className="text-sm text-brand-charcoal/70 dark:text-brand-sand/70 mt-1">
            Possible matches based on your observations.
          </p>
        </header>
        <ResultsDisplay results={results} onStartOver={handleStartOver} />
      </main>
    );
  }

  return (
    <main className="flex min-h-screen flex-col px-4 py-6 max-w-lg mx-auto pb-28">
      {/* Header */}
      <header className="mb-4">
        <h1 className="text-2xl font-bold text-brand-teal font-heading">
          Guided ID Wizard
        </h1>
        <p className="text-sm text-brand-charcoal/70 dark:text-brand-sand/70 mt-1">
          Answer each question about what you see. Works offline.
        </p>
      </header>

      {/* Photo shortcut — prominent at top */}
      <Link
        href="/identify/ai"
        className="mb-4 flex items-center gap-3 rounded-xl border border-brand-teal/20 bg-brand-teal/5 dark:bg-brand-teal/10 px-4 py-3 min-h-[48px] hover:bg-brand-teal/10 dark:hover:bg-brand-teal/15 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-teal active:scale-[0.98]"
      >
        <svg
          className="w-6 h-6 text-brand-teal shrink-0"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z"
          />
        </svg>
        <div className="flex-1 min-w-0">
          <span className="text-sm font-semibold text-brand-charcoal dark:text-brand-sand">
            Have a photo instead?
          </span>
          <span className="block text-xs text-brand-charcoal/60 dark:text-brand-sand/60">
            Use AI-assisted photo recognition →
          </span>
        </div>
      </Link>

      {/* Progress */}
      <div className="mb-6">
        <ProgressBar current={wizard.currentStep} total={wizard.totalSteps} />
      </div>

      {/* Step card */}
      <div
        ref={stepRef}
        tabIndex={-1}
        className="rounded-2xl bg-white/90 dark:bg-brand-charcoal/70 border border-brand-charcoal/10 dark:border-brand-sand/10 p-5 mb-6 outline-none"
        aria-live="polite"
      >
        <h2 className="text-lg font-heading font-semibold text-brand-charcoal dark:text-brand-sand mb-4">
          {WIZARD_STEP_LABELS[wizard.currentStep]}
        </h2>
        {renderStep()}
      </div>

      {/* Navigation buttons */}
      <div className="flex items-center gap-3">
        {/* Back */}
        {!wizard.isFirstStep && (
          <button
            type="button"
            onClick={wizard.goBack}
            className="flex items-center justify-center gap-1 px-5 py-3.5 rounded-xl text-sm font-semibold min-h-[48px] bg-brand-charcoal/5 dark:bg-brand-sand/10 text-brand-charcoal dark:text-brand-sand hover:bg-brand-charcoal/10 dark:hover:bg-brand-sand/20 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-teal active:scale-[0.97]"
            aria-label="Go to previous step"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
            Back
          </button>
        )}

        {/* Spacer */}
        <div className="flex-1" />

        {/* Skip (GPS step only) */}
        {isOptionalStep && !wizard.answers.gpsCoordinates && (
          <button
            type="button"
            onClick={wizard.goNext}
            className="px-5 py-3.5 rounded-xl text-sm font-medium min-h-[48px] text-brand-charcoal/60 dark:text-brand-sand/60 hover:text-brand-charcoal dark:hover:text-brand-sand transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-teal"
          >
            Skip
          </button>
        )}

        {/* Next / Find Matches */}
        {wizard.isSummaryStep ? (
          <button
            type="button"
            onClick={handleFindMatches}
            disabled={scoring}
            className="flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl text-sm font-semibold min-h-[48px] bg-brand-teal text-white shadow-md hover:bg-brand-teal/90 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-teal active:scale-[0.97] disabled:opacity-60"
          >
            {scoring ? (
              <>
                <svg
                  className="w-5 h-5 animate-spin"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                  />
                </svg>
                Scoring…
              </>
            ) : (
              <>
                <svg
                  className="w-5 h-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M21 21l-4.35-4.35M11 19a8 8 0 100-16 8 8 0 000 16z"
                  />
                </svg>
                Find Matches
              </>
            )}
          </button>
        ) : (
          <button
            type="button"
            onClick={wizard.goNext}
            disabled={!wizard.canAdvance}
            className="flex items-center justify-center gap-1 px-6 py-3.5 rounded-xl text-sm font-semibold min-h-[48px] bg-brand-teal text-white shadow-md hover:bg-brand-teal/90 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-teal active:scale-[0.97] disabled:opacity-40 disabled:cursor-not-allowed"
            aria-label="Go to next step"
          >
            Next
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
            </svg>
          </button>
        )}
      </div>

      {/* Scoring error */}
      {scoringError && (
        <div
          className="mt-4 rounded-lg bg-red-100 dark:bg-red-900/40 border border-red-300 dark:border-red-700 p-3"
          role="alert"
        >
          <p className="text-xs text-red-700 dark:text-red-400 font-medium">
            {scoringError}
          </p>
        </div>
      )}

      {/* Safety reminder (dismissible) */}
      <DismissibleDisclaimer storageKey="foragewise-identify-disclaimer-ack" variant="earth">
        <p className="text-xs font-medium leading-relaxed">
          Results are possible matches only. Never consume a wild species based
          solely on app results. Verify with a qualified expert before consuming.
        </p>
      </DismissibleDisclaimer>
      {/* Link back */}
      <div className="mt-4 text-center">
        <Link
          href="/field-guide"
          className="text-sm text-brand-teal hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-teal"
        >
          Browse the Field Guide instead →
        </Link>
      </div>
    </main>
  );
}
