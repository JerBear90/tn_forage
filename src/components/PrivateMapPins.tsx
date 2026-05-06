'use client';

/**
 * ForageWise — PrivateMapPins Component
 *
 * Personal, private map layer showing the user's own find locations.
 * Never shared publicly. GPS-fuzzing not applied to private pins.
 * Stored in IndexedDB microhabitatPins store.
 *
 * Features:
 * - Drop a pin at current location
 * - Label with species name + notes
 * - Color-coded by category (mushroom/plant/tree)
 * - Only visible to the pin owner
 * - Works fully offline
 */

import { useState, useEffect, useCallback } from 'react';
import { getAllRecords, putRecord, deleteRecord } from '@/offline/db';
import { useGeolocation } from '@/hooks/useGeolocation';
import type { MicrohabitatPinRecord } from '@/types';

function generateId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });
}

export interface PrivateMapPinsProps {
  /** Called when pins change (for map layer refresh) */
  onPinsChanged?: (pins: MicrohabitatPinRecord[]) => void;
}

export default function PrivateMapPins({ onPinsChanged }: PrivateMapPinsProps) {
  const geo = useGeolocation();
  const [pins, setPins] = useState<MicrohabitatPinRecord[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [label, setLabel] = useState('');
  const [notes, setNotes] = useState('');
  const [category, setCategory] = useState<'mushroom' | 'plant' | 'tree'>('mushroom');
  const [saving, setSaving] = useState(false);

  // Load pins on mount
  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const allPins = await getAllRecords('microhabitatPins');
        if (!cancelled) {
          setPins(allPins as MicrohabitatPinRecord[]);
          onPinsChanged?.(allPins as MicrohabitatPinRecord[]);
        }
      } catch { /* IndexedDB may not be available */ }
    }
    load();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleDropPin = useCallback(async () => {
    if (!geo.position) {
      geo.requestLocation();
      return;
    }
    if (!label.trim()) return;

    setSaving(true);
    try {
      const pin: MicrohabitatPinRecord = {
        id: generateId(),
        userId: 'local-user',
        coordinates: geo.position,
        nearWater: false,
        dominantTrees: [],
        substrate: 'soil',
        notes: `${label.trim()}${notes.trim() ? ' — ' + notes.trim() : ''} [${category}]`,
        photos: [],
        visits: [],
        syncPreference: 'local-only',
        syncStatus: 'pending',
        createdAt: new Date().toISOString(),
      };

      await putRecord('microhabitatPins', pin);
      const updated = [...pins, pin];
      setPins(updated);
      onPinsChanged?.(updated);
      setShowForm(false);
      setLabel('');
      setNotes('');
    } catch { /* silently fail */ }
    finally { setSaving(false); }
  }, [geo, label, notes, category, pins, onPinsChanged]);

  const handleDelete = useCallback(async (pinId: string) => {
    try {
      await deleteRecord('microhabitatPins', pinId);
      const updated = pins.filter((p) => p.id !== pinId);
      setPins(updated);
      onPinsChanged?.(updated);
    } catch { /* silently fail */ }
  }, [pins, onPinsChanged]);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-semibold text-brand-charcoal/70 dark:text-brand-sand/70 uppercase tracking-wide">
          My Private Pins ({pins.length})
        </h3>
        <button
          type="button"
          onClick={() => { setShowForm(!showForm); if (!geo.position) geo.requestLocation(); }}
          className="rounded-lg bg-brand-teal/10 text-brand-teal text-xs font-medium px-3 py-1.5 hover:bg-brand-teal/20 transition-colors"
        >
          + Drop Pin
        </button>
      </div>

      {showForm && (
        <div className="rounded-lg border border-brand-teal/20 bg-white/80 dark:bg-dark-surface/80 p-3 space-y-2">
          <input
            type="text"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="What did you find? (e.g., Chanterelle patch)"
            className="w-full rounded border border-brand-teal/20 bg-white dark:bg-brand-charcoal/60 px-3 py-2 text-sm text-brand-charcoal dark:text-brand-sand placeholder:text-brand-charcoal/40 dark:placeholder:text-brand-sand/40 focus:outline-none focus:ring-2 focus:ring-brand-teal/40"
          />
          <div className="flex gap-2">
            {(['mushroom', 'plant', 'tree'] as const).map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setCategory(cat)}
                className={`flex-1 rounded py-1.5 text-xs font-medium transition-colors ${
                  category === cat
                    ? 'bg-brand-teal text-white'
                    : 'bg-brand-charcoal/5 dark:bg-brand-sand/5 text-brand-charcoal/60 dark:text-brand-sand/60'
                }`}
              >
                {cat === 'mushroom' ? '🍄' : cat === 'plant' ? '🌿' : '🌳'} {cat}
              </button>
            ))}
          </div>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Notes (optional) — e.g., near fallen oak, check back in 2 weeks"
            rows={2}
            className="w-full rounded border border-brand-teal/20 bg-white dark:bg-brand-charcoal/60 px-3 py-2 text-sm text-brand-charcoal dark:text-brand-sand placeholder:text-brand-charcoal/40 dark:placeholder:text-brand-sand/40 focus:outline-none focus:ring-2 focus:ring-brand-teal/40 resize-none"
          />
          {geo.position && (
            <p className="text-[10px] text-brand-teal">📍 {geo.position.lat.toFixed(4)}, {geo.position.lng.toFixed(4)}</p>
          )}
          <button
            type="button"
            onClick={handleDropPin}
            disabled={saving || !label.trim() || !geo.position}
            className="w-full rounded-lg bg-brand-teal text-white text-sm font-medium py-2 hover:bg-brand-teal/90 disabled:opacity-50 transition-colors"
          >
            {saving ? 'Saving…' : geo.position ? 'Save Pin' : 'Getting location…'}
          </button>
          <p className="text-[9px] text-brand-charcoal/40 dark:text-brand-sand/40 text-center">
            🔒 Private — only you can see your pins. Never shared.
          </p>
        </div>
      )}

      {/* Pin list */}
      {pins.length > 0 && !showForm && (
        <div className="space-y-1.5 max-h-40 overflow-y-auto">
          {pins.slice(-5).reverse().map((pin) => {
            // Extract label from notes (stored as "label — notes [category]")
            const displayLabel = pin.notes.split(' — ')[0].replace(/\s*\[.*\]$/, '') || 'Pin';
            const pinCategory = pin.notes.match(/\[(mushroom|plant|tree)\]/)?.[1] || 'mushroom';
            return (
              <div key={pin.id} className="flex items-center justify-between rounded-lg bg-brand-charcoal/5 dark:bg-brand-sand/5 px-3 py-2">
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium text-brand-charcoal dark:text-dark-text truncate">
                    {pinCategory === 'mushroom' ? '🍄' : pinCategory === 'plant' ? '🌿' : '🌳'} {displayLabel}
                  </p>
                  <p className="text-[10px] text-brand-charcoal/40 dark:text-brand-sand/40">
                    {new Date(pin.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleDelete(pin.id)}
                  className="shrink-0 text-red-400 hover:text-red-600 p-1"
                  aria-label={`Delete pin: ${displayLabel}`}
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
