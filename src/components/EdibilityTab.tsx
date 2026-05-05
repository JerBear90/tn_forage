"use client";

/**
 * ForageWise — EdibilityTab Component
 *
 * Tab component for species detail pages with "Overview" and "Could Be" tabs.
 * Enforces safety language rules — forbidden phrases are stripped at runtime.
 *
 * SAFETY RULES:
 * - NEVER display "safe to eat", "definitely edible", "confirmed edible", or "AI verified"
 * - Toxic lookalikes ALWAYS appear BEFORE edibility discussion
 * - Use non-committal "could be" language only
 *
 * Requirements: 14.1, 14.2, 14.3, 14.4, 14.5, 14.6
 */

import { useState } from "react";
import type { EdibilityLabel, Lookalike } from "@/types";
import { sanitizeSafetyText } from "./edibilityUtils";

// Re-export safety utilities for backward compatibility
export { FORBIDDEN_PHRASES, sanitizeSafetyText } from "./edibilityUtils";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface EdibilityTabProps {
  edibilityLabel: EdibilityLabel;
  safetyNotes: string;
  toxicLookalikes: Lookalike[];
}

// ---------------------------------------------------------------------------
// Helpers
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

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function EdibilityTab({
  edibilityLabel,
  safetyNotes,
  toxicLookalikes,
}: EdibilityTabProps) {
  const [activeTab, setActiveTab] = useState<"overview" | "could-be">(
    "overview"
  );

  const sanitizedSafetyNotes = sanitizeSafetyText(safetyNotes);

  return (
    <div className="mt-6" data-testid="edibility-tab">
      {/* Tab buttons */}
      <div className="flex gap-1 border-b border-brand-charcoal/10 dark:border-dark-border" role="tablist" aria-label="Edibility information tabs">
        <button
          type="button"
          role="tab"
          id="tab-overview"
          aria-selected={activeTab === "overview"}
          aria-controls="tabpanel-overview"
          onClick={() => setActiveTab("overview")}
          className={`px-4 py-2 text-sm font-medium transition-colors min-h-[44px] min-w-[44px] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-teal ${
            activeTab === "overview"
              ? "border-b-2 border-brand-teal text-brand-teal dark:text-brand-teal-300"
              : "text-brand-charcoal/60 dark:text-dark-text-muted hover:text-brand-charcoal dark:hover:text-dark-text"
          }`}
        >
          Overview
        </button>
        <button
          type="button"
          role="tab"
          id="tab-could-be"
          aria-selected={activeTab === "could-be"}
          aria-controls="tabpanel-could-be"
          onClick={() => setActiveTab("could-be")}
          className={`px-4 py-2 text-sm font-medium transition-colors min-h-[44px] min-w-[44px] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-teal ${
            activeTab === "could-be"
              ? "border-b-2 border-brand-teal text-brand-teal dark:text-brand-teal-300"
              : "text-brand-charcoal/60 dark:text-dark-text-muted hover:text-brand-charcoal dark:hover:text-dark-text"
          }`}
        >
          Could Be
        </button>
      </div>

      {/* Overview tab panel */}
      {activeTab === "overview" && (
        <div
          role="tabpanel"
          id="tabpanel-overview"
          aria-labelledby="tab-overview"
          className="pt-4"
          data-testid="edibility-overview"
        >
          {/* Edibility badge */}
          <div className="mb-3">
            <span
              className={`inline-block rounded-full border px-3 py-1 text-sm font-medium ${edibilityColor(edibilityLabel)}`}
            >
              {edibilityDisplayText(edibilityLabel)}
            </span>
          </div>

          {/* Safety notes */}
          <div
            className="rounded-lg border-2 border-amber-400 bg-amber-50 dark:bg-amber-900/20 dark:border-amber-600 p-4"
            role="alert"
            aria-label="Safety warning"
          >
            <p className="text-sm text-amber-900 dark:text-amber-200 leading-relaxed font-medium">
              {sanitizedSafetyNotes}
            </p>
            <p className="text-xs text-amber-700 dark:text-amber-400 mt-2 font-semibold">
              Verify with a qualified expert before consuming any wild species.
            </p>
          </div>
        </div>
      )}

      {/* Could Be tab panel */}
      {activeTab === "could-be" && (
        <div
          role="tabpanel"
          id="tabpanel-could-be"
          aria-labelledby="tab-could-be"
          className="pt-4"
          data-testid="edibility-could-be"
        >
          {/* Disclaimer — always present */}
          <div
            className="rounded-lg border border-amber-300 bg-amber-50/50 dark:bg-amber-900/10 dark:border-amber-600 p-3 mb-4"
            data-testid="edibility-disclaimer"
          >
            <p className="text-xs text-amber-800 dark:text-amber-300 leading-relaxed">
              This is not a definitive edibility assessment. Verify with a
              qualified expert before consuming any wild species.
            </p>
          </div>

          {/* Toxic lookalikes — MUST appear before edibility discussion */}
          {toxicLookalikes.length > 0 && (
            <div className="mb-4" data-testid="edibility-toxic-lookalikes">
              <h3 className="text-sm font-semibold text-red-700 dark:text-red-400 mb-2">
                ⚠ Toxic Lookalikes
              </h3>
              <div
                className="rounded-lg border-2 border-red-400 bg-red-50/50 dark:bg-red-900/10 dark:border-red-600 p-3"
                role="alert"
              >
                <p className="text-xs font-semibold text-red-700 dark:text-red-400 mb-2">
                  Review these toxic lookalikes carefully before considering
                  edibility.
                </p>
                <div className="space-y-2">
                  {toxicLookalikes.map((la) => (
                    <div
                      key={la.speciesId}
                      className="rounded border border-red-300 bg-red-50 dark:bg-red-900/20 dark:border-red-700 p-2"
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span className="inline-block rounded-full bg-red-600 text-white text-xs font-bold px-2 py-0.5">
                          ⚠ TOXIC
                        </span>
                        <span className="font-semibold text-xs text-brand-charcoal dark:text-dark-text">
                          {sanitizeSafetyText(la.commonName)}
                        </span>
                      </div>
                      <p className="text-xs text-brand-charcoal/70 dark:text-dark-text-muted leading-relaxed">
                        {sanitizeSafetyText(la.differentiatingFeatures)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Edibility content — varies by label, appears AFTER toxic lookalikes */}
          <div data-testid="edibility-content">
            <h3 className="text-sm font-semibold text-brand-charcoal dark:text-dark-text mb-2">
              Edibility
            </h3>
            <EdibilityContent
              edibilityLabel={edibilityLabel}
              safetyNotes={sanitizedSafetyNotes}
            />
          </div>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Edibility content by label
// ---------------------------------------------------------------------------

function EdibilityContent({
  edibilityLabel,
  safetyNotes,
}: {
  edibilityLabel: EdibilityLabel;
  safetyNotes: string;
}) {
  switch (edibilityLabel) {
    case "commonly-considered-edible-with-expert-confirmation":
      return (
        <div className="rounded-lg border border-brand-moss/30 bg-brand-moss/5 p-3">
          <h4 className="text-sm font-semibold text-brand-moss mb-1">
            Could be edible with proper expert verification
          </h4>
          <p className="text-xs text-brand-charcoal/70 dark:text-dark-text-muted leading-relaxed">
            This species is commonly considered edible by experienced foragers,
            but requires expert confirmation before consumption. Always verify
            identification with a qualified mycologist or botanist.
          </p>
          {safetyNotes && (
            <p className="text-xs text-brand-charcoal/60 dark:text-dark-text-muted mt-2 leading-relaxed">
              {safetyNotes}
            </p>
          )}
        </div>
      );

    case "toxic":
      return (
        <div
          className="rounded-lg border-2 border-red-500 bg-red-50 dark:bg-red-900/20 dark:border-red-600 p-3"
          role="alert"
          data-testid="edibility-toxic-warning"
        >
          <h4 className="text-sm font-bold text-red-700 dark:text-red-400 mb-1">
            ⚠ Toxic — Do Not Consume
          </h4>
          <p className="text-xs text-red-600 dark:text-red-300 leading-relaxed">
            This species is considered toxic and should not be consumed under any
            circumstances. Contact poison control immediately if ingested.
          </p>
          {safetyNotes && (
            <p className="text-xs text-red-500 dark:text-red-400 mt-2 leading-relaxed">
              {safetyNotes}
            </p>
          )}
        </div>
      );

    case "inedible":
      return (
        <div className="rounded-lg border border-gray-300 bg-gray-50 dark:bg-gray-800 dark:border-gray-600 p-3">
          <h4 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-1">
            Inedible
          </h4>
          <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
            This species is not considered edible. It may not be toxic but is not
            suitable for consumption.
          </p>
          {safetyNotes && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 leading-relaxed">
              {safetyNotes}
            </p>
          )}
        </div>
      );

    case "unknown":
    default:
      return (
        <div className="rounded-lg border border-amber-300 bg-amber-50 dark:bg-amber-900/20 dark:border-amber-600 p-3">
          <h4 className="text-sm font-semibold text-amber-700 dark:text-amber-400 mb-1">
            Unknown
          </h4>
          <p className="text-xs text-amber-600 dark:text-amber-300 leading-relaxed">
            The edibility of this species has not been determined. Do not consume
            any wild species without expert verification.
          </p>
          {safetyNotes && (
            <p className="text-xs text-amber-600 dark:text-amber-300 mt-2 leading-relaxed">
              {safetyNotes}
            </p>
          )}
        </div>
      );
  }
}
