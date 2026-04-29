'use client';

import dynamic from 'next/dynamic';
import { useCallback, useState } from 'react';
import { useMapData } from '@/hooks/useMapData';
import MapDetailPanel from '@/map/MapDetailPanel';
import MapListView from '@/map/MapListView';
import type { DetailPanelItem } from '@/map/MapDetailPanel';

/**
 * Dynamically import the Leaflet map component with SSR disabled.
 * Leaflet requires `window` and cannot render on the server.
 */
const ForageFlowMap = dynamic(() => import('@/map/ForageFlowMap'), {
  ssr: false,
  loading: () => (
    <div
      className="flex items-center justify-center h-full w-full bg-brand-teal/5 dark:bg-brand-teal/10 rounded-xl"
      role="status"
      aria-label="Loading map"
    >
      <div className="flex flex-col items-center gap-2">
        <svg
          aria-hidden="true"
          className="w-10 h-10 text-brand-teal/40 animate-pulse"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.5}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9 6.75V15m6-6v8.25m.503-12.713l5.248-2.187A.75.75 0 0121.75 3v14.25a.75.75 0 01-.497.702l-5.253 2.188a.75.75 0 01-.503 0L9.75 17.953a.75.75 0 00-.503 0l-5.248 2.187A.75.75 0 013 19.39V5.14a.75.75 0 01.497-.702l5.253-2.188a.75.75 0 01.503 0L15 5.327"
          />
        </svg>
        <p className="text-sm text-brand-teal/60 font-medium">
          Loading map…
        </p>
      </div>
    </div>
  ),
});

/** View mode for the map page */
export type MapViewMode = 'map' | 'list';

export default function MapPageClient() {
  const { parks, trails, routes, loading, error } = useMapData();
  const [panelItem, setPanelItem] = useState<DetailPanelItem | null>(null);
  const [viewMode, setViewMode] = useState<MapViewMode>('map');

  /**
   * Look up the park name for a given parkId.
   */
  const getParkName = useCallback(
    (parkId: string): string | undefined => {
      const park = parks.find((p) => p.id === parkId);
      return park?.name;
    },
    [parks]
  );

  /**
   * Handle marker/polyline clicks from the map or list view.
   *
   * Route panels stay open even when clicking other map elements —
   * if a route panel is currently open and the user clicks a park or trail,
   * we keep the route panel. Only clicking another route or the close button
   * will dismiss it.
   */
  const handleMarkerClick = useCallback(
    (type: 'park' | 'trail' | 'route', id: string) => {
      // If a route panel is open and the user clicks a non-route element, keep the route panel
      if (panelItem?.type === 'route' && type !== 'route') {
        return;
      }

      if (type === 'park') {
        const park = parks.find((p) => p.id === id);
        if (park) {
          setPanelItem({ type: 'park', data: park });
        }
      } else if (type === 'trail') {
        const trail = trails.find((t) => t.id === id);
        if (trail) {
          setPanelItem({
            type: 'trail',
            data: trail,
            parkName: getParkName(trail.parkId),
          });
        }
      } else if (type === 'route') {
        const route = routes.find((r) => r.id === id);
        if (route) {
          setPanelItem({
            type: 'route',
            data: route,
            parkName: getParkName(route.parkId),
          });
        }
      }
    },
    [parks, trails, routes, panelItem, getParkName]
  );

  /**
   * Handle list item clicks — opens the detail panel just like a map marker.
   */
  const handleListItemClick = useCallback(
    (type: 'park' | 'trail', id: string) => {
      handleMarkerClick(type, id);
    },
    [handleMarkerClick]
  );

  const handleClosePanel = useCallback(() => {
    setPanelItem(null);
  }, []);

  return (
    <main className="flex flex-col h-[calc(100vh-4rem)]">
      <header className="px-4 pt-4 pb-2 shrink-0">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-2xl font-bold text-brand-forest dark:text-brand-moss font-heading">
              Map
            </h1>
            <p className="text-sm text-brand-charcoal/70 dark:text-brand-sand/70 mt-1">
              Tennessee parks, trails, and routes. Previously viewed areas are
              available offline.
            </p>
          </div>

          {/* Map / List toggle */}
          <div
            className="shrink-0 flex rounded-lg border border-brand-forest/15 dark:border-brand-charcoal/30 overflow-hidden"
            role="group"
            aria-label="View mode"
          >
            <button
              type="button"
              onClick={() => setViewMode('map')}
              aria-pressed={viewMode === 'map'}
              className={`px-3 py-1.5 text-xs font-semibold transition-colors touch-manipulation ${
                viewMode === 'map'
                  ? 'bg-brand-teal text-white'
                  : 'bg-white dark:bg-brand-charcoal-800 text-brand-charcoal/70 dark:text-brand-sand/70 hover:bg-brand-teal/10'
              }`}
            >
              <span className="flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 6.75V15m6-6v8.25m.503-12.713l5.248-2.187A.75.75 0 0121.75 3v14.25a.75.75 0 01-.497.702l-5.253 2.188a.75.75 0 01-.503 0L9.75 17.953a.75.75 0 00-.503 0l-5.248 2.187A.75.75 0 013 19.39V5.14a.75.75 0 01.497-.702l5.253-2.188a.75.75 0 01.503 0L15 5.327" />
                </svg>
                Map
              </span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('list')}
              aria-pressed={viewMode === 'list'}
              className={`px-3 py-1.5 text-xs font-semibold transition-colors touch-manipulation ${
                viewMode === 'list'
                  ? 'bg-brand-teal text-white'
                  : 'bg-white dark:bg-brand-charcoal-800 text-brand-charcoal/70 dark:text-brand-sand/70 hover:bg-brand-teal/10'
              }`}
            >
              <span className="flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 6.75h12M8.25 12h12m-12 5.25h12M3.75 6.75h.007v.008H3.75V6.75zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zM3.75 12h.007v.008H3.75V12zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm-.375 5.25h.007v.008H3.75v-.008zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                </svg>
                List
              </span>
            </button>
          </div>
        </div>
      </header>

      {error && (
        <div
          className="mx-4 mb-2 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 px-4 py-2 text-sm text-red-700 dark:text-red-300"
          role="alert"
        >
          {error}
        </div>
      )}

      {/* Map view — hidden with CSS when in list mode to preserve Leaflet state */}
      <div
        className={`flex-1 mx-4 mb-4 rounded-xl overflow-hidden border border-brand-forest/10 relative ${
          viewMode === 'list' ? 'hidden' : ''
        }`}
        role="region"
        aria-label="Map view"
      >
        {loading ? (
          <div
            className="flex items-center justify-center h-full w-full bg-brand-teal/5 dark:bg-brand-teal/10"
            role="status"
            aria-label="Loading map data"
          >
            <p className="text-sm text-brand-teal/60 font-medium animate-pulse">
              Loading map data…
            </p>
          </div>
        ) : (
          <ForageFlowMap
            parks={parks}
            trails={trails}
            routes={routes}
            onMarkerClick={handleMarkerClick}
          />
        )}

        {/* Detail panel overlays the map */}
        <MapDetailPanel item={panelItem} onClose={handleClosePanel} />
      </div>

      {/* List view — shown when in list mode */}
      {viewMode === 'list' && (
        <div
          className="flex-1 mx-4 mb-4 rounded-xl overflow-hidden border border-brand-forest/10 dark:border-brand-charcoal/30 bg-brand-sand/50 dark:bg-brand-charcoal/50 relative"
          role="region"
          aria-label="List view"
        >
          {loading ? (
            <div
              className="flex items-center justify-center h-full w-full"
              role="status"
              aria-label="Loading list data"
            >
              <p className="text-sm text-brand-teal/60 font-medium animate-pulse">
                Loading data…
              </p>
            </div>
          ) : (
            <MapListView
              parks={parks}
              trails={trails}
              getParkName={getParkName}
              onItemClick={handleListItemClick}
            />
          )}

          {/* Detail panel overlays the list view too */}
          <MapDetailPanel item={panelItem} onClose={handleClosePanel} />
        </div>
      )}

      {/* Legend — only shown in map mode */}
      {viewMode === 'map' && (
        <div
          className="px-4 pb-4 shrink-0"
          aria-label="Map legend"
          role="complementary"
        >
          <div className="flex flex-wrap gap-4 text-xs text-brand-charcoal/70 dark:text-brand-sand/70">
            <span className="flex items-center gap-1.5">
              <span
                className="inline-block w-3 h-3 rounded-full bg-brand-teal"
                aria-hidden="true"
              />
              Parks
            </span>
            <span className="flex items-center gap-1.5">
              <span
                className="inline-block w-3 h-1.5 rounded bg-brand-moss"
                aria-hidden="true"
              />
              Trails
            </span>
            <span className="flex items-center gap-1.5">
              <span
                className="inline-block w-3 h-1.5 rounded bg-brand-earth border-dashed border border-brand-earth"
                aria-hidden="true"
              />
              Routes
            </span>
          </div>
        </div>
      )}
    </main>
  );
}
