'use client';

import { useState, useCallback, useRef } from 'react';
import type { Coordinates } from '@/types';
import { getRecord, putRecord } from '@/offline/db';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** IndexedDB settings key for cached location */
const CACHED_LOCATION_KEY = 'lastKnownLocation';

/** Geolocation options — enableHighAccuracy for iPhone Safari + Android Chrome */
const GEO_OPTIONS: PositionOptions = {
  enableHighAccuracy: true,
  timeout: 15000,
  maximumAge: 60000, // accept a cached position up to 1 minute old
};

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface GeolocationState {
  /** The user's current position, or null if not yet determined */
  position: Coordinates | null;
  /** Whether a location request is in progress */
  loading: boolean;
  /** Human-readable error message, or null */
  error: string | null;
  /** Whether the position came from the IndexedDB cache rather than live GPS */
  isCached: boolean;
  /** Trigger a location request */
  requestLocation: () => void;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Save a position to the IndexedDB settings store so it can be used as a
 * fallback when GPS is unavailable.
 */
async function cacheLocation(coords: Coordinates): Promise<void> {
  try {
    await putRecord('settings', {
      id: CACHED_LOCATION_KEY,
      theme: 'system',
      safetyDisclaimerDismissed: false,
      introAnimationShown: false,
      lastSyncAt: undefined,
      // We store lat/lng in a well-known settings key. The Settings type
      // doesn't have a dedicated field, so we piggy-back on the store and
      // cast. A future migration can add a proper field.
      ...({ cachedLat: coords.lat, cachedLng: coords.lng } as Record<string, unknown>),
    } as never);
  } catch {
    // Caching is best-effort — don't break the flow if IndexedDB fails.
  }
}

/**
 * Retrieve the last cached location from IndexedDB settings store.
 */
async function getCachedLocation(): Promise<Coordinates | null> {
  try {
    const record = await getRecord('settings', CACHED_LOCATION_KEY);
    if (record) {
      const r = record as unknown as Record<string, unknown>;
      if (typeof r.cachedLat === 'number' && typeof r.cachedLng === 'number') {
        return { lat: r.cachedLat, lng: r.cachedLng };
      }
    }
  } catch {
    // IndexedDB may not be available — return null.
  }
  return null;
}

/**
 * Convert a GeolocationPositionError code to a user-friendly message.
 */
function friendlyError(err: GeolocationPositionError): string {
  switch (err.code) {
    case err.PERMISSION_DENIED:
      return 'Location permission denied. You can enter your location manually or enable location access in your browser settings.';
    case err.POSITION_UNAVAILABLE:
      return 'Location unavailable. Try again or enter your location manually.';
    case err.TIMEOUT:
      return 'Location request timed out. Try again or enter your location manually.';
    default:
      return 'Unable to determine your location. Try again or enter your location manually.';
  }
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

/**
 * Custom hook that wraps the browser Geolocation API with:
 * - Loading / error states
 * - iPhone Safari + Android Chrome compatibility (enableHighAccuracy)
 * - Cached location fallback via IndexedDB
 * - Manual fallback messaging when GPS fails
 */
export function useGeolocation(): GeolocationState {
  const [position, setPosition] = useState<Coordinates | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isCached, setIsCached] = useState(false);

  // Guard against multiple concurrent requests
  const requestInFlight = useRef(false);

  const requestLocation = useCallback(() => {
    // Prevent duplicate requests
    if (requestInFlight.current) return;

    // Check if Geolocation API is available
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser. Enter your location manually.');
      // Try cached fallback
      getCachedLocation().then((cached) => {
        if (cached) {
          setPosition(cached);
          setIsCached(true);
        }
      });
      return;
    }

    requestInFlight.current = true;
    setLoading(true);
    setError(null);
    setIsCached(false);

    navigator.geolocation.getCurrentPosition(
      // Success
      (pos) => {
        const coords: Coordinates = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        };
        setPosition(coords);
        setLoading(false);
        setIsCached(false);
        requestInFlight.current = false;

        // Cache for future offline use
        cacheLocation(coords);
      },
      // Error — try cached fallback
      async (geoErr) => {
        const cached = await getCachedLocation();
        if (cached) {
          setPosition(cached);
          setIsCached(true);
          setError('Live GPS unavailable — showing your last known location.');
        } else {
          setError(friendlyError(geoErr));
        }
        setLoading(false);
        requestInFlight.current = false;
      },
      GEO_OPTIONS,
    );
  }, []);

  return { position, loading, error, isCached, requestLocation };
}
