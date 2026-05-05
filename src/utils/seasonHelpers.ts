/**
 * ForageWise — Season Helper Utilities
 *
 * Pure utility functions for season-to-month mapping, current season
 * detection, and month label generation. Used by SeasonChart,
 * SeasonHeatmap, ForagingTipSection, and MushroomCalendar.
 *
 * Season mapping:
 *   Spring: March–May (months 2–4)
 *   Summer: June–August (months 5–7)
 *   Fall: September–November (months 8–10)
 *   Winter: December–February (months 11, 0, 1)
 *
 * Requirements: 1.2, 2.2, 7.2
 */

/** Season names as used in species/plant records */
export type SeasonName = 'Spring' | 'Summer' | 'Fall' | 'Winter';

/** Month index (0 = January, 11 = December) */
export type MonthIndex = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11;

/** Canonical season-to-month mapping */
export const SEASON_MONTHS: Record<SeasonName, MonthIndex[]> = {
  Spring: [2, 3, 4],    // March, April, May
  Summer: [5, 6, 7],    // June, July, August
  Fall: [8, 9, 10],     // September, October, November
  Winter: [11, 0, 1],   // December, January, February
};

/** Abbreviated month labels for chart display */
export const MONTH_LABELS: string[] = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

/** Full month names for calendar display */
export const MONTH_NAMES: string[] = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

/** Valid season names for lookup */
const VALID_SEASONS: Set<string> = new Set(['Spring', 'Summer', 'Fall', 'Winter']);

/**
 * Convert a season string array to a Set of month indices.
 * Unknown season strings are silently ignored.
 */
export function getMonthsForSeasons(seasons: string[]): Set<MonthIndex> {
  const months = new Set<MonthIndex>();
  for (const season of seasons) {
    if (VALID_SEASONS.has(season)) {
      for (const month of SEASON_MONTHS[season as SeasonName]) {
        months.add(month);
      }
    }
  }
  return months;
}

/**
 * Check if a species is in season for a given month index.
 */
export function isInSeasonForMonth(seasons: string[], month: MonthIndex): boolean {
  return getMonthsForSeasons(seasons).has(month);
}

/**
 * Determine the current season based on the date.
 * Reuses the same logic as useSeasonalHighlights.getCurrentSeason().
 */
export function getCurrentSeason(date: Date = new Date()): SeasonName {
  const month = date.getMonth(); // 0-indexed: 0=Jan, 11=Dec
  if (month >= 2 && month <= 4) return 'Spring';
  if (month >= 5 && month <= 7) return 'Summer';
  if (month >= 8 && month <= 10) return 'Fall';
  return 'Winter';
}

/**
 * Get the current month index (0-11).
 */
export function getCurrentMonth(date: Date = new Date()): MonthIndex {
  return date.getMonth() as MonthIndex;
}
