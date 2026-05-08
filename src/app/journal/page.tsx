"use client";

import { useJournal } from "@/hooks/useJournal";
import JournalEntryForm from "@/components/JournalEntryForm";
import JournalPatterns from "@/components/JournalPatterns";

/**
 * Foraging journal page with entry list and pattern analysis.
 * Requirements: 24.1–24.8
 */
export default function JournalPage() {
  const { entries, isLoading, createEntry, analyzePatterns } = useJournal("current-user");
  const patterns = analyzePatterns();

  return (
    <div className="p-4 pb-24">
      <h1 className="text-xl font-bold text-brand-charcoal dark:text-brand-sand mb-4">Foraging Journal</h1>

      <JournalEntryForm
        onSubmit={(params) => createEntry({ ...params, notes: params.notes })}
      />

      {patterns && patterns.length > 0 && (
        <div className="mt-6">
          <JournalPatterns patterns={patterns} />
        </div>
      )}

      <div className="mt-6">
        <h2 className="text-sm font-semibold text-brand-charcoal dark:text-brand-sand mb-3">Recent Entries</h2>
        {isLoading ? (
          <div className="animate-pulse space-y-3">
            {[1, 2, 3].map((i) => <div key={i} className="h-16 bg-brand-charcoal/10 dark:bg-brand-sand/10 rounded-lg" />)}
          </div>
        ) : entries.length === 0 ? (
          <p className="text-xs text-brand-charcoal/60 dark:text-brand-sand/60 text-center">No journal entries yet. Log your first find above.</p>
        ) : (
          <div className="space-y-3">
            {entries.map((entry) => (
              <div key={entry.id} className="rounded-lg border border-brand-charcoal/10 dark:border-brand-sand/10 p-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-brand-charcoal dark:text-brand-sand">
                    {entry.speciesGuess ?? entry.speciesId ?? "Unknown"}
                  </span>
                  <span className="text-xs text-brand-charcoal/60 dark:text-brand-sand/60">{entry.date}</span>
                </div>
                <p className="text-xs text-brand-charcoal/70 dark:text-brand-sand/70 line-clamp-2">{entry.notes}</p>
                <p className="text-[10px] text-brand-charcoal/50 dark:text-brand-sand/50 mt-1">
                  {entry.weather.temperatureF}°F · {entry.weather.conditions}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
