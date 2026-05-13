"use client";

/**
 * ForageWise — AI Photo Recognition Page
 *
 * Multi-photo upload with recommended shots (top, underside, habitat, stem).
 * Supports camera capture + gallery upload.
 * Queues images offline with timestamp/location/notes.
 * Shows mock AI results with confidence scores, toxic lookalikes, and
 * verification checklist.
 * Compares AI results with Guided ID Wizard results and shows mismatch warning.
 *
 * SAFETY: AI is assistive only. Never says "safe to eat" or "confirmed edible".
 */

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { putRecord, getAllRecords } from "@/offline/db";
import { useGeolocation } from "@/hooks/useGeolocation";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import {
  type ConfidenceLevel,
} from "@/services/identifyScoring";
import { requiresVerificationChecklist } from "@/services/verificationChecklist";
import LookalikeVerificationChecklist from "@/components/LookalikeVerificationChecklist";
import AIConfidenceVisual from "@/components/AIConfidenceVisual";
import DismissibleDisclaimer from "@/components/DismissibleDisclaimer";
import { seedDatabase } from "@/data/seedDatabase";
import { sanitizeSafetyText } from "@/components/edibilityUtils";
import CategorySelector from "@/components/ai/CategorySelector";
import PhotoSlotGrid from "@/components/ai/PhotoSlotGrid";
import type { SlotPhoto } from "@/components/ai/PhotoSlotGrid";
import type { AIIdentificationCategory } from "@/components/ai/slotConfigs";
import type { Species, Photo, Coordinates } from "@/types";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** The four recommended photo angles */
type PhotoSlotKey = "top" | "underside" | "habitat" | "stem";

interface CapturedPhoto {
  id: string;
  slotKey: PhotoSlotKey;
  file: File;
  objectUrl: string;
}

/** Mock AI result — mirrors IdentificationResult for consistency */
interface AIResult {
  speciesId: string;
  commonName: string;
  scientificName: string;
  confidence: ConfidenceLevel;
  percentage: number;
  edibilityLabel: string;
  hasToxicLookalikes: boolean;
  similarSpecies: string[];
  toxicLookalikes: string[];
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

function generateId(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

// ---------------------------------------------------------------------------
// Mock AI analysis — placeholder for real AI service
// ---------------------------------------------------------------------------

/**
 * Simulates an AI analysis call. In production this would call a real
 * vision API. For now it uses the local scoring engine with a slight
 * delay to mimic network latency.
 */
async function mockAIAnalysis(
  _photos: CapturedPhoto[],
): Promise<AIResult[]> {
  // Simulate network delay
  await new Promise((r) => setTimeout(r, 1500));

  // Load species from IndexedDB and generate mock results
  await seedDatabase();
  const speciesList: Species[] = await getAllRecords("species");

  // Pick top 5 species as mock AI results with randomized confidence
  const shuffled = [...speciesList].sort(() => Math.random() - 0.5);
  const top = shuffled.slice(0, Math.min(5, shuffled.length));

  return top.map((sp, i) => {
    const pct = Math.max(15, 95 - i * 18 - Math.floor(Math.random() * 10));
    let confidence: ConfidenceLevel;
    if (pct >= 70) confidence = "Strong possible match";
    else if (pct >= 40) confidence = "Possible match";
    else if (pct >= 20) confidence = "Low confidence";
    else confidence = "Insufficient information";

    return {
      speciesId: sp.id,
      commonName: sanitizeSafetyText(sp.commonName),
      scientificName: sanitizeSafetyText(sp.scientificName),
      confidence,
      percentage: pct,
      edibilityLabel: sanitizeSafetyText(sp.edibilityLabel),
      hasToxicLookalikes: sp.toxicLookalikes?.length > 0,
      similarSpecies: sp.lookalikes?.map((l) => sanitizeSafetyText(l.commonName)) ?? [],
      toxicLookalikes: sp.toxicLookalikes?.map((l) => sanitizeSafetyText(l.commonName)) ?? [],
    };
  });
}

// ---------------------------------------------------------------------------
// Confidence badge (reused pattern from wizard)
// ---------------------------------------------------------------------------

const CONFIDENCE_STYLES: Record<
  ConfidenceLevel,
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
    text: "text-gray-600 dark:text-gray-300",
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

function ConfidenceBadge({ confidence }: { confidence: ConfidenceLevel }) {
  const style = CONFIDENCE_STYLES[confidence];
  return (
    <span
      className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold border ${style.bg} ${style.text} ${style.border}`}
    >
      {confidence}
    </span>
  );
}

// ---------------------------------------------------------------------------
// AI Result Card (Task 13.3)
// ---------------------------------------------------------------------------

function AIResultCard({ result }: { result: AIResult }) {
  const router = useRouter();
  const isToxic = result.edibilityLabel === "toxic";
  const needsChecklist = requiresVerificationChecklist({
    edibilityLabel: result.edibilityLabel as Parameters<typeof requiresVerificationChecklist>[0]["edibilityLabel"],
    hasToxicLookalikes: result.hasToxicLookalikes,
  });
  const [showChecklist, setShowChecklist] = useState(false);

  const handleViewDetails = useCallback(
    (e: React.MouseEvent) => {
      if (needsChecklist) {
        e.preventDefault();
        setShowChecklist(true);
      }
    },
    [needsChecklist],
  );

  return (
    <div
      className={`rounded-xl border p-4 ${
        isToxic
          ? "border-red-300 dark:border-red-700 bg-red-50/50 dark:bg-red-950/20"
          : "border-brand-charcoal/10 dark:border-brand-sand/10 bg-white/90 dark:bg-brand-charcoal/70"
      }`}
    >
      {/* Header */}
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
        <AIConfidenceVisual
          confidence={result.percentage / 100}
          speciesName={result.commonName}
          isToxicLookalike={result.hasToxicLookalikes}
        />
      </div>

      {/* Toxic lookalike warning — shown first per safety rules */}
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

      {/* Toxic lookalikes list */}
      {result.toxicLookalikes.length > 0 && (
        <div className="mb-3">
          <p className="text-xs font-medium text-red-700 dark:text-red-400 mb-1">
            Toxic Lookalikes:
          </p>
          <div className="flex flex-wrap gap-1.5">
            {result.toxicLookalikes.map((name) => (
              <span
                key={name}
                className="inline-block px-2 py-0.5 rounded text-xs font-medium bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800"
              >
                {name}
              </span>
            ))}
          </div>
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

      {/* Similar species */}
      {result.similarSpecies.length > 0 && (
        <div className="mb-3">
          <p className="text-xs font-medium text-brand-charcoal/60 dark:text-brand-sand/60 mb-1">
            Similar Species:
          </p>
          <div className="flex flex-wrap gap-1.5">
            {result.similarSpecies.map((name) => (
              <span
                key={name}
                className="inline-block px-2 py-0.5 rounded text-xs font-medium bg-brand-teal/10 text-brand-teal border border-brand-teal/20"
              >
                {name}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* View details link */}
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
          onProceed={() => {
            router.push(`/field-guide/${result.speciesId}`);
          }}
          onDismiss={() => setShowChecklist(false)}
        />
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Mismatch Warning (Task 13.4)
// ---------------------------------------------------------------------------

function MismatchWarning({
  wizardTopMatch,
  aiTopMatch,
}: {
  wizardTopMatch: string;
  aiTopMatch: string;
}) {
  return (
    <div
      className="rounded-xl bg-amber-50 dark:bg-amber-950/40 border-2 border-amber-400 dark:border-amber-600 p-4 mb-4"
      role="alert"
    >
      <div className="flex items-start gap-3">
        <svg
          className="w-6 h-6 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5"
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
        <div>
          <h3 className="text-sm font-bold text-amber-800 dark:text-amber-300">
            Uncertain result — verify manually
          </h3>
          <p className="text-xs text-amber-700 dark:text-amber-400 mt-1 leading-relaxed">
            The AI recognition and Guided ID Wizard produced different top
            matches. This increases uncertainty.
          </p>
          <div className="mt-2 space-y-1">
            <p className="text-xs text-amber-700 dark:text-amber-400">
              <span className="font-semibold">Wizard top match:</span>{" "}
              {wizardTopMatch}
            </p>
            <p className="text-xs text-amber-700 dark:text-amber-400">
              <span className="font-semibold">AI top match:</span> {aiTopMatch}
            </p>
          </div>
          <p className="text-xs text-amber-700 dark:text-amber-400 mt-2 font-medium">
            Always verify with a qualified expert before consuming any wild
            species.
          </p>
        </div>
      </div>
    </div>
  );
}


// ---------------------------------------------------------------------------
// Main AI Recognition Page
// ---------------------------------------------------------------------------

function AIRecognitionPageInner() {
  const isOnline = useOnlineStatus();
  const geo = useGeolocation();
  const searchParams = useSearchParams();

  // Wizard results passed via URL params (Task 13.4)
  const wizardTopMatchId = searchParams.get("wizardTopMatchId");
  const wizardTopMatchName = searchParams.get("wizardTopMatchName");

  // --- Photo state ---
  const [photos, setPhotos] = useState<CapturedPhoto[]>([]);
  const [activeSlot, setActiveSlot] = useState<PhotoSlotKey | null>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  // --- Category state (new category system) ---
  const [selectedCategory, setSelectedCategory] = useState<AIIdentificationCategory>('mushroom');
  const [categoryPhotos, setCategoryPhotos] = useState<Record<string, SlotPhoto>>({});

  // --- Notes ---
  const [notes, setNotes] = useState("");

  // --- Analysis state ---
  const [analyzing, setAnalyzing] = useState(false);
  const [results, setResults] = useState<AIResult[] | null>(null);
  const [queued, setQueued] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Clean up object URLs on unmount
  useEffect(() => {
    return () => {
      photos.forEach((p) => URL.revokeObjectURL(p.objectUrl));
      Object.values(categoryPhotos).forEach((p) => URL.revokeObjectURL(p.objectUrl));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Request location on mount
  useEffect(() => {
    geo.requestLocation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const photoCount = photos.length;
  const categoryPhotoCount = Object.keys(categoryPhotos).length;
  const hasPhotos = photoCount > 0 || categoryPhotoCount > 0;

  // --- Photo handlers ---
  const handleCapture = useCallback((slotKey: PhotoSlotKey) => {
    setActiveSlot(slotKey);
    // Small delay to ensure state is set before triggering input
    setTimeout(() => cameraInputRef.current?.click(), 0);
  }, []);

  const handleGallery = useCallback((slotKey: PhotoSlotKey) => {
    setActiveSlot(slotKey);
    setTimeout(() => galleryInputRef.current?.click(), 0);
  }, []);

  const handleFileChange = useCallback(
    (files: FileList | null) => {
      if (!files || files.length === 0 || !activeSlot) return;
      const file = files[0];
      const newPhoto: CapturedPhoto = {
        id: generateId(),
        slotKey: activeSlot,
        file,
        objectUrl: URL.createObjectURL(file),
      };
      setPhotos((prev) => {
        // Remove existing photo for this slot
        const existing = prev.find((p) => p.slotKey === activeSlot);
        if (existing) URL.revokeObjectURL(existing.objectUrl);
        return [...prev.filter((p) => p.slotKey !== activeSlot), newPhoto];
      });
      setActiveSlot(null);
    },
    [activeSlot],
  );

  const handleRemovePhoto = useCallback((slotKey: PhotoSlotKey) => {
    setPhotos((prev) => {
      const existing = prev.find((p) => p.slotKey === slotKey);
      if (existing) URL.revokeObjectURL(existing.objectUrl);
      return prev.filter((p) => p.slotKey !== slotKey);
    });
  }, []);

  // --- Category system handlers ---
  const hasCategoryPhotos = Object.keys(categoryPhotos).length > 0;

  const handleCategoryChange = useCallback((category: AIIdentificationCategory) => {
    // Clear all category photos when category changes (confirmation handled by CategorySelector)
    Object.values(categoryPhotos).forEach((photo) => URL.revokeObjectURL(photo.objectUrl));
    setCategoryPhotos({});
    setSelectedCategory(category);
  }, [categoryPhotos]);

  const handleCategoryPhotoUpload = useCallback((slotKey: string, file: File) => {
    const objectUrl = URL.createObjectURL(file);
    setCategoryPhotos((prev) => {
      // Revoke old URL if replacing
      if (prev[slotKey]) {
        URL.revokeObjectURL(prev[slotKey].objectUrl);
      }
      return {
        ...prev,
        [slotKey]: { slotKey, file, objectUrl },
      };
    });
  }, []);

  const handleCategoryPhotoRemove = useCallback((slotKey: string) => {
    setCategoryPhotos((prev) => {
      if (prev[slotKey]) {
        URL.revokeObjectURL(prev[slotKey].objectUrl);
      }
      const next = { ...prev };
      delete next[slotKey];
      return next;
    });
  }, []);

  // --- Save to IndexedDB for offline queuing (Task 13.2) ---
  const savePhotosLocally = useCallback(async () => {
    const now = new Date().toISOString();
    const coords: Coordinates | undefined = geo.position
      ? { lat: geo.position.lat, lng: geo.position.lng }
      : undefined;

    // Save legacy photo slots
    for (const photo of photos) {
      const arrayBuffer = await photo.file.arrayBuffer();
      const blob = new Blob([arrayBuffer], { type: photo.file.type });
      const photoRecord: Photo = {
        id: photo.id,
        blob,
        mimeType: photo.file.type || "image/jpeg",
        caption: `AI Recognition - ${photo.slotKey}${notes ? ` | ${notes}` : ""}`,
        coordinates: coords,
        createdAt: now,
        syncStatus: "pending",
      };
      await putRecord("photos", photoRecord);
    }

    // Save category-based photos
    for (const slotPhoto of Object.values(categoryPhotos)) {
      const arrayBuffer = await slotPhoto.file.arrayBuffer();
      const blob = new Blob([arrayBuffer], { type: slotPhoto.file.type });
      const photoRecord: Photo = {
        id: generateId(),
        blob,
        mimeType: slotPhoto.file.type || "image/jpeg",
        caption: `AI Recognition (${selectedCategory}) - ${slotPhoto.slotKey}${notes ? ` | ${notes}` : ""}`,
        coordinates: coords,
        createdAt: now,
        syncStatus: "pending",
      };
      await putRecord("photos", photoRecord);
    }
  }, [photos, categoryPhotos, selectedCategory, geo.position, notes]);

  // --- Analyze handler ---
  const handleAnalyze = useCallback(async () => {
    if (!hasPhotos) return;

    setError(null);
    setQueued(false);

    // Save photos locally first (always)
    try {
      await savePhotosLocally();
    } catch {
      // Best-effort local save
    }

    if (!isOnline) {
      // Offline: queue for later
      setQueued(true);
      return;
    }

    // Online: run mock AI analysis
    setAnalyzing(true);
    // Track AI identification usage
    import('@/services/usageTracker').then(({ trackAiIdentification }) => trackAiIdentification());
    try {
      const aiResults = await mockAIAnalysis(photos);
      setResults(aiResults);
    } catch {
      setError("Analysis failed. Your photos have been saved locally and can be analyzed when you have a connection.");
    } finally {
      setAnalyzing(false);
    }
  }, [hasPhotos, isOnline, photos, savePhotosLocally]);

  // --- Mismatch detection (Task 13.4) ---
  const hasMismatch = useMemo(() => {
    if (!results || results.length === 0 || !wizardTopMatchId) return false;
    const aiTopId = results[0].speciesId;
    return aiTopId !== wizardTopMatchId;
  }, [results, wizardTopMatchId]);

  // --- Results view ---
  if (results) {
    return (
      <main className="flex min-h-screen flex-col px-4 py-6 max-w-lg mx-auto pb-28">
        <header className="mb-4">
          <Link
            href="/identify"
            className="text-sm text-brand-teal hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-teal mb-2 inline-block"
          >
            ← Back to Identify
          </Link>
          <h1 className="text-2xl font-bold text-brand-teal font-heading">
            AI Recognition Results
          </h1>
          <p className="text-sm text-brand-charcoal/70 dark:text-brand-sand/70 mt-1">
            Possible matches based on photo analysis.
          </p>
        </header>

        <div className="space-y-4">
          {/* Safety disclaimer — dismissible */}
          <DismissibleDisclaimer storageKey="foragewise-ai-identify-disclaimer-ack" variant="earth">
            <p className="text-xs font-semibold">
              Possible match only — not safe for consumption decisions
            </p>
            <p className="text-xs leading-relaxed mt-0.5">
              AI recognition is assistive only. These are{" "}
              <strong>possible matches</strong>, not confirmations. Always
              verify with a qualified expert before consuming any wild
              species.
            </p>
          </DismissibleDisclaimer>

          {/* Mismatch warning (Task 13.4) */}
          {hasMismatch && wizardTopMatchName && results.length > 0 && (
            <MismatchWarning
              wizardTopMatch={wizardTopMatchName}
              aiTopMatch={results[0].commonName}
            />
          )}

          {/* Results count */}
          <p className="text-sm text-brand-charcoal/70 dark:text-brand-sand/70">
            {results.length} possible matches found. Review carefully.
          </p>

          {/* Result cards */}
          {results.map((result) => (
            <AIResultCard key={result.speciesId} result={result} />
          ))}

          {/* Actions */}
          <div className="pt-2 flex flex-col gap-3">
            <button
              type="button"
              onClick={() => {
                setResults(null);
                setPhotos([]);
                setCategoryPhotos({});
                setNotes("");
              }}
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
              Try Again with New Photos
            </button>
            <Link
              href="/identify"
              className="w-full flex items-center justify-center gap-1 text-sm text-brand-teal font-medium hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-teal min-h-[44px]"
            >
              Try the Guided ID Wizard instead →
            </Link>
          </div>
        </div>
      </main>
    );
  }

  // --- Upload / capture view ---
  return (
    <main className="flex min-h-screen flex-col px-4 py-6 max-w-lg mx-auto pb-28">
      {/* Hidden file inputs */}
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        aria-label="Take photo with camera"
        onChange={(e) => {
          handleFileChange(e.target.files);
          e.target.value = "";
        }}
      />
      <input
        ref={galleryInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        aria-label="Upload photo from gallery"
        onChange={(e) => {
          handleFileChange(e.target.files);
          e.target.value = "";
        }}
      />

      <header className="mb-6">
        <Link
          href="/identify"
          className="text-sm text-brand-teal hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-teal mb-2 inline-block"
        >
          ← Back to Identify
        </Link>
        <h1 className="text-2xl font-bold text-brand-teal font-heading">
          AI Photo Recognition
        </h1>
        <p className="text-sm text-brand-charcoal/70 dark:text-brand-sand/70 mt-1">
          Take or upload photos for AI-assisted identification. Multiple angles
          recommended for better results.
        </p>
      </header>

      {/* Safety notice */}
      <div
        className="rounded-lg bg-brand-earth/10 border border-brand-earth/20 p-3 mb-6"
        role="alert"
      >
        <p className="text-xs text-brand-earth font-medium leading-relaxed">
          AI recognition is assistive only. Results are possible matches, not
          confirmations. Never consume a wild species based solely on AI results.
        </p>
      </div>

      {/* Online/Offline status */}
      {!isOnline && (
        <div className="rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-300 dark:border-amber-700 p-3 mb-4">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
            <p className="text-xs font-medium text-amber-700 dark:text-amber-400">
              You&apos;re offline. Photos will be saved locally and queued for
              analysis when you reconnect.
            </p>
          </div>
        </div>
      )}

      {/* Category selector and photo slots */}
      <section aria-label="Identification category and photo upload" className="mb-6">
        <CategorySelector
          selectedCategory={selectedCategory}
          onCategoryChange={handleCategoryChange}
          hasExistingPhotos={hasCategoryPhotos}
        />

        <div className="mt-4">
          <PhotoSlotGrid
            category={selectedCategory}
            photos={categoryPhotos}
            onPhotoUpload={handleCategoryPhotoUpload}
            onPhotoRemove={handleCategoryPhotoRemove}
          />
        </div>
      </section>

      {/* Notes */}
      <section className="mb-6">
        <label
          htmlFor="ai-notes"
          className="block text-sm font-medium text-brand-charcoal dark:text-brand-sand mb-1.5"
        >
          Notes{" "}
          <span className="font-normal text-brand-charcoal/50 dark:text-brand-sand/50">
            (optional)
          </span>
        </label>
        <textarea
          id="ai-notes"
          rows={2}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Any observations — habitat, smell, size, nearby trees…"
          className="w-full rounded-lg border border-brand-teal/20 bg-white/60 dark:bg-brand-charcoal/40 px-4 py-2.5 text-sm text-brand-charcoal dark:text-brand-sand placeholder:text-brand-charcoal/40 dark:placeholder:text-brand-sand/40 focus:outline-none focus:ring-2 focus:ring-brand-teal/40 resize-none"
        />
      </section>

      {/* Location display */}
      {geo.position && (
        <div className="mb-6 rounded-lg bg-brand-teal/5 border border-brand-teal/15 px-3 py-2">
          <p className="text-xs text-brand-teal">
            📍 Location:{" "}
            {geo.position.lat.toFixed(5)}, {geo.position.lng.toFixed(5)}
            {geo.isCached && " (cached)"}
          </p>
        </div>
      )}

      {/* Queued status (Task 13.2) */}
      {queued && (
        <div
          className="rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-300 dark:border-blue-700 p-3 mb-4"
          role="status"
        >
          <div className="flex items-center gap-2">
            <svg
              className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <div>
              <p className="text-sm font-medium text-blue-700 dark:text-blue-300">
                Queued for analysis
              </p>
              <p className="text-xs text-blue-600 dark:text-blue-400 mt-0.5">
                Your photos have been saved locally with timestamp and location.
                They will be analyzed when you&apos;re back online.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div
          className="rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 px-4 py-3 mb-4 text-sm text-red-700 dark:text-red-300"
          role="alert"
        >
          {error}
        </div>
      )}

      {/* Analyze button */}
      <button
        type="button"
        onClick={handleAnalyze}
        disabled={!hasPhotos || analyzing}
        className="w-full flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl text-sm font-semibold min-h-[48px] bg-brand-teal text-white shadow-md hover:bg-brand-teal/90 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-teal active:scale-[0.97] disabled:opacity-40 disabled:cursor-not-allowed mb-4"
      >
        {analyzing ? (
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
            Analyzing…
          </>
        ) : !isOnline ? (
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
                d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            Save &amp; Queue for Analysis
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
                d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z"
              />
            </svg>
            {isOnline ? "Analyze Photos" : "Save & Queue for Analysis"}
          </>
        )}
      </button>

      {/* Status indicator */}
      <div className="text-center mb-4">
        <span
          className={`inline-flex items-center gap-1.5 text-xs font-medium ${
            isOnline
              ? "text-emerald-600 dark:text-emerald-400"
              : "text-amber-600 dark:text-amber-400"
          }`}
        >
          <span
            className={`w-2 h-2 rounded-full ${
              isOnline ? "bg-emerald-500" : "bg-amber-500"
            }`}
          />
          {isOnline ? "Ready to analyze" : "Offline — will queue"}
        </span>
      </div>

      {/* Link to wizard */}
      <div className="text-center">
        <Link
          href="/identify"
          className="text-sm text-brand-teal hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-teal"
        >
          Try the Guided ID Wizard instead →
        </Link>
      </div>
    </main>
  );
}


// ---------------------------------------------------------------------------
// Default export with Suspense boundary for useSearchParams
// ---------------------------------------------------------------------------

export default function AIRecognitionPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center">
          <p className="text-sm text-brand-charcoal/60 dark:text-brand-sand/60">
            Loading…
          </p>
        </main>
      }
    >
      <AIRecognitionPageInner />
    </Suspense>
  );
}
