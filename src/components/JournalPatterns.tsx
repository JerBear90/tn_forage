"use client";

interface PatternData {
  species: string;
  avgTempF: number;
  avgHumidity: number;
  avgRainfall: number;
  findCount: number;
}

interface JournalPatternsProps {
  patterns: PatternData[] | null;
}

/**
 * Pattern analysis view showing correlations between finds and conditions.
 * Requirements: 24.7, 24.8
 */
export default function JournalPatterns({ patterns }: JournalPatternsProps) {
  if (!patterns || patterns.length === 0) {
    return (
      <div className="rounded-lg border border-brand-charcoal/10 dark:border-brand-sand/10 p-4 text-center">
        <p className="text-sm text-brand-charcoal/70 dark:text-brand-sand/70">Not enough data for pattern analysis.</p>
        <p className="text-xs text-brand-charcoal/60 dark:text-brand-sand/60 mt-1">Log at least 3 finds to see patterns.</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-brand-charcoal/10 dark:border-brand-sand/10 p-4">
      <h3 className="text-sm font-semibold text-brand-charcoal dark:text-brand-sand mb-3">Your Foraging Patterns</h3>
      <p className="text-xs text-brand-charcoal/70 dark:text-brand-sand/70 mb-3">
        Based on your journal entries, here are the conditions when you typically find each species:
      </p>

      <div className="space-y-3">
        {patterns.map((pattern) => (
          <div key={pattern.species} className="rounded-md bg-brand-charcoal/5 dark:bg-brand-sand/5 p-3">
            <div className="flex items-center justify-between mb-1">
              <h4 className="text-sm font-medium text-brand-charcoal dark:text-brand-sand">{pattern.species}</h4>
              <span className="text-xs text-brand-charcoal/60 dark:text-brand-sand/60">{pattern.findCount} finds</span>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div>
                <p className="text-lg font-bold text-teal-700">{pattern.avgTempF}°F</p>
                <p className="text-[10px] text-brand-charcoal/60 dark:text-brand-sand/60">Avg temp</p>
              </div>
              <div>
                <p className="text-lg font-bold text-blue-700">{pattern.avgHumidity}%</p>
                <p className="text-[10px] text-brand-charcoal/60 dark:text-brand-sand/60">Avg humidity</p>
              </div>
              <div>
                <p className="text-lg font-bold text-indigo-700">{pattern.avgRainfall}″</p>
                <p className="text-[10px] text-brand-charcoal/60 dark:text-brand-sand/60">Avg rainfall</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
