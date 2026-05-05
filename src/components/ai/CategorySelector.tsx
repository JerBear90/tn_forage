'use client';

/**
 * ForageFlow — AI Identification Category Selector
 *
 * Allows the user to select between mushroom, plant, and tree identification
 * categories. Shows a confirmation dialog when changing category if photos
 * have already been uploaded.
 */

import { useCallback, useState } from 'react';
import type { AIIdentificationCategory } from './slotConfigs';

interface CategorySelectorProps {
  /** Currently selected category */
  selectedCategory: AIIdentificationCategory;
  /** Callback when category changes (after confirmation if needed) */
  onCategoryChange: (category: AIIdentificationCategory) => void;
  /** Whether there are existing photos that would be cleared on change */
  hasExistingPhotos: boolean;
}

interface CategoryOption {
  value: AIIdentificationCategory;
  label: string;
  icon: string;
  description: string;
}

const CATEGORIES: CategoryOption[] = [
  {
    value: 'mushroom',
    label: 'Mushroom',
    icon: '🍄',
    description: 'Fungi identification',
  },
  {
    value: 'plant',
    label: 'Plant',
    icon: '🌿',
    description: 'Plant identification',
  },
  {
    value: 'tree',
    label: 'Tree',
    icon: '🌳',
    description: 'Tree identification',
  },
];

export default function CategorySelector({
  selectedCategory,
  onCategoryChange,
  hasExistingPhotos,
}: CategorySelectorProps) {
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [pendingCategory, setPendingCategory] = useState<AIIdentificationCategory | null>(null);

  const handleCategoryClick = useCallback(
    (category: AIIdentificationCategory) => {
      if (category === selectedCategory) return;

      if (hasExistingPhotos) {
        setPendingCategory(category);
        setShowConfirmDialog(true);
      } else {
        onCategoryChange(category);
      }
    },
    [selectedCategory, hasExistingPhotos, onCategoryChange],
  );

  const handleConfirm = useCallback(() => {
    if (pendingCategory) {
      onCategoryChange(pendingCategory);
    }
    setShowConfirmDialog(false);
    setPendingCategory(null);
  }, [pendingCategory, onCategoryChange]);

  const handleCancel = useCallback(() => {
    setShowConfirmDialog(false);
    setPendingCategory(null);
  }, []);

  return (
    <div>
      <fieldset>
        <legend className="text-sm font-semibold text-brand-charcoal dark:text-brand-sand mb-2">
          What are you identifying?
        </legend>
        <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-label="Identification category">
          {CATEGORIES.map((cat) => {
            const isSelected = selectedCategory === cat.value;
            return (
              <button
                key={cat.value}
                type="button"
                role="radio"
                aria-checked={isSelected}
                aria-label={`${cat.label}: ${cat.description}`}
                onClick={() => handleCategoryClick(cat.value)}
                className={`flex flex-col items-center justify-center gap-1 rounded-xl border-2 px-3 py-3 min-h-[44px] min-w-[44px] transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-teal ${
                  isSelected
                    ? 'border-brand-teal bg-brand-teal/10 dark:bg-brand-teal/20'
                    : 'border-brand-charcoal/10 dark:border-brand-sand/10 bg-white/80 dark:bg-brand-charcoal/60 hover:border-brand-teal/40'
                }`}
              >
                <span className="text-xl" aria-hidden="true">
                  {cat.icon}
                </span>
                <span
                  className={`text-xs font-medium ${
                    isSelected
                      ? 'text-brand-teal'
                      : 'text-brand-charcoal dark:text-brand-sand'
                  }`}
                >
                  {cat.label}
                </span>
              </button>
            );
          })}
        </div>
      </fieldset>

      {/* Confirmation dialog */}
      {showConfirmDialog && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="category-change-title"
        >
          <div className="w-full max-w-sm rounded-2xl bg-white dark:bg-brand-charcoal p-6 shadow-xl">
            <h2
              id="category-change-title"
              className="text-lg font-bold text-brand-charcoal dark:text-brand-sand mb-2"
            >
              Change category?
            </h2>
            <p className="text-sm text-brand-charcoal/70 dark:text-brand-sand/70 mb-6">
              Changing the identification category will clear all uploaded photos. Are you sure you want to continue?
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={handleCancel}
                aria-label="Cancel category change"
                className="flex-1 rounded-xl border border-brand-charcoal/20 dark:border-brand-sand/20 px-4 py-3 text-sm font-medium text-brand-charcoal dark:text-brand-sand hover:bg-brand-charcoal/5 dark:hover:bg-brand-sand/10 transition-colors min-h-[44px] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-teal"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                aria-label="Confirm category change and clear photos"
                className="flex-1 rounded-xl bg-brand-teal px-4 py-3 text-sm font-semibold text-white hover:bg-brand-teal/90 transition-colors min-h-[44px] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-teal"
              >
                Change &amp; Clear
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
