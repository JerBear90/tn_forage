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
      <h1 className="text-xl font-bold text-gray-800 mb-4">Foraging Journal</h1>

      <JournalEntryForm
        onSubmit={(params) => createEntry({ ...params, notes: params.notes })}
      />

      {patterns && patterns.length > 0 && (
        <div className="mt-6">
          <JournalPatterns patterns={patterns} />
        </div>
      )}

      <div className="mt-6">
        <h2 className="text-sm font-semibold text-gray-700 mb-3">Recent Entries</h2>
        {isLoading ? (
          <div className="animate-pulse space-y-3">
            {[1, 2, 3].map((i) => <div key={i} className="h-16 bg-gray-200 rounded-lg" />)}
          </div>
        ) : entries.length === 0 ? (
          <p className="text-xs text-gray-500 text-center">No journal entries yet. Log your first find above.</p>
        ) : (
          <div className="space-y-3">
            {entries.map((entry) => (
              <div key={entry.id} className="rounded-lg border border-gray-200 p-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-gray-800">
                    {entry.speciesGuess ?? entry.speciesId ?? "Unknown"}
                  </span>
                  <span className="text-xs text-gray-500">{entry.date}</span>
                </div>
                <p className="text-xs text-gray-600 line-clamp-2">{entry.notes}</p>
                <p className="text-[10px] text-gray-400 mt-1">
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
