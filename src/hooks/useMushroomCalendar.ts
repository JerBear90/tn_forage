'use client';

/**
 * ForageFlow — Mushroom Calendar Hook
 *
 * Loads all mushroom species from IndexedDB, groups them by month
 * using the canonical season-to-month mapping, and attaches monthly
 * foraging tips from static data.
 *
 * Requirements: 7.2, 7.6, 8.1
 */

import { useState, useEffect } from 'react';
import type { Species } from '@/types';
import { getAllRecords } from '@/offline/db';
import {
  getMonthsForSeasons,
  getCurrentMonth,
  MONTH_NAMES,
  type MonthIndex,
} from '@/utils/seasonHelpers';
import { monthlyForagingTips } from '@/data/foragingTips';

/** Data for a single month in the mushroom calendar */
export interface MonthData {
  month: number; // 0-11
  label: string; // "January", "February", etc.
  species: Array<{
    id: string;
    commonName: string;
    image: string; // first image from species.images
  }>;
  foragingTip: string;
}

/** Return type for the useMushroomCalendar hook */
export interface UseMushroomCalendarResult {
  months: MonthData[];
  currentMonth: number;
  loading: boolean;
  error: string | null;
}

/**
 * Build a lookup map from month index to foraging tip string.
 * Falls back to an empty string if a month has no tip entry.
 */
function buildTipMap(): Map<number, string> {
  const map = new Map<number, string>();
  for (const entry of monthlyForagingTips) {
    map.set(entry.month, entry.tip);
  }
  return map;
}

/**
 * Hook that loads mushroom species from IndexedDB, groups them by
 * month using `getMonthsForSeasons()`, and attaches monthly foraging
 * tips from static data.
 */
export function useMushroomCalendar(): UseMushroomCalendarResult {
  const [months, setMonths] = useState<MonthData[]>([]);
  const [currentMonth, setCurrentMonth] = useState<number>(getCurrentMonth());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadData() {
      try {
        setLoading(true);
        setError(null);

        const allSpecies: Species[] = await getAllRecords('species');

        // Filter to mushroom species only
        const mushrooms = allSpecies.filter((s) => s.category === 'mushroom');

        // Build tip lookup
        const tipMap = buildTipMap();

        // Group species by month (0-11)
        const monthBuckets: Map<number, MonthData['species']> = new Map();
        for (let m = 0; m < 12; m++) {
          monthBuckets.set(m, []);
        }

        for (const species of mushrooms) {
          const inSeasonMonths = getMonthsForSeasons(species.season);
          for (const m of Array.from(inSeasonMonths)) {
            monthBuckets.get(m)!.push({
              id: species.id,
              commonName: species.commonName,
              image: species.images.length > 0 ? species.images[0] : '',
            });
          }
        }

        // Build MonthData array for all 12 months, starting from current month
        const current = getCurrentMonth();
        const monthDataArray: MonthData[] = [];
        for (let i = 0; i < 12; i++) {
          const m = (current + i) % 12;
          monthDataArray.push({
            month: m,
            label: MONTH_NAMES[m],
            species: monthBuckets.get(m) ?? [],
            foragingTip: tipMap.get(m as MonthIndex) ?? '',
          });
        }

        if (!cancelled) {
          setMonths(monthDataArray);
          setCurrentMonth(getCurrentMonth());
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : 'Failed to load mushroom calendar data',
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadData();

    return () => {
      cancelled = true;
    };
  }, []);

  return { months, currentMonth, loading, error };
}
