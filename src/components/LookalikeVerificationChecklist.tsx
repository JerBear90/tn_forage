"use client";

/**
 * ForageWise — Lookalike Verification Checklist
 *
 * A safety gate that forces users to acknowledge they've reviewed toxic
 * lookalikes before proceeding to the species detail page for species
 * that are "commonly-considered-edible-with-expert-confirmation" AND
 * have toxic lookalikes.
 *
 * SAFETY: This component enforces the requirement that users must review
 * toxic lookalikes before seeing full edibility information.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import {
  CHECKLIST_ITEMS,
  type ChecklistItemId,
} from "@/services/verificationChecklist";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface LookalikeVerificationChecklistProps {
  /** Species common name — shown in the checklist heading */
  speciesName: string;
  /** Called when the user completes all checklist items and taps Proceed */
  onProceed: () => void;
  /** Called when the user dismisses the checklist without completing */
  onDismiss: () => void;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function LookalikeVerificationChecklist({
  speciesName,
  onProceed,
  onDismiss,
}: LookalikeVerificationChecklistProps) {
  const [checked, setChecked] = useState<Set<ChecklistItemId>>(new Set());
  const overlayRef = useRef<HTMLDivElement>(null);
  const firstCheckboxRef = useRef<HTMLInputElement>(null);

  const allChecked = checked.size === CHECKLIST_ITEMS.length;

  const toggleItem = useCallback((id: ChecklistItemId) => {
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  // Focus management: move focus into the checklist on mount
  useEffect(() => {
    firstCheckboxRef.current?.focus();
  }, []);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onDismiss();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onDismiss]);

  // Trap focus within the overlay
  useEffect(() => {
    const overlay = overlayRef.current;
    if (!overlay) return;

    const handleFocusTrap = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return;

      const focusable = overlay.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    document.addEventListener("keydown", handleFocusTrap);
    return () => document.removeEventListener("keydown", handleFocusTrap);
  }, []);

  return (
    <div
      ref={overlayRef}
      role="dialog"
      aria-modal="true"
      aria-label={`Safety verification for ${speciesName}`}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onDismiss}
        aria-hidden="true"
      />

      {/* Panel */}
      <div className="relative w-full max-w-md mx-4 mb-4 sm:mb-0 rounded-2xl bg-white dark:bg-brand-charcoal border border-brand-charcoal/10 dark:border-brand-sand/10 shadow-xl overflow-hidden">
        {/* Warning header */}
        <div className="bg-red-50 dark:bg-red-900/30 border-b border-red-200 dark:border-red-800 px-5 py-4">
          <div className="flex items-start gap-3">
            <svg
              className="w-6 h-6 text-red-600 dark:text-red-400 shrink-0 mt-0.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"
              />
            </svg>
            <div>
              <h2 className="text-base font-semibold text-red-800 dark:text-red-300">
                Safety Verification Required
              </h2>
              <p className="text-sm text-red-700 dark:text-red-400 mt-1 leading-relaxed">
                <strong>{speciesName}</strong> has toxic lookalikes. Please
                confirm the following before viewing details.
              </p>
            </div>
          </div>
        </div>

        {/* Checklist */}
        <div className="px-5 py-4 space-y-3">
          {CHECKLIST_ITEMS.map((item, index) => (
            <label
              key={item.id}
              className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-colors min-h-[48px] ${
                checked.has(item.id)
                  ? "bg-brand-teal/5 border-brand-teal/30"
                  : "bg-white dark:bg-brand-charcoal-700/40 border-brand-charcoal/10 dark:border-brand-sand/10 hover:border-brand-teal/20"
              }`}
            >
              <input
                ref={index === 0 ? firstCheckboxRef : undefined}
                type="checkbox"
                checked={checked.has(item.id)}
                onChange={() => toggleItem(item.id)}
                className="mt-0.5 w-5 h-5 shrink-0 rounded border-2 border-brand-charcoal/30 dark:border-brand-sand/30 text-brand-teal focus:ring-brand-teal focus:ring-offset-0 cursor-pointer accent-brand-teal"
                aria-label={item.label}
              />
              <span className="text-sm text-brand-charcoal dark:text-brand-sand leading-relaxed">
                {item.label}
              </span>
            </label>
          ))}
        </div>

        {/* Actions */}
        <div className="px-5 pb-5 flex gap-3">
          <button
            type="button"
            onClick={onDismiss}
            className="flex-1 px-4 py-3.5 rounded-xl text-sm font-medium min-h-[48px] bg-brand-charcoal/5 dark:bg-brand-sand/10 text-brand-charcoal dark:text-brand-sand hover:bg-brand-charcoal/10 dark:hover:bg-brand-sand/20 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-teal active:scale-[0.97]"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onProceed}
            disabled={!allChecked}
            className="flex-1 px-4 py-3.5 rounded-xl text-sm font-semibold min-h-[48px] bg-brand-teal text-white shadow-md hover:bg-brand-teal/90 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-teal active:scale-[0.97] disabled:opacity-40 disabled:cursor-not-allowed"
          >
            View Details
          </button>
        </div>
      </div>
    </div>
  );
}
