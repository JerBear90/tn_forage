"use client";

import type { CountdownEntry } from "@/types";

interface SeasonalCountdownProps {
  entries: CountdownEntry[];
}

/**
 * Seasonal countdown timers for tracked species.
 * Requirements: 31.1–31.5
 */
export default function SeasonalCountdown({ entries }: SeasonalCountdownProps) {
  if (entries.length === 0) return null;

  return (
    <div className="rounded-lg border border-gray-200 p-4">
      <h3 className="text-sm font-semibold text-gray-800 mb-3">Season Countdown</h3>
      <ul className="space-y-2">
        {entries.map((entry) => (
          <li key={entry.speciesId} className="flex items-center gap-3">
            {entry.image && (
              <img src={entry.image} alt={entry.commonName} className="h-10 w-10 rounded-md object-cover" />
            )}
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-800">{entry.commonName}</p>
              {entry.isInSeason ? (
                <p className="text-xs text-green-600 font-medium">🟢 In season now</p>
              ) : (
                <p className="text-xs text-gray-500">{entry.daysRemaining} days until season</p>
              )}
              {entry.adjustmentNote && (
                <p className="text-[10px] text-amber-600">{entry.adjustmentNote}</p>
              )}
            </div>
            {!entry.isInSeason && (
              <span className="text-lg font-bold text-teal-700">{entry.daysRemaining}d</span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
