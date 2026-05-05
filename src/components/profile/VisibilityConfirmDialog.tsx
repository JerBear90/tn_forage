"use client";

import { useEffect, useRef, useCallback } from "react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface VisibilityConfirmDialogProps {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  itemName?: string;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/**
 * Reusable confirmation dialog shown when a user changes a trip or
 * expedition log from private to public. Warns that content will become
 * visible to other ForageWise users.
 *
 * Accessible: focus trap, aria attributes, Escape key to close.
 * Mobile-first: large tap targets (min 44px).
 */
export default function VisibilityConfirmDialog({
  isOpen,
  onConfirm,
  onCancel,
  itemName,
}: VisibilityConfirmDialogProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const confirmBtnRef = useRef<HTMLButtonElement>(null);
  const cancelBtnRef = useRef<HTMLButtonElement>(null);

  // Focus the cancel button when the dialog opens (safer default)
  useEffect(() => {
    if (isOpen) {
      cancelBtnRef.current?.focus();
    }
  }, [isOpen]);

  // Close on Escape key
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Escape") {
        onCancel();
        return;
      }

      // Simple focus trap between the two buttons
      if (e.key === "Tab") {
        const focusable = [cancelBtnRef.current, confirmBtnRef.current].filter(
          Boolean,
        ) as HTMLElement[];
        if (focusable.length === 0) return;

        const first = focusable[0];
        const last = focusable[focusable.length - 1];

        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    },
    [onCancel],
  );

  if (!isOpen) return null;

  const label = itemName ? `"${itemName}"` : "this content";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Confirm visibility change"
      onKeyDown={handleKeyDown}
      ref={dialogRef}
    >
      <div className="w-full max-w-sm rounded-xl bg-white dark:bg-brand-charcoal border border-brand-teal/20 p-5 shadow-lg">
        {/* Warning icon + heading */}
        <div className="flex items-center gap-2 mb-3">
          <svg
            aria-hidden="true"
            className="w-5 h-5 text-amber-500 flex-shrink-0"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
            />
          </svg>
          <h2 className="font-heading font-semibold text-base text-brand-charcoal dark:text-brand-sand">
            Make {label} public?
          </h2>
        </div>

        {/* Warning message */}
        <p className="text-sm text-brand-charcoal/70 dark:text-brand-sand/70 mb-5">
          Making this content public means it will be visible to other
          ForageWise users.
        </p>

        {/* Action buttons — large tap targets */}
        <div className="flex gap-3">
          <button
            ref={cancelBtnRef}
            type="button"
            onClick={onCancel}
            className="flex-1 rounded-lg border border-brand-teal/20 bg-white/60 dark:bg-brand-charcoal/40 text-brand-charcoal/70 dark:text-brand-sand/70 font-medium text-sm py-2.5 hover:bg-brand-teal/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-teal transition-colors min-h-[44px]"
          >
            Cancel
          </button>
          <button
            ref={confirmBtnRef}
            type="button"
            onClick={onConfirm}
            className="flex-1 rounded-lg bg-brand-teal text-white font-semibold text-sm py-2.5 hover:bg-brand-teal/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-teal transition-colors min-h-[44px]"
          >
            Make Public
          </button>
        </div>
      </div>
    </div>
  );
}
