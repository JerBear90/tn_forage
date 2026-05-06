'use client';

/**
 * ForageWise — SurvivalToolkit Component
 *
 * Survival-oriented quick reference tools for field use:
 * - Emergency edible plants quick-ref (with heavy disclaimers)
 * - Toxic species to absolutely avoid
 * - Water source indicators (plants that grow near water)
 * - Emergency contacts
 * - Compass / GPS coordinates display
 * - Share location with emergency contact
 *
 * All data works offline. Safety-first language throughout.
 */

import { useState } from 'react';
import Link from 'next/link';
import { useGeolocation } from '@/hooks/useGeolocation';

const TOXIC_AVOID = [
  { name: 'Destroying Angel', id: 'sp-destroying-angel', reason: 'Fatal. No antidote. Looks like common edible mushrooms.' },
  { name: 'Death Cap', id: 'sp-death-cap', reason: 'Responsible for most mushroom fatalities worldwide.' },
  { name: 'Deadly Galerina', id: 'sp-deadly-galerina', reason: 'Grows on wood. Easily confused with Honey Mushroom.' },
  { name: 'False Morel', id: 'sp-false-morel', reason: 'Brain-shaped cap. Contains hydrazine toxins.' },
  { name: 'Jack O\'Lantern', id: 'sp-jack-o-lantern', reason: 'Looks like Chanterelle. Causes severe GI distress.' },
  { name: 'Poison Hemlock', id: 'pl-poison-hemlock', reason: 'Fatal. All parts toxic. Looks like wild carrot.' },
];

const WATER_INDICATORS = [
  'Willows — always grow near water',
  'Cattails — indicate shallow water nearby',
  'Ferns (dense patches) — moist soil, water close',
  'Sycamore trees — often along creek banks',
  'Moss (thick growth) — high moisture area',
];

export default function SurvivalToolkit() {
  const [activeTab, setActiveTab] = useState<'avoid' | 'water' | 'emergency'>('avoid');
  const geo = useGeolocation();

  return (
    <div className="rounded-xl border border-red-200 dark:border-red-800 bg-white dark:bg-dark-surface overflow-hidden">
      {/* Header */}
      <div className="bg-red-50 dark:bg-red-900/20 px-4 py-3 border-b border-red-200 dark:border-red-800">
        <h2 className="font-heading font-semibold text-sm text-red-800 dark:text-red-300 flex items-center gap-2">
          <span aria-hidden="true">🆘</span>
          Survival Quick Reference
        </h2>
        <p className="text-[10px] text-red-700/70 dark:text-red-400/70 mt-0.5">
          Emergency field reference. Works offline. NOT a substitute for training.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-brand-charcoal/10 dark:border-dark-border">
        {([
          { key: 'avoid', label: '☠️ Never Eat' },
          { key: 'water', label: '💧 Find Water' },
          { key: 'emergency', label: '📞 Emergency' },
        ] as const).map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key)}
            className={`flex-1 py-2.5 text-[11px] font-medium transition-colors ${
              activeTab === tab.key
                ? 'text-red-700 dark:text-red-400 border-b-2 border-red-500'
                : 'text-brand-charcoal/50 dark:text-brand-sand/50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="p-4">
        {/* Toxic species to avoid */}
        {activeTab === 'avoid' && (
          <div className="space-y-2">
            <p className="text-[10px] text-red-700 dark:text-red-400 font-semibold mb-2">
              ⚠️ NEVER consume these species. All are potentially fatal.
            </p>
            {TOXIC_AVOID.map((species) => (
              <Link
                key={species.id}
                href={`/field-guide/${species.id}`}
                className="flex items-start gap-2 rounded-lg bg-red-50/50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/30 px-3 py-2 hover:bg-red-100/50 transition-colors"
              >
                <span className="text-red-600 dark:text-red-400 text-xs font-bold mt-0.5">☠️</span>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold text-red-800 dark:text-red-300">{species.name}</p>
                  <p className="text-[10px] text-red-700/70 dark:text-red-400/70">{species.reason}</p>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* Water source indicators */}
        {activeTab === 'water' && (
          <div className="space-y-2">
            <p className="text-[10px] text-brand-charcoal/60 dark:text-brand-sand/60 mb-2">
              Plants and signs that indicate water is nearby:
            </p>
            {WATER_INDICATORS.map((indicator) => (
              <div key={indicator} className="flex items-start gap-2 text-xs text-brand-charcoal/80 dark:text-brand-sand/80">
                <span className="text-blue-500 mt-0.5">💧</span>
                <span>{indicator}</span>
              </div>
            ))}
            <div className="mt-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 px-3 py-2">
              <p className="text-[10px] text-blue-800 dark:text-blue-300">
                ⚠️ Always purify water found in the wild. Boil for 1 minute minimum or use a filter.
              </p>
            </div>
          </div>
        )}

        {/* Emergency */}
        {activeTab === 'emergency' && (
          <div className="space-y-3">
            {/* GPS coordinates */}
            <div className="rounded-lg bg-brand-charcoal/5 dark:bg-brand-sand/5 px-3 py-2">
              <p className="text-[10px] font-semibold text-brand-charcoal/60 dark:text-brand-sand/60 mb-1">Your GPS Coordinates</p>
              {geo.position ? (
                <p className="text-sm font-mono font-bold text-brand-charcoal dark:text-dark-text">
                  {geo.position.lat.toFixed(6)}, {geo.position.lng.toFixed(6)}
                </p>
              ) : (
                <button type="button" onClick={geo.requestLocation} className="text-xs text-brand-teal underline">
                  Get coordinates
                </button>
              )}
              <p className="text-[9px] text-brand-charcoal/40 dark:text-brand-sand/40 mt-1">
                Share these with emergency services if you need rescue.
              </p>
            </div>

            {/* Emergency numbers */}
            <div className="space-y-1.5">
              <a href="tel:911" className="flex items-center gap-2 rounded-lg bg-red-600 text-white px-4 py-3 font-semibold text-sm min-h-[44px]">
                📞 Call 911
              </a>
              <a href="tel:18002221222" className="flex items-center gap-2 rounded-lg border border-brand-charcoal/20 dark:border-dark-border px-4 py-2.5 text-xs font-medium text-brand-charcoal dark:text-dark-text min-h-[44px]">
                ☎️ Poison Control: 1-800-222-1222
              </a>
            </div>

            {/* Share location */}
            {geo.position && (
              <a
                href={`sms:?body=I need help. My GPS location: ${geo.position.lat.toFixed(6)}, ${geo.position.lng.toFixed(6)} — Open in maps: https://maps.google.com/?q=${geo.position.lat},${geo.position.lng}`}
                className="flex items-center justify-center gap-2 rounded-lg border border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-900/20 px-4 py-2.5 text-xs font-medium text-amber-800 dark:text-amber-300 min-h-[44px]"
              >
                📍 Text My Location to Someone
              </a>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
