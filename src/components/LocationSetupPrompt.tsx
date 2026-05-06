'use client';

/**
 * ForageWise — LocationSetupPrompt Component
 *
 * Shown once after the user grants location permission for the first time.
 * Informs them the app will refresh to localize weather, nearby parks,
 * and seasonal recommendations based on their location.
 */

import { useState, useEffect, useCallback } from 'react';

const LOCATION_SETUP_KEY = 'foragewise-location-setup-done';

export default function LocationSetupPrompt() {
  const [show, setShow] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    // Only show if location was just granted and we haven't shown this before
    function handleLocationGranted() {
      const alreadyDone = localStorage.getItem(LOCATION_SETUP_KEY);
      if (!alreadyDone) {
        setShow(true);
      }
    }

    // Listen for the custom event dispatched when location is first acquired
    window.addEventListener('foragewise-location-granted', handleLocationGranted);
    return () => {
      window.removeEventListener('foragewise-location-granted', handleLocationGranted);
    };
  }, []);

  const handleRefresh = useCallback(() => {
    localStorage.setItem(LOCATION_SETUP_KEY, 'true');
    setRefreshing(true);
    // Short delay so user sees the message, then reload
    setTimeout(() => {
      window.location.reload();
    }, 1500);
  }, []);

  const handleDismiss = useCallback(() => {
    localStorage.setItem(LOCATION_SETUP_KEY, 'true');
    setShow(false);
  }, []);

  if (!show) return null;

  return (
    <div
      role="dialog"
      aria-label="Location setup"
      className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/40 px-4"
    >
      <div className="w-full max-w-sm rounded-xl bg-white dark:bg-dark-surface border border-brand-teal/20 shadow-xl p-6 text-center">
        <div className="text-3xl mb-3" aria-hidden="true">📍</div>
        <h2 className="font-heading font-bold text-lg text-brand-forest dark:text-brand-moss mb-2">
          Location Enabled
        </h2>
        <p className="text-sm text-brand-charcoal/70 dark:text-brand-sand/70 mb-4">
          Great! We&apos;ll refresh the app to load your local weather, nearby parks, and seasonal recommendations based on your area.
        </p>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={handleDismiss}
            className="flex-1 rounded-lg border border-brand-teal/30 bg-white dark:bg-dark-surface px-4 py-3 text-sm font-semibold text-brand-teal hover:bg-brand-teal/5 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-teal"
            style={{ minHeight: '44px' }}
          >
            Not now
          </button>
          <button
            type="button"
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex-1 rounded-lg bg-brand-teal px-4 py-3 text-sm font-semibold text-white hover:bg-brand-teal/90 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-teal disabled:opacity-60"
            style={{ minHeight: '44px' }}
          >
            {refreshing ? 'Refreshing…' : 'Refresh Now'}
          </button>
        </div>
      </div>
    </div>
  );
}
