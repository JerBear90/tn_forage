'use client';

import { TimeRange, TimeRangePreset } from '@/types/admin-dashboard';

interface TimeRangeSelectorProps {
  selected: TimeRangePreset;
  onChange: (preset: TimeRangePreset, range: TimeRange) => void;
}

/** Resolve a preset into a concrete TimeRange with start/end dates */
function resolvePreset(preset: TimeRangePreset): TimeRange {
  const now = new Date();
  const end = new Date(now);
  let start: Date;
  let label: string;

  switch (preset) {
    case 'today':
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      label = 'Today';
      break;
    case '7d':
      start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      label = '7 Days';
      break;
    case '30d':
      start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      label = '30 Days';
      break;
    case '90d':
      start = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
      label = '90 Days';
      break;
    case 'custom':
      start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      label = 'Custom';
      break;
    default:
      start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      label = '7 Days';
  }

  return { label, startDate: start, endDate: end };
}

const presets: { key: TimeRangePreset; label: string }[] = [
  { key: 'today', label: 'Today' },
  { key: '7d', label: '7 Days' },
  { key: '30d', label: '30 Days' },
  { key: '90d', label: '90 Days' },
  { key: 'custom', label: 'Custom' },
];

export default function TimeRangeSelector({ selected, onChange }: TimeRangeSelectorProps) {
  return (
    <div className="flex flex-wrap gap-2" role="group" aria-label="Time range selector">
      {presets.map(({ key, label }) => {
        const isActive = selected === key;
        return (
          <button
            key={key}
            type="button"
            onClick={() => onChange(key, resolvePreset(key))}
            aria-label={`Select time range: ${label}`}
            aria-pressed={isActive}
            className={`
              min-w-[44px] min-h-[44px] px-4 py-2 rounded-lg text-sm font-medium
              transition-colors focus-visible:outline-2 focus-visible:outline-offset-2
              focus-visible:outline-brand-teal
              ${
                isActive
                  ? 'bg-brand-teal text-white shadow-sm'
                  : 'bg-brand-sand dark:bg-brand-charcoal-700 text-brand-charcoal dark:text-brand-sand hover:bg-brand-teal-50 dark:hover:bg-brand-teal-900'
              }
            `}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}
