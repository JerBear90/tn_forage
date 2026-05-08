"use client";

import type { ParkEntryFee } from "@/types";

interface ParkEntryFeesProps {
  fees?: ParkEntryFee[];
}

/**
 * Park entry fee display section.
 * Requirements: 14.1–14.5
 */
export default function ParkEntryFees({ fees }: ParkEntryFeesProps) {
  if (!fees || fees.length === 0) {
    return (
      <div className="rounded-md bg-brand-charcoal/5 dark:bg-brand-sand/5 p-3">
        <p className="text-xs text-brand-charcoal/60 dark:text-brand-sand/60">
          Fee information not available. Contact the park or visit their website for current fees.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-md border border-brand-charcoal/10 dark:border-brand-sand/10 p-3">
      <h4 className="text-sm font-semibold text-brand-charcoal dark:text-brand-sand mb-2">Entry Fees</h4>
      <ul className="space-y-1.5">
        {fees.map((fee, i) => (
          <li key={i} className="flex items-center justify-between text-sm">
            <span className="text-brand-charcoal dark:text-brand-sand capitalize">{fee.type.replace("-", " ")}</span>
            <span className="font-medium text-brand-charcoal dark:text-brand-sand">
              {fee.type === "free" ? "Free" : fee.amount ? `$${fee.amount}` : "—"}
            </span>
          </li>
        ))}
      </ul>
      {fees.some((f) => f.notes) && (
        <div className="mt-2 border-t border-brand-charcoal/10 dark:border-brand-sand/10 pt-2">
          {fees.filter((f) => f.notes).map((f, i) => (
            <p key={i} className="text-xs text-brand-charcoal/60 dark:text-brand-sand/60">{f.notes}</p>
          ))}
        </div>
      )}
    </div>
  );
}
