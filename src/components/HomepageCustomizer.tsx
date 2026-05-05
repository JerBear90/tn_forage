'use client';

import { useState, useCallback } from 'react';
import type { HomepageSectionKey } from '@/types';

/** Human-readable labels for each section key */
const SECTION_LABELS: Record<HomepageSectionKey, string> = {
  'seasonal-highlights': 'Seasonal Highlights',
  'community-feed': 'Community Feed Preview',
  'challenges': 'Challenges',
  'comparison': 'Comparison',
  'routes': 'Routes',
  'mushroom-spots': 'Mushroom Spots',
  'fruiting-forecast': 'Fruiting Forecast',
  'mushroom-calendar': 'Mushroom Calendar',
  'blog-preview': 'Blog Preview',
};

/** All available section keys */
const ALL_SECTIONS: HomepageSectionKey[] = [
  'seasonal-highlights',
  'community-feed',
  'challenges',
  'comparison',
  'routes',
  'mushroom-spots',
  'fruiting-forecast',
  'mushroom-calendar',
  'blog-preview',
];

interface HomepageCustomizerProps {
  /** Currently active sections in order */
  currentSections: HomepageSectionKey[];
  /** Called when user saves their layout */
  onSave: (sections: HomepageSectionKey[]) => void;
  /** Called when user cancels */
  onCancel: () => void;
}

export default function HomepageCustomizer({
  currentSections,
  onSave,
  onCancel,
}: HomepageCustomizerProps) {
  // Local editing state: ordered list of { key, enabled }
  const [items, setItems] = useState(() =>
    ALL_SECTIONS.map((key) => ({
      key,
      enabled: currentSections.includes(key),
    })).sort((a, b) => {
      // Enabled items first, in their current order
      const aIdx = currentSections.indexOf(a.key);
      const bIdx = currentSections.indexOf(b.key);
      if (a.enabled && b.enabled) return aIdx - bIdx;
      if (a.enabled) return -1;
      if (b.enabled) return 1;
      return 0;
    })
  );

  const handleToggle = useCallback((key: HomepageSectionKey) => {
    setItems((prev) =>
      prev.map((item) =>
        item.key === key ? { ...item, enabled: !item.enabled } : item
      )
    );
  }, []);

  const handleMoveUp = useCallback((index: number) => {
    if (index <= 0) return;
    setItems((prev) => {
      const next = [...prev];
      [next[index - 1], next[index]] = [next[index], next[index - 1]];
      return next;
    });
  }, []);

  const handleMoveDown = useCallback((index: number) => {
    setItems((prev) => {
      if (index >= prev.length - 1) return prev;
      const next = [...prev];
      [next[index], next[index + 1]] = [next[index + 1], next[index]];
      return next;
    });
  }, []);

  const handleSave = useCallback(() => {
    const enabledSections = items
      .filter((item) => item.enabled)
      .map((item) => item.key);
    onSave(enabledSections);
  }, [items, onSave]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
      role="dialog"
      aria-modal="true"
      aria-label="Customize homepage layout"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onCancel}
        aria-hidden="true"
      />

      {/* Sheet/Modal */}
      <div className="relative w-full max-w-md max-h-[85vh] bg-white dark:bg-dark-surface rounded-t-2xl sm:rounded-2xl shadow-xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-brand-charcoal/10 dark:border-dark-border">
          <h2 className="text-lg font-semibold text-brand-charcoal dark:text-dark-text">
            Customize Homepage
          </h2>
          <button
            onClick={onCancel}
            aria-label="Cancel customization"
            className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg text-brand-charcoal/60 dark:text-dark-text-muted hover:bg-brand-charcoal/5 dark:hover:bg-dark-border transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Section list */}
        <div className="flex-1 overflow-y-auto px-4 py-3">
          <p className="text-xs text-brand-charcoal/60 dark:text-dark-text-muted mb-3">
            Toggle sections on or off and reorder them using the arrow buttons.
          </p>
          <ul className="space-y-2" role="list">
            {items.map((item, index) => (
              <li
                key={item.key}
                className="flex items-center gap-2 rounded-lg border border-brand-charcoal/10 dark:border-dark-border bg-white dark:bg-dark-surface p-2"
              >
                {/* Toggle */}
                <button
                  onClick={() => handleToggle(item.key)}
                  role="switch"
                  aria-checked={item.enabled}
                  aria-label={`Toggle ${SECTION_LABELS[item.key]} section`}
                  className={`relative min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg transition-colors ${
                    item.enabled
                      ? 'text-brand-teal'
                      : 'text-brand-charcoal/30 dark:text-dark-text-muted'
                  }`}
                >
                  <div
                    className={`w-10 h-6 rounded-full transition-colors ${
                      item.enabled ? 'bg-brand-teal' : 'bg-brand-charcoal/20 dark:bg-dark-border'
                    }`}
                  >
                    <div
                      className={`w-5 h-5 rounded-full bg-white shadow-sm transform transition-transform mt-0.5 ${
                        item.enabled ? 'translate-x-[18px]' : 'translate-x-0.5'
                      }`}
                    />
                  </div>
                </button>

                {/* Label */}
                <span className={`flex-1 text-sm font-medium ${
                  item.enabled
                    ? 'text-brand-charcoal dark:text-dark-text'
                    : 'text-brand-charcoal/50 dark:text-dark-text-muted'
                }`}>
                  {SECTION_LABELS[item.key]}
                </span>

                {/* Reorder controls */}
                <div className="flex flex-col">
                  <button
                    onClick={() => handleMoveUp(index)}
                    disabled={index === 0}
                    aria-label={`Move ${SECTION_LABELS[item.key]} section up`}
                    className="min-w-[44px] min-h-[22px] flex items-center justify-center rounded text-brand-charcoal/60 dark:text-dark-text-muted hover:bg-brand-charcoal/5 dark:hover:bg-dark-border disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
                    </svg>
                  </button>
                  <button
                    onClick={() => handleMoveDown(index)}
                    disabled={index === items.length - 1}
                    aria-label={`Move ${SECTION_LABELS[item.key]} section down`}
                    className="min-w-[44px] min-h-[22px] flex items-center justify-center rounded text-brand-charcoal/60 dark:text-dark-text-muted hover:bg-brand-charcoal/5 dark:hover:bg-dark-border disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>

        {/* Footer actions */}
        <div className="flex gap-3 px-4 py-3 border-t border-brand-charcoal/10 dark:border-dark-border">
          <button
            onClick={onCancel}
            aria-label="Cancel changes"
            className="flex-1 min-h-[44px] rounded-lg border border-brand-charcoal/20 dark:border-dark-border text-sm font-medium text-brand-charcoal dark:text-dark-text hover:bg-brand-charcoal/5 dark:hover:bg-dark-border transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            aria-label="Save homepage layout"
            className="flex-1 min-h-[44px] rounded-lg bg-brand-teal text-white text-sm font-medium hover:bg-brand-teal/90 transition-colors"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
