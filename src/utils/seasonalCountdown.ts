/**
 * ForageWise — Seasonal Countdown Calculator
 *
 * Calculates days until the next season start for a species.
 * Handles the "currently in season" case.
 *
 * Requirements: 31.2, 31.3
 */

import type { CountdownEntry } from '@/types';

/**
 * Season start months (approximate for Tennessee).
 */
const SEASON_START_MONTHS: Record<string, number> = {
  Spring: 2, // March (0-indexed)
  Summer: 5, // June
  Fall: 8, // September
  Winter: 11, // December
};

/**
 * Season end months (approximate for Tennessee).
 */
const SEASON_END_MONTHS: Record<string, number> = {
  Spring: 4, // May
  Summer: 7, // August
  Fall: 10, // November
  Winter: 1, // February (wraps to next year)
};

/**
 * Species season input for countdown calculation.
 */
export interface SpeciesSeasonInput {
  speciesId: string;
  commonName: string;
  image?: string;
  seasons: string[]; // e.g. ['Spring', 'Fall']
}

/**
 * Determines if a given month falls within a season.
 */
function isMonthInSeason(month: number, season: string): boolean {
  const start = SEASON_START_MONTHS[season];
  const end = SEASON_END_MONTHS[season];

  if (start === undefined || end === undefined) return false;

  if (start <= end) {
    return month >= start && month <= end;
  }
  // Wraps around year boundary (e.g., Winter: Dec–Feb)
  return month >= start || month <= end;
}

/**
 * Calculates the number of days until the next occurrence of a season start.
 *
 * @param now - Current date
 * @param season - Target season name
 * @returns Number of days until the season starts, or 0 if currently in season
 */
export function daysUntilSeasonStart(now: Date, season: string): number {
  const currentMonth = now.getMonth();
  const currentDay = now.getDate();

  // Check if currently in season
  if (isMonthInSeason(currentMonth, season)) {
    return 0;
  }

  // Calculate days until the start of the next occurrence
  const startMonth = SEASON_START_MONTHS[season];
  if (startMonth === undefined) return -1;

  const currentYear = now.getFullYear();

  // Target date is the 1st of the start month
  let targetDate = new Date(currentYear, startMonth, 1);

  // If the target is in the past this year, use next year
  if (targetDate.getTime() <= now.getTime()) {
    targetDate = new Date(currentYear + 1, startMonth, 1);
  }

  const diffMs = targetDate.getTime() - now.getTime();
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
}

/**
 * Calculates the countdown entry for a species.
 * Returns the nearest upcoming season or indicates currently in season.
 *
 * @param species - Species with season information
 * @param now - Current date (injectable for testing)
 * @returns CountdownEntry with days remaining and in-season status
 */
export function calculateCountdown(
  species: SpeciesSeasonInput,
  now: Date = new Date(),
): CountdownEntry {
  const currentMonth = now.getMonth();

  // Check if any of the species' seasons are currently active
  for (const season of species.seasons) {
    if (isMonthInSeason(currentMonth, season)) {
      return {
        speciesId: species.speciesId,
        commonName: species.commonName,
        image: species.image,
        estimatedStartDate: now.toISOString().split('T')[0],
        daysRemaining: 0,
        isInSeason: true,
      };
    }
  }

  // Find the nearest upcoming season
  let minDays = Infinity;
  let nearestSeason = '';

  for (const season of species.seasons) {
    const days = daysUntilSeasonStart(now, season);
    if (days > 0 && days < minDays) {
      minDays = days;
      nearestSeason = season;
    }
  }

  // If no upcoming season found (shouldn't happen with valid data), return default
  if (minDays === Infinity || !nearestSeason) {
    return {
      speciesId: species.speciesId,
      commonName: species.commonName,
      image: species.image,
      estimatedStartDate: now.toISOString().split('T')[0],
      daysRemaining: 0,
      isInSeason: true,
    };
  }

  // Calculate the estimated start date
  const startMonth = SEASON_START_MONTHS[nearestSeason];
  if (startMonth === undefined) {
    return {
      speciesId: species.speciesId,
      commonName: species.commonName,
      image: species.image,
      estimatedStartDate: now.toISOString().split('T')[0],
      daysRemaining: 0,
      isInSeason: true,
    };
  }

  let year = now.getFullYear();
  if (startMonth <= now.getMonth()) {
    year += 1;
  }
  const estimatedStart = new Date(year, startMonth, 1);

  return {
    speciesId: species.speciesId,
    commonName: species.commonName,
    image: species.image,
    estimatedStartDate: estimatedStart.toISOString().split('T')[0],
    daysRemaining: minDays,
    isInSeason: false,
  };
}

/**
 * Generates countdown entries for multiple species.
 * Sorts by days remaining (soonest first), with in-season species at the top.
 */
export function generateCountdowns(
  speciesList: SpeciesSeasonInput[],
  now: Date = new Date(),
): CountdownEntry[] {
  const entries = speciesList.map((sp) => calculateCountdown(sp, now));

  entries.sort((a, b) => {
    // In-season species first
    if (a.isInSeason && !b.isInSeason) return -1;
    if (!a.isInSeason && b.isInSeason) return 1;
    // Then by days remaining
    return a.daysRemaining - b.daysRemaining;
  });

  return entries;
}
