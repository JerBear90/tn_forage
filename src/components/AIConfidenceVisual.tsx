'use client';

/**
 * ForageWise — AIConfidenceVisual Component
 *
 * Visualizes AI identification confidence in a clear, honest way.
 * Shows confidence as a colored bar with explicit safety messaging.
 * Never implies certainty — always frames as "possible match."
 */

export interface AIConfidenceVisualProps {
  confidence: number; // 0-1
  speciesName: string;
  isToxicLookalike?: boolean;
}

function getConfidenceLevel(confidence: number): {
  label: string;
  color: string;
  bgColor: string;
  message: string;
} {
  if (confidence >= 0.85) {
    return {
      label: 'High match',
      color: 'text-green-700 dark:text-green-400',
      bgColor: 'bg-green-500',
      message: 'Strong visual match — still requires expert verification',
    };
  }
  if (confidence >= 0.6) {
    return {
      label: 'Moderate match',
      color: 'text-amber-700 dark:text-amber-400',
      bgColor: 'bg-amber-500',
      message: 'Possible match — check lookalikes carefully',
    };
  }
  if (confidence >= 0.3) {
    return {
      label: 'Low match',
      color: 'text-orange-700 dark:text-orange-400',
      bgColor: 'bg-orange-500',
      message: 'Weak match — likely a different species',
    };
  }
  return {
    label: 'Very low',
    color: 'text-red-700 dark:text-red-400',
    bgColor: 'bg-red-500',
    message: 'Unlikely match — do not rely on this suggestion',
  };
}

export default function AIConfidenceVisual({ confidence, speciesName, isToxicLookalike }: AIConfidenceVisualProps) {
  const level = getConfidenceLevel(confidence);
  const percentage = Math.round(confidence * 100);

  return (
    <div className={`rounded-lg border p-3 ${isToxicLookalike ? 'border-red-300 bg-red-50/50 dark:border-red-700 dark:bg-red-900/10' : 'border-brand-charcoal/10 dark:border-dark-border bg-white/60 dark:bg-dark-surface/60'}`}>
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-sm font-medium text-brand-charcoal dark:text-dark-text">
          {speciesName}
        </span>
        {isToxicLookalike && (
          <span className="text-[10px] font-bold text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/30 rounded px-1.5 py-0.5">
            ⚠ TOXIC
          </span>
        )}
      </div>

      {/* Confidence bar */}
      <div className="flex items-center gap-2 mb-1.5">
        <div className="flex-1 h-2 rounded-full bg-brand-charcoal/10 dark:bg-brand-sand/10 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${level.bgColor}`}
            style={{ width: `${percentage}%` }}
            role="progressbar"
            aria-valuenow={percentage}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`AI confidence: ${percentage}%`}
          />
        </div>
        <span className={`text-xs font-bold tabular-nums ${level.color}`}>
          {percentage}%
        </span>
      </div>

      {/* Label + message */}
      <div className="flex items-center justify-between">
        <span className={`text-[10px] font-semibold ${level.color}`}>
          {level.label}
        </span>
        <span className="text-[10px] text-brand-charcoal/50 dark:text-brand-sand/50">
          {level.message}
        </span>
      </div>

      {/* Safety note for high confidence */}
      {confidence >= 0.85 && (
        <p className="text-[9px] text-brand-charcoal/40 dark:text-brand-sand/40 mt-1.5 italic border-t border-brand-charcoal/5 dark:border-dark-border pt-1.5">
          High confidence does not mean safe to consume. AI cannot detect all toxic lookalikes. Always verify with a qualified expert.
        </p>
      )}
    </div>
  );
}
