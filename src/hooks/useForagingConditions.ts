'use client';

/**
 * ForageWise — useForagingConditions Hook
 *
 * Fetches weather for a representative Tennessee location and scores
 * each park's foraging conditions based on current weather + season.
 * Produces per-category scores (mushroom, plant, tree) so users can
 * see which type of foraging is best at each park right now.
 *
 * Uses a single weather fetch (center of TN) rather than per-park
 * to avoid rate-limiting the weather.gov API.
 */

import { useState, useEffect } from 'react';
import { fetchCurrentWeather } from '@/utils/weatherService';
import { getCurrentSeason, type SeasonName } from '@/utils/seasonHelpers';
import type { Park, WeatherSnapshot, Coordinates } from '@/types';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ConditionRating = 'excellent' | 'good' | 'fair' | 'poor';

export interface CategoryScore {
  score: number;
  rating: ConditionRating;
  reasons: string[];
}

export interface ParkCondition {
  parkId: string;
  parkName: string;
  coordinates: Coordinates;
  /** Overall best rating across categories */
  rating: ConditionRating;
  /** Overall best score across categories */
  score: number;
  reasons: string[];
  weather: WeatherSnapshot | null;
  /** Per-category breakdown */
  mushroom: CategoryScore;
  plant: CategoryScore;
  tree: CategoryScore;
}

// ---------------------------------------------------------------------------
// Season data per category
// ---------------------------------------------------------------------------

/** Which seasons are peak for each category in Tennessee */
const PEAK_SEASONS: Record<string, SeasonName[]> = {
  mushroom: ['Spring', 'Fall'],
  plant: ['Spring', 'Summer'],
  tree: ['Spring', 'Summer', 'Fall', 'Winter'], // trees are year-round
};

/** Which seasons have moderate activity */
const MODERATE_SEASONS: Record<string, SeasonName[]> = {
  mushroom: ['Summer'],
  plant: ['Fall'],
  tree: [],
};

// ---------------------------------------------------------------------------
// Scoring logic
// ---------------------------------------------------------------------------

/** Center of Tennessee — used as the single weather fetch point */
const TN_CENTER: Coordinates = { lat: 35.5, lng: -86.0 };

function scoreToRating(score: number): ConditionRating {
  if (score >= 75) return 'excellent';
  if (score >= 55) return 'good';
  if (score >= 35) return 'fair';
  return 'poor';
}

/**
 * Score foraging conditions for a specific category.
 * Each category weights weather factors differently.
 */
function scoreCategoryConditions(
  category: 'mushroom' | 'plant' | 'tree',
  weather: WeatherSnapshot,
): CategoryScore {
  let score = 0;
  const reasons: string[] = [];
  const season = getCurrentSeason();
  const temp = weather.temperatureF;
  const humidity = weather.humidity;
  const rain = weather.recentRainfallInches;

  if (category === 'mushroom') {
    // Mushrooms: heavily dependent on rain + humidity + moderate temps
    // Temperature (0-20 pts) — ideal 55-75°F
    if (temp >= 55 && temp <= 75) { score += 20; reasons.push(`Ideal temp ${temp}°F`); }
    else if (temp >= 45 && temp <= 85) { score += 10; reasons.push(`Moderate temp ${temp}°F`); }
    else { reasons.push(`Temp ${temp}°F — not ideal`); }

    // Humidity (0-25 pts) — mushrooms love 60-90%
    if (humidity >= 60 && humidity <= 90) { score += 25; reasons.push(`Good humidity ${humidity}%`); }
    else if (humidity >= 40) { score += 12; reasons.push(`Moderate humidity ${humidity}%`); }
    else { reasons.push(`Low humidity ${humidity}%`); }

    // Rainfall (0-30 pts) — critical for mushrooms
    if (rain >= 1.0) { score += 30; reasons.push(`Good rain ${rain.toFixed(1)}in`); }
    else if (rain >= 0.25) { score += 18; reasons.push(`Some rain ${rain.toFixed(1)}in`); }
    else if (rain > 0) { score += 5; reasons.push(`Light rain`); }
    else { reasons.push('No recent rain'); }

  } else if (category === 'plant') {
    // Plants: moderate rain, warm temps, decent humidity
    // Temperature (0-25 pts) — ideal 60-85°F
    if (temp >= 60 && temp <= 85) { score += 25; reasons.push(`Ideal temp ${temp}°F`); }
    else if (temp >= 45 && temp <= 95) { score += 15; reasons.push(`Moderate temp ${temp}°F`); }
    else { reasons.push(`Temp ${temp}°F — not ideal`); }

    // Humidity (0-20 pts)
    if (humidity >= 40 && humidity <= 80) { score += 20; reasons.push(`Good humidity ${humidity}%`); }
    else if (humidity >= 30) { score += 10; reasons.push(`Moderate humidity ${humidity}%`); }

    // Rainfall (0-20 pts) — helpful but not as critical
    if (rain >= 0.5) { score += 20; reasons.push(`Good rain ${rain.toFixed(1)}in`); }
    else if (rain >= 0.1) { score += 10; reasons.push(`Some rain`); }
    else { reasons.push('Dry conditions'); }

  } else {
    // Trees: year-round, mainly about visibility and comfort
    // Temperature (0-30 pts) — comfortable hiking temps
    if (temp >= 50 && temp <= 80) { score += 30; reasons.push(`Comfortable ${temp}°F`); }
    else if (temp >= 35 && temp <= 90) { score += 18; reasons.push(`Moderate ${temp}°F`); }
    else { score += 5; reasons.push(`Extreme temp ${temp}°F`); }

    // Humidity (0-15 pts) — lower is more comfortable for hiking
    if (humidity >= 30 && humidity <= 70) { score += 15; reasons.push(`Comfortable humidity`); }
    else if (humidity <= 85) { score += 8; reasons.push(`Moderate humidity`); }
    else { reasons.push('High humidity'); }

    // Rainfall (0-10 pts) — dry is better for tree ID walks
    if (rain < 0.1) { score += 10; reasons.push('Dry — good for walks'); }
    else if (rain < 0.5) { score += 5; reasons.push('Light rain recently'); }
    else { reasons.push('Wet conditions'); }
  }

  // Season scoring (0-25 pts)
  const peakSeasons = PEAK_SEASONS[category] ?? [];
  const moderateSeasons = MODERATE_SEASONS[category] ?? [];

  if (peakSeasons.includes(season)) {
    score += 25;
    reasons.push(`Peak ${category} season`);
  } else if (moderateSeasons.includes(season)) {
    score += 15;
    reasons.push(`Moderate ${category} season`);
  } else {
    score += 5;
    reasons.push(`Off-season for ${category}s`);
  }

  return {
    score: Math.min(score, 100),
    rating: scoreToRating(score),
    reasons,
  };
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export interface UseForagingConditionsResult {
  conditions: ParkCondition[];
  loading: boolean;
  weather: WeatherSnapshot | null;
}

export function useForagingConditions(
  parks: Park[],
): UseForagingConditionsResult {
  const [conditions, setConditions] = useState<ParkCondition[]>([]);
  const [loading, setLoading] = useState(false);
  const [weather, setWeather] = useState<WeatherSnapshot | null>(null);

  useEffect(() => {
    if (parks.length === 0) return;

    let cancelled = false;

    async function fetchConditions() {
      setLoading(true);
      try {
        const snapshot = await fetchCurrentWeather(TN_CENTER);
        if (cancelled) return;

        if (!snapshot) {
          setLoading(false);
          return;
        }

        setWeather(snapshot);

        const scored: ParkCondition[] = parks.map((park) => {
          const mushroom = scoreCategoryConditions('mushroom', snapshot);
          const plant = scoreCategoryConditions('plant', snapshot);
          const tree = scoreCategoryConditions('tree', snapshot);

          // Overall = combined average of all three categories
          const avg = Math.round((mushroom.score + plant.score + tree.score) / 3);

          return {
            parkId: park.id,
            parkName: park.name,
            coordinates: park.coordinates,
            rating: scoreToRating(avg),
            score: avg,
            reasons: [],
            weather: snapshot,
            mushroom,
            plant,
            tree,
          };
        });

        scored.sort((a, b) => b.score - a.score);

        if (!cancelled) {
          setConditions(scored);
        }
      } catch {
        // Silently fail
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    fetchConditions();

    return () => {
      cancelled = true;
    };
  }, [parks]);

  return { conditions, loading, weather };
}
