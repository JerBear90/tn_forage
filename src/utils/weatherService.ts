/**
 * ForageWise — Weather Service
 *
 * Fetches current weather data from the weather.gov API (free, no key required).
 * Caches weather snapshots in IndexedDB for offline access.
 * Returns cached data when the device is offline.
 *
 * Requirements: 24.2, 24.8, 25.2
 */

import { putRecord, getAllRecords } from '@/offline/db';
import type { WeatherSnapshot, Coordinates } from '@/types';

const CACHE_MAX_AGE_MS = 60 * 60 * 1000; // 1 hour

/**
 * Fetches the current weather for given coordinates from weather.gov.
 * Falls back to cached data when offline or on API failure.
 */
export async function fetchCurrentWeather(
  coords: Coordinates,
): Promise<WeatherSnapshot | null> {
  // Try to fetch fresh data if online
  if (typeof navigator !== 'undefined' && navigator.onLine) {
    try {
      const snapshot = await fetchFromWeatherGov(coords);
      if (snapshot) {
        // Cache the snapshot
        await cacheWeatherSnapshot(snapshot);
        return snapshot;
      }
    } catch {
      // Fall through to cached data
    }
  }

  // Return cached data
  return getCachedWeather();
}

/**
 * Fetches weather data from the weather.gov API.
 * Uses the two-step process: /points → /forecast/hourly
 */
async function fetchFromWeatherGov(
  coords: Coordinates,
): Promise<WeatherSnapshot | null> {
  try {
    // Step 1: Get the forecast office and grid coordinates
    const pointsUrl = `https://api.weather.gov/points/${coords.lat.toFixed(4)},${coords.lng.toFixed(4)}`;
    const pointsRes = await fetch(pointsUrl, {
      headers: { 'User-Agent': 'ForageWise/1.0 (foragewise@example.com)' },
    });

    if (!pointsRes.ok) return null;

    const pointsData = await pointsRes.json();
    const forecastHourlyUrl = pointsData?.properties?.forecastHourly;

    if (!forecastHourlyUrl) return null;

    // Step 2: Get the hourly forecast
    const forecastRes = await fetch(forecastHourlyUrl, {
      headers: { 'User-Agent': 'ForageWise/1.0 (foragewise@example.com)' },
    });

    if (!forecastRes.ok) return null;

    const forecastData = await forecastRes.json();
    const currentPeriod = forecastData?.properties?.periods?.[0];

    if (!currentPeriod) return null;

    // Build the weather snapshot
    const snapshot: WeatherSnapshot = {
      temperatureF: currentPeriod.temperature ?? 0,
      humidity: currentPeriod.relativeHumidity?.value ?? 50,
      recentRainfallInches: 0, // weather.gov hourly doesn't provide cumulative rainfall easily
      conditions: currentPeriod.shortForecast ?? 'Unknown',
      fetchedAt: new Date().toISOString(),
    };

    return snapshot;
  } catch {
    return null;
  }
}

/**
 * Caches a weather snapshot in IndexedDB using a fixed key.
 */
async function cacheWeatherSnapshot(snapshot: WeatherSnapshot): Promise<void> {
  try {
    // Store as a fruiting forecast record with a special ID for weather cache
    await putRecord('fruitingForecasts', {
      id: 'weather-cache-latest',
      speciesId: '__weather_cache__',
      commonName: 'Weather Cache',
      likelihood: 'low',
      triggers: [JSON.stringify(snapshot)],
      lastUpdated: snapshot.fetchedAt,
    } as never);
  } catch {
    // Silently fail — caching is best-effort
  }
}

/**
 * Retrieves the most recent cached weather snapshot from IndexedDB.
 */
async function getCachedWeather(): Promise<WeatherSnapshot | null> {
  try {
    const forecasts = await getAllRecords('fruitingForecasts');
    const cached = forecasts.find(
      (f) => (f as unknown as { id: string }).id === 'weather-cache-latest',
    );

    if (!cached) return null;

    const triggers = (cached as { triggers?: string[] }).triggers;
    if (!triggers || triggers.length === 0) return null;

    const snapshot: WeatherSnapshot = JSON.parse(triggers[0]);

    // Check if cache is still fresh (within 1 hour)
    const cacheAge = Date.now() - new Date(snapshot.fetchedAt).getTime();
    if (cacheAge > CACHE_MAX_AGE_MS) {
      return snapshot; // Return stale data with a note — better than nothing offline
    }

    return snapshot;
  } catch {
    return null;
  }
}

/**
 * Estimates soil temperature from air temperature.
 * Simple approximation: soil temp lags air temp by ~5°F in spring/fall.
 */
export function estimateSoilTemp(airTempF: number, month: number): number {
  // Soil is warmer than air in fall/winter, cooler in spring/summer
  if (month >= 3 && month <= 6) {
    return airTempF - 5; // Spring: soil lags behind warming air
  } else if (month >= 9 && month <= 11) {
    return airTempF + 3; // Fall: soil retains summer heat
  }
  return airTempF - 2; // Winter/Summer: close to air temp
}
