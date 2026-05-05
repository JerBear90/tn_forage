'use client';

import { useState } from 'react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type ReleaseType = 'feature' | 'fix' | 'improvement' | 'security';

interface ReleaseEntry {
  id: string;
  version: string;
  date: string;
  title: string;
  description: string;
  type: ReleaseType;
  items: string[];
}

// ---------------------------------------------------------------------------
// Release Data
// ---------------------------------------------------------------------------

const RELEASES: ReleaseEntry[] = [
  {
    id: 'v1.8.0',
    version: '1.8.0',
    date: '2026-05-05',
    title: 'Admin Analytics Dashboard',
    description: 'Comprehensive analytics, monitoring, and management dashboard for super users.',
    type: 'feature',
    items: [
      'Analytics overview with page views, active users, session duration, error count',
      'User management with search, role change, disable/enable',
      'Push notification broadcasting with templates and scheduling',
      'Content moderation for sightings and blog articles',
      'Retention metrics (DAU/WAU/MAU, churn, cohort table)',
      'Funnel tracking (identification + onboarding flows)',
      'Search analytics (top terms, zero-results, CTR, content gaps)',
      'Onboarding completion tracking with milestone flagging',
      'Revenue metrics (MRR, conversion, churn, Stripe link)',
      'Anomaly detection and alerts with configurable thresholds',
      'Export service (JSON/CSV) with timeout and chunked blobs',
      'System health monitoring bar',
    ],
  },
  {
    id: 'v1.7.0',
    version: '1.7.0',
    date: '2026-05-05',
    title: 'Wizard Example Images & Releases Page',
    description: 'Added visual example images to identification wizard steps and release notes tracking.',
    type: 'improvement',
    items: [
      'Nearby Tree step now shows example images (Oak, Hickory, Elm, Maple, Pine, Poplar)',
      'Cap Shape step has images for all options (Convex, Flat, Funnel, Conical, Bell, Irregular)',
      'Stem Features step has images for all options (Thick, Thin, Ring, Volva, Hollow, Solid)',
      'Release notes page added to admin dashboard',
    ],
  },
  {
    id: 'v1.6.0',
    version: '1.6.0',
    date: '2026-05-04',
    title: 'Phase 3.4 Enhancements',
    description: 'Tree lookalikes, park social profiles, homepage customizer, and mushroom calendar.',
    type: 'feature',
    items: [
      'Tree lookalike comparisons with bark/leaf close-ups',
      'Park social media profiles (Facebook, Instagram, X, YouTube, TikTok)',
      'Customizable homepage with drag-to-reorder sections',
      'Mushroom calendar with monthly species view',
      'Community sub-sections (sightings, challenges, blog)',
      'Breadcrumb navigation with referrer tracking',
    ],
  },
  {
    id: 'v1.5.1',
    version: '1.5.1',
    date: '2026-05-04',
    title: 'Build & Lint Fixes',
    description: 'Resolved TypeScript errors, ESLint issues, and service worker compatibility.',
    type: 'fix',
    items: [
      'Fixed 35 TypeScript errors for CI',
      'Resolved ESLint missing rule errors',
      'Moved custom SW to worker/ directory for next-pwa compatibility',
      'Disabled no-img-element lint rule for Vercel build',
      'Fixed white screen — lazy-load PocketBase to avoid SSR crash',
    ],
  },
  {
    id: 'v1.5.0',
    version: '1.5.0',
    date: '2026-05-04',
    title: 'Phase 3 Enhancements',
    description: 'Map conditions, season heatmap, disclaimers, PWA fixes, and ID wizard improvements.',
    type: 'feature',
    items: [
      'Foraging conditions layer on map',
      'Season heatmap visualization',
      'Dismissible safety disclaimers',
      'PWA install prompt and splash screen fixes',
      'Weather condition icon in top bar',
      'Background Sync service worker for offline queue',
      'ID Wizard: moved photo option to top, enlarged example images with lightbox',
      'PocketBase sync worker with auto-sync on reconnect',
      'Temperature display from weather.gov API',
      'Restructured navigation (Field Guide/Map/ID/Community/Plan)',
    ],
  },
  {
    id: 'v1.4.0',
    version: '1.4.0',
    date: '2026-04-30',
    title: 'Social Profiles & Park Details',
    description: 'User profiles, reviews, follows, activity feeds, and enhanced park pages.',
    type: 'feature',
    items: [
      'Extended user profiles with bio, followers, achievements',
      'Review system for parks, trails, and species (1-5 stars)',
      'Follow/unfollow other foragers',
      'Activity feed with recent actions',
      'Achievement tracking and badges',
      'Social photo sharing with location tagging',
      'Enhanced trail data with trailheads and surface types',
      'Added Identify link to bottom navigation',
    ],
  },
  {
    id: 'v1.3.0',
    version: '1.3.0',
    date: '2026-04-30',
    title: 'Phase 2 — Seed Data, Search & Community',
    description: 'Full seed data, global search, community features, and UI components.',
    type: 'feature',
    items: [
      'Species, plants, trees, parks, trails seed data',
      'Global search across all IndexedDB stores',
      'Community sightings and challenges',
      'Batch record fetching with expanded schema',
      'Image downloads from Wikimedia Commons',
    ],
  },
  {
    id: 'v1.2.0',
    version: '1.2.0',
    date: '2026-04-29',
    title: 'ForageFlow Phases 3–16',
    description: 'Core app features: field guide, maps, trips, identification, offline support.',
    type: 'feature',
    items: [
      'Comprehensive field guide with 30+ mushroom species',
      'Interactive map with park and trail overlays',
      'Trip planning with park/trail selection',
      'Guided identification wizard (10 steps)',
      'AI photo identification with guided angles',
      'Offline-first IndexedDB storage',
      'Service Worker caching with Workbox',
      'Membership plans and Stripe integration',
      'Safety beacon and location sharing',
      'Foraging journal with weather tagging',
    ],
  },
  {
    id: 'v1.1.0',
    version: '1.1.0',
    date: '2026-04-29',
    title: 'ForageFlow Phase 2',
    description: 'Extended features and data layer improvements.',
    type: 'feature',
    items: [
      'Fruiting forecasts based on weather conditions',
      'Spore print color scanner',
      'Voice identification assistant',
      'Seasonal countdown timers',
      'Buddy matching for foraging partners',
      'Microhabitat pin mapping',
    ],
  },
  {
    id: 'v1.0.0',
    version: '1.0.0',
    date: '2026-04-29',
    title: 'Initial Release — Project Foundation',
    description: 'Project setup, branding, authentication, and security hardening.',
    type: 'feature',
    items: [
      'Next.js 14 App Router project setup',
      'PocketBase backend integration',
      'Brand identity (ForageWise logo, color tokens, typography)',
      'Authentication with email/password and SSO (Google, Apple)',
      'Role-based access control (guest, free, member, super_user)',
      'Security hardening (.gitignore for secrets, credentials, PocketBase)',
      'Dark mode support with TailwindCSS',
      'Accessibility-first component patterns (44px targets, ARIA labels)',
    ],
  },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const TYPE_STYLES: Record<ReleaseType, { bg: string; text: string; label: string; icon: string }> = {
  feature: {
    bg: 'bg-brand-teal/10 dark:bg-brand-teal/20',
    text: 'text-brand-teal',
    label: 'Feature',
    icon: '✨',
  },
  fix: {
    bg: 'bg-red-100 dark:bg-red-900/20',
    text: 'text-red-700 dark:text-red-400',
    label: 'Bug Fix',
    icon: '🐛',
  },
  improvement: {
    bg: 'bg-blue-100 dark:bg-blue-900/20',
    text: 'text-blue-700 dark:text-blue-400',
    label: 'Improvement',
    icon: '💡',
  },
  security: {
    bg: 'bg-yellow-100 dark:bg-yellow-900/20',
    text: 'text-yellow-700 dark:text-yellow-400',
    label: 'Security',
    icon: '🔒',
  },
};

function formatDate(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00');
  return date.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

// ---------------------------------------------------------------------------
// Components
// ---------------------------------------------------------------------------

function TypeBadge({ type }: { type: ReleaseType }) {
  const style = TYPE_STYLES[type];
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${style.bg} ${style.text}`}>
      <span aria-hidden="true">{style.icon}</span>
      {style.label}
    </span>
  );
}

function ReleaseCard({ release }: { release: ReleaseEntry }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="rounded-xl border border-brand-charcoal/10 dark:border-brand-sand/10 bg-white dark:bg-brand-charcoal/50 p-5 shadow-sm">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <span className="text-sm font-bold text-brand-teal font-mono">v{release.version}</span>
          <TypeBadge type={release.type} />
        </div>
        <time className="text-xs text-gray-500 dark:text-gray-400" dateTime={release.date}>
          {formatDate(release.date)}
        </time>
      </div>

      {/* Title & Description */}
      <h3 className="mt-3 text-base font-semibold text-brand-charcoal dark:text-brand-sand">
        {release.title}
      </h3>
      <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
        {release.description}
      </p>

      {/* Expand/Collapse */}
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        aria-expanded={expanded}
        aria-label={expanded ? 'Collapse release details' : 'Expand release details'}
        className="mt-3 min-h-[44px] inline-flex items-center gap-1 text-sm font-medium text-brand-teal hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-teal"
      >
        {expanded ? 'Hide details' : `Show ${release.items.length} changes`}
        <svg
          className={`h-4 w-4 transition-transform ${expanded ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Items list */}
      {expanded && (
        <ul className="mt-3 space-y-1.5 border-t border-brand-charcoal/5 dark:border-brand-sand/5 pt-3" aria-label="Release changes">
          {release.items.map((item, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-teal" aria-hidden="true" />
              {item}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Filter
// ---------------------------------------------------------------------------

type FilterType = 'all' | ReleaseType;

function FilterBar({ selected, onChange }: { selected: FilterType; onChange: (f: FilterType) => void }) {
  const filters: { key: FilterType; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'feature', label: '✨ Features' },
    { key: 'fix', label: '🐛 Fixes' },
    { key: 'improvement', label: '💡 Improvements' },
    { key: 'security', label: '🔒 Security' },
  ];

  return (
    <div className="flex flex-wrap gap-2" role="group" aria-label="Filter releases by type">
      {filters.map(({ key, label }) => (
        <button
          key={key}
          type="button"
          onClick={() => onChange(key)}
          aria-pressed={selected === key}
          className={`min-h-[44px] min-w-[44px] rounded-lg px-4 py-2 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-teal ${
            selected === key
              ? 'bg-brand-teal text-white'
              : 'bg-brand-sand/50 dark:bg-brand-charcoal/50 text-brand-charcoal dark:text-brand-sand hover:bg-brand-teal/10 dark:hover:bg-brand-teal/10'
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function ReleasesPage() {
  const [filter, setFilter] = useState<FilterType>('all');

  const filtered = filter === 'all'
    ? RELEASES
    : RELEASES.filter((r) => r.type === filter);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-brand-charcoal dark:text-brand-sand">
          Release Notes
        </h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Track features, fixes, improvements, and security updates across versions
        </p>
      </div>

      {/* Filter */}
      <FilterBar selected={filter} onChange={setFilter} />

      {/* Release List */}
      <div className="space-y-4">
        {filtered.length === 0 ? (
          <div className="rounded-xl border border-brand-charcoal/10 dark:border-brand-sand/10 bg-white dark:bg-brand-charcoal/50 p-8 text-center">
            <p className="text-sm text-gray-500 dark:text-gray-400">No releases found for this filter.</p>
          </div>
        ) : (
          filtered.map((release) => (
            <ReleaseCard key={release.id} release={release} />
          ))
        )}
      </div>

      {/* Summary */}
      <div className="rounded-xl border border-brand-charcoal/10 dark:border-brand-sand/10 bg-brand-sand/30 dark:bg-brand-charcoal/30 p-4 text-center">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {RELEASES.length} releases • Latest: v{RELEASES[0].version} ({formatDate(RELEASES[0].date)})
        </p>
      </div>
    </div>
  );
}
