'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import SeasonalHighlights from '@/components/SeasonalHighlights';
import CommunityFeedPreview from '@/components/CommunityFeedPreview';
import ChallengesSection from '@/components/ChallengesSection';
import HomepageCustomizer from '@/components/HomepageCustomizer';
import OnlineHint from '@/components/OnlineHint';
import NearbyNow from '@/components/NearbyNow';
import type { HomepageSectionKey, HomepageLayoutConfig } from '@/types';
import { putRecord, getRecord } from '@/offline/db';

/** Default section order when no config exists */
export const DEFAULT_SECTIONS: HomepageSectionKey[] = [
  'seasonal-highlights',
  'community-feed',
  'challenges',
  'comparison',
  'routes',
  'mushroom-spots',
];

/** Storage key for anonymous users */
const LAYOUT_KEY_ANONYMOUS = 'homepage-layout-anonymous';

/** Get the layout storage key for a user */
function getLayoutKey(userId?: string): string {
  return userId ? `homepage-layout-${userId}` : LAYOUT_KEY_ANONYMOUS;
}

export default function HomepageContent() {
  const [sections, setSections] = useState<HomepageSectionKey[]>(DEFAULT_SECTIONS);
  const [showCustomizer, setShowCustomizer] = useState(false);
  const [loaded, setLoaded] = useState(false);

  // Load layout from IndexedDB on mount
  useEffect(() => {
    async function loadLayout() {
      try {
        const key = getLayoutKey();
        const record = await getRecord('settings', key);
        if (record) {
          // The record stores the layout config as extra fields
          const config = record as unknown as { id: string; homepageLayout?: HomepageLayoutConfig };
          if (config.homepageLayout && Array.isArray(config.homepageLayout.sections)) {
            setSections(config.homepageLayout.sections);
          }
        }
      } catch {
        // IndexedDB unavailable — use defaults
        console.warn('Failed to load homepage layout from IndexedDB');
      }
      setLoaded(true);
    }
    loadLayout();
  }, []);

  const handleSave = useCallback(async (newSections: HomepageSectionKey[]) => {
    setSections(newSections);
    setShowCustomizer(false);

    const key = getLayoutKey();
    const config: HomepageLayoutConfig = {
      sections: newSections,
      updatedAt: new Date().toISOString(),
    };

    try {
      await putRecord('settings', {
        id: key,
        theme: 'system',
        safetyDisclaimerDismissed: false,
        introAnimationShown: false,
        homepageLayout: config,
      } as never);
    } catch {
      console.warn('Failed to save homepage layout to IndexedDB');
    }
  }, []);

  const handleCancel = useCallback(() => {
    setShowCustomizer(false);
  }, []);

  /** Render a section by key */
  function renderSection(key: HomepageSectionKey) {
    switch (key) {
      case 'seasonal-highlights':
        return (
          <section key={key} className="mb-8">
            <SeasonalHighlights />
          </section>
        );
      case 'community-feed':
        return (
          <section key={key} className="mb-8">
            <CommunityFeedPreview />
          </section>
        );
      case 'challenges':
        return (
          <section key={key} className="mb-8">
            <ChallengesSection preview />
          </section>
        );
      case 'comparison':
        return (
          <section key={key} className="mb-8" aria-label="Quick actions">
            <Link
              href="/field-guide/compare"
              aria-label="Compare species side by side"
              className="flex items-center gap-3 rounded-xl border border-brand-teal/20 bg-white dark:bg-dark-surface p-4 shadow-sm transition-colors hover:bg-brand-teal/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-teal active:scale-[0.98] min-h-[44px] min-w-[44px]"
            >
              <span className="text-2xl" aria-hidden="true">🔍</span>
              <div>
                <span className="text-sm font-semibold text-brand-teal">Comparison</span>
                <p className="text-xs text-brand-charcoal/60 dark:text-dark-text-muted">Compare species side by side</p>
              </div>
            </Link>
          </section>
        );
      case 'routes':
        return (
          <section key={key} className="mb-8">
            <Link
              href="/map"
              aria-label="Explore foraging routes on the map"
              className="flex items-center gap-3 rounded-xl border border-brand-moss/20 bg-white dark:bg-dark-surface p-4 shadow-sm transition-colors hover:bg-brand-moss/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-moss active:scale-[0.98] min-h-[44px] min-w-[44px]"
            >
              <span className="text-2xl" aria-hidden="true">🗺️</span>
              <div>
                <span className="text-sm font-semibold text-brand-moss">Routes</span>
                <p className="text-xs text-brand-charcoal/60 dark:text-dark-text-muted">Explore foraging routes</p>
              </div>
            </Link>
          </section>
        );
      case 'mushroom-spots':
        return (
          <section key={key} className="mb-8">
            <Link
              href="/map"
              aria-label="Find mushroom spots on the map"
              className="flex items-center gap-3 rounded-xl border border-brand-earth/20 bg-white dark:bg-dark-surface p-4 shadow-sm transition-colors hover:bg-brand-earth/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-earth active:scale-[0.98] min-h-[44px] min-w-[44px]"
            >
              <span className="text-2xl" aria-hidden="true">🍄</span>
              <div>
                <span className="text-sm font-semibold text-brand-earth">Mushroom Spots</span>
                <p className="text-xs text-brand-charcoal/60 dark:text-dark-text-muted">Find top mushroom spots</p>
              </div>
            </Link>
          </section>
        );
      case 'fruiting-forecast':
        return (
          <section key={key} className="mb-8">
            <Link
              href="/fruiting-forecast"
              aria-label="View fruiting forecast"
              className="flex items-center gap-3 rounded-xl border border-brand-forest/20 bg-white dark:bg-dark-surface p-4 shadow-sm transition-colors hover:bg-brand-forest/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-forest active:scale-[0.98] min-h-[44px] min-w-[44px]"
            >
              <span className="text-2xl" aria-hidden="true">🌧️</span>
              <div>
                <span className="text-sm font-semibold text-brand-forest">Fruiting Forecast</span>
                <p className="text-xs text-brand-charcoal/60 dark:text-dark-text-muted">Weather-based predictions</p>
              </div>
            </Link>
          </section>
        );
      case 'mushroom-calendar':
        return (
          <section key={key} className="mb-8">
            <Link
              href="/mushroom-calendar"
              aria-label="View mushroom calendar"
              className="flex items-center gap-3 rounded-xl border border-brand-moss/20 bg-white dark:bg-dark-surface p-4 shadow-sm transition-colors hover:bg-brand-moss/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-moss active:scale-[0.98] min-h-[44px] min-w-[44px]"
            >
              <span className="text-2xl" aria-hidden="true">📅</span>
              <div>
                <span className="text-sm font-semibold text-brand-moss">Mushroom Calendar</span>
                <p className="text-xs text-brand-charcoal/60 dark:text-dark-text-muted">Monthly species availability</p>
              </div>
            </Link>
          </section>
        );
      case 'blog-preview':
        return (
          <section key={key} className="mb-8">
            <Link
              href="/community#blog"
              aria-label="Read blog articles"
              className="flex items-center gap-3 rounded-xl border border-brand-charcoal/10 bg-white dark:bg-dark-surface p-4 shadow-sm transition-colors hover:bg-brand-charcoal/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-teal active:scale-[0.98] min-h-[44px] min-w-[44px]"
            >
              <span className="text-2xl" aria-hidden="true">📝</span>
              <div>
                <span className="text-sm font-semibold text-brand-charcoal dark:text-dark-text">Blog</span>
                <p className="text-xs text-brand-charcoal/60 dark:text-dark-text-muted">Foraging articles & guides</p>
              </div>
            </Link>
          </section>
        );
      default:
        return null;
    }
  }

  return (
    <>
      {/* Hero — Logo and tagline (always rendered) */}
      <section className="text-center mb-8 pt-4">
        <h1 className="flex flex-col items-center gap-2 mb-1">
          <img
            src="/branding/mush_logo.png"
            alt="ForageWise"
            width={72}
            height={72}
            className="h-[72px] w-[72px] rounded-2xl"
          />
          <span className="text-3xl font-bold text-brand-teal font-heading">
            ForageWise
          </span>
        </h1>
        <p className="text-brand-charcoal/70 dark:text-dark-text-muted text-sm">
          Mushroom, plant &amp; trail discovery in Tennessee
        </p>
      </section>

      <OnlineHint message="Go online to get live weather, sync your data, and see the latest community sightings." />

      <NearbyNow />

      {/* Customize button */}
      <div className="flex justify-end mb-4">
        <button
          onClick={() => setShowCustomizer(true)}
          aria-label="Customize homepage layout"
          className="min-h-[44px] flex items-center gap-1.5 rounded-lg px-3 py-2 text-brand-charcoal/60 dark:text-dark-text-muted hover:bg-brand-charcoal/5 dark:hover:bg-dark-border transition-colors"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <span className="text-xs font-medium">Customize</span>
        </button>
      </div>

      {/* Dynamic sections based on layout config */}
      {loaded && sections.map((key) => renderSection(key))}

      {/* Community Link (always rendered as part of navigation) */}
      <section className="mb-8">
        <Link
          href="/community"
          className="flex items-center justify-center gap-2 w-full rounded-lg border border-brand-teal/20 bg-white/80 dark:bg-dark-surface/80 px-4 py-3 text-sm font-semibold text-brand-teal transition-colors hover:bg-brand-teal/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-teal active:scale-[0.98] min-h-[44px]"
        >
          <svg
            aria-hidden="true"
            className="w-5 h-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z"
            />
          </svg>
          Explore Community Sightings
        </Link>
      </section>

      {/* Safety Notice (always rendered) */}
      <section
        aria-label="Safety notice"
        className="rounded-lg bg-brand-earth/10 border border-brand-earth/20 p-4 text-center"
      >
        <p className="text-xs text-brand-earth dark:text-brand-earth-300 font-medium leading-relaxed">
          ForageWise provides identification assistance only. Always verify with
          a qualified expert before consuming any wild species.
        </p>
      </section>

      {/* Customizer modal */}
      {showCustomizer && (
        <HomepageCustomizer
          currentSections={sections}
          onSave={handleSave}
          onCancel={handleCancel}
        />
      )}
    </>
  );
}
