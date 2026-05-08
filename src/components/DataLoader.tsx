'use client';

/**
 * ForageWise — DataLoader Component
 * 
 * Shows a progress bar on first app load while species/parks/trails
 * data is being loaded into IndexedDB for offline use.
 * Only shows on first visit (when IndexedDB is empty).
 */

import { useState, useEffect } from 'react';
import { countRecords } from '@/offline/db';
import { seedDatabase } from '@/data/seedDatabase';

export default function DataLoader({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('Checking data...');
  const [needsLoad, setNeedsLoad] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function checkAndLoad() {
      try {
        // Check if data already exists
        const speciesCount = await countRecords('species');
        const parksCount = await countRecords('parks');

        if (speciesCount > 0 && parksCount > 0) {
          // Data already loaded — skip
          setLoading(false);
          return;
        }

        // First time — show progress and load
        setNeedsLoad(true);
        setStatus('Loading species data...');
        setProgress(10);

        // Small delay for UI to render
        await new Promise(r => setTimeout(r, 100));

        setProgress(20);
        setStatus('Loading mushrooms & plants...');

        const result = await seedDatabase();

        if (cancelled) return;

        setProgress(80);
        setStatus('Finalizing...');

        await new Promise(r => setTimeout(r, 300));
        setProgress(100);
        setStatus(`Loaded ${result.speciesSeeded + result.plantsSeeded + result.treesSeeded} species, ${result.parksSeeded} parks`);

        await new Promise(r => setTimeout(r, 500));
        setLoading(false);
      } catch {
        // If seeding fails, still show the app
        setLoading(false);
      }
    }

    checkAndLoad();
    return () => { cancelled = true; };
  }, []);

  // If data already exists, render children immediately
  if (!loading) return <>{children}</>;

  // If we don't need to load (data exists), render children
  if (!needsLoad) return <>{children}</>;

  // Show loading screen
  return (
    <div className="fixed inset-0 z-[99999] flex flex-col items-center justify-center bg-brand-charcoal p-8">
      <div className="w-full max-w-xs text-center">
        {/* Logo/Icon */}
        <div className="text-5xl mb-6">🍄</div>
        
        <h1 className="text-xl font-bold text-brand-sand font-heading mb-2">
          ForageWise
        </h1>
        <p className="text-sm text-brand-sand/60 mb-8">
          Preparing your offline field guide...
        </p>

        {/* Progress bar */}
        <div className="w-full h-2 bg-brand-sand/10 rounded-full overflow-hidden mb-3">
          <div
            className="h-full bg-brand-teal rounded-full transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Status text */}
        <p className="text-xs text-brand-sand/40">
          {status}
        </p>
      </div>
    </div>
  );
}
